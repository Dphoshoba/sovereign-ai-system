import {
  FederationRegistry,
  FederationNode,
  FederationMembership,
  MembershipStatus,
  NodeIdentity,
  FederationRole,
  CapabilityAdvertisement,
  TrustRelationship,
  TrustLevel,
  FederationEvent,
  FederationEventType,
  FederationRegistryError,
} from "./federation-registry";

// ── Defaults ──

const DEFAULT_HEARTBEAT_MS = 30000;
const DEFAULT_MEMBERSHIP_EXPIRY_MS = 120000;
const NODE_EXPIRY_CHECK_INTERVAL = 60000;

// ── Version comparison ──

function satisfiesMinVersion(version: string, minVersion: string): boolean {
  const vParts = version.split('.').map(Number);
  const mParts = minVersion.split('.').map(Number);
  for (let i = 0; i < Math.max(vParts.length, mParts.length); i++) {
    const v = vParts[i] ?? 0;
    const m = mParts[i] ?? 0;
    if (v > m) return true;
    if (v < m) return false;
  }
  return true;
}

let eventCounter = 0;

function nextEventId(): string {
  return `evt-${++eventCounter}-${Date.now()}`;
}

// ── Implementation ──

export class FederationRegistryImpl implements FederationRegistry {
  private nodes = new Map<string, FederationNode>();
  private trusts = new Map<string, TrustRelationship>();
  private events: FederationEvent[] = [];
  private lastExpiryCheck = 0;

  // ── Node Registration ──

  registerNode(
    identity: NodeIdentity,
    role: FederationRole,
    capabilities: readonly CapabilityAdvertisement[],
  ): FederationNode {
    if (this.nodes.has(identity.nodeId)) {
      throw new FederationRegistryError(`Node already registered: ${identity.nodeId}`);
    }

    const now = Date.now();
    const membership: FederationMembership = {
      nodeId: identity.nodeId,
      status: 'active',
      registeredAt: now,
      lastHeartbeat: now,
      heartbeatIntervalMs: DEFAULT_HEARTBEAT_MS,
      expiryMs: now + DEFAULT_MEMBERSHIP_EXPIRY_MS,
    };

    const node: FederationNode = {
      identity: { ...identity },
      role,
      capabilities: [...capabilities],
      membership,
    };

    this.nodes.set(identity.nodeId, node);
    this.recordEvent('NODE_REGISTERED', identity.nodeId, `Node registered as ${role}`);
    return node;
  }

  unregisterNode(nodeId: string): void {
    this.requireNode(nodeId);
    this.nodes.delete(nodeId);
    this.recordEvent('NODE_UNREGISTERED', nodeId, 'Node unregistered');
  }

  getNode(nodeId: string): FederationNode | undefined {
    this.checkExpired();
    return this.nodes.get(nodeId);
  }

  listNodes(): readonly FederationNode[] {
    this.checkExpired();
    return [...this.nodes.values()];
  }

  // ── Trust ──

  establishTrust(fromNodeId: string, toNodeId: string, level: TrustLevel): TrustRelationship {
    this.requireNode(fromNodeId);
    this.requireNode(toNodeId);

    const id = `trust-${fromNodeId}-${toNodeId}-${Date.now()}`;
    const relationship: TrustRelationship = {
      id,
      fromNode: fromNodeId,
      toNode: toNodeId,
      level,
      establishedAt: Date.now(),
      expiresAt: null,
    };

    this.trusts.set(id, relationship);
    this.recordEvent('TRUST_ESTABLISHED', fromNodeId, `Trust '${level}' established with ${toNodeId}`);
    return relationship;
  }

  revokeTrust(relationshipId: string): void {
    const rel = this.trusts.get(relationshipId);
    if (!rel) throw new FederationRegistryError(`Trust relationship not found: ${relationshipId}`);
    this.trusts.delete(relationshipId);
    this.recordEvent('TRUST_REVOKED', rel.fromNode, `Trust revoked with ${rel.toNode}`);
  }

  getTrustRelationships(nodeId: string): readonly TrustRelationship[] {
    return [...this.trusts.values()].filter(r => r.fromNode === nodeId || r.toNode === nodeId);
  }

  verifyTrust(fromNodeId: string, toNodeId: string): boolean {
    return [...this.trusts.values()].some(
      r => r.fromNode === fromNodeId && r.toNode === toNodeId && !this.isExpired(r),
    );
  }

  // ── Capabilities ──

  advertiseCapabilities(nodeId: string, capabilities: readonly CapabilityAdvertisement[]): void {
    const node = this.requireNode(nodeId);
    const updated: FederationNode = {
      ...node,
      capabilities: [...capabilities],
    };
    this.nodes.set(nodeId, updated);
    this.recordEvent('CAPABILITY_ADVERTISED', nodeId, `${capabilities.length} capability(ies) advertised`);
  }

  resolveCapability(capabilityType: string, minVersion: string): readonly FederationNode[] {
    this.checkExpired();
    return [...this.nodes.values()].filter(n =>
      n.membership.status === 'active' &&
      n.capabilities.some(c => c.type === capabilityType && satisfiesMinVersion(c.version, minVersion)),
    );
  }

  // ── Heartbeat ──

  heartbeat(nodeId: string): void {
    const node = this.requireNode(nodeId);
    const now = Date.now();
    const updated: FederationNode = {
      ...node,
      membership: {
        ...node.membership,
        status: 'active',
        lastHeartbeat: now,
        expiryMs: now + DEFAULT_MEMBERSHIP_EXPIRY_MS,
      },
    };
    this.nodes.set(nodeId, updated);
    this.recordEvent('NODE_HEARTBEAT', nodeId, 'Heartbeat received');
  }

  getMembership(nodeId: string): FederationMembership | undefined {
    this.checkExpired();
    return this.nodes.get(nodeId)?.membership;
  }

  // ── Audit ──

  getEvents(limit?: number): readonly FederationEvent[] {
    const all = [...this.events];
    return limit ? all.slice(-limit) : all;
  }

  // ── Internals ──

  private requireNode(nodeId: string): FederationNode {
    this.checkExpired();
    const node = this.nodes.get(nodeId);
    if (!node) throw new FederationRegistryError(`Node not found: ${nodeId}`);
    return node;
  }

  private isExpired(r: TrustRelationship): boolean {
    return r.expiresAt !== null && Date.now() > r.expiresAt;
  }

  private checkExpired(): void {
    const now = Date.now();
    if (now - this.lastExpiryCheck < NODE_EXPIRY_CHECK_INTERVAL) return;
    this.lastExpiryCheck = now;

    for (const [nodeId, node] of this.nodes) {
      if (node.membership.expiryMs !== null && now > node.membership.expiryMs) {
        if (node.membership.status === 'active') {
          const updated: FederationNode = {
            ...node,
            membership: { ...node.membership, status: 'inactive' },
          };
          this.nodes.set(nodeId, updated);
          this.recordEvent('MEMBERSHIP_EXPIRED', nodeId, 'Membership expired due to inactivity');
        }
      }
    }
  }

  private recordEvent(type: FederationEventType, nodeId: string, detail: string): void {
    this.events.push({
      id: nextEventId(),
      type,
      nodeId,
      detail,
      timestamp: Date.now(),
    });
  }
}
