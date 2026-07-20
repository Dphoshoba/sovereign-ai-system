// ── Identity ──

export interface NodeIdentity {
  readonly nodeId: string;
  readonly host: string;
  readonly platformVersion: string;
  readonly metadata: Readonly<Record<string, string>>;
}

// ── Role ──

export type FederationRole = 'participant' | 'observer' | 'coordinator';

// ── Capability ──

export interface CapabilityAdvertisement {
  readonly type: string;
  readonly version: string;
  readonly endpoints: readonly string[];
  readonly metadata: Readonly<Record<string, string>>;
}

// ── Membership ──

export type MembershipStatus = 'active' | 'inactive' | 'suspended' | 'removed';

export interface FederationMembership {
  readonly nodeId: string;
  readonly status: MembershipStatus;
  readonly registeredAt: number;
  readonly lastHeartbeat: number;
  readonly heartbeatIntervalMs: number;
  readonly expiryMs: number | null;
}

// ── Node ──

export interface FederationNode {
  readonly identity: NodeIdentity;
  readonly role: FederationRole;
  readonly capabilities: readonly CapabilityAdvertisement[];
  readonly membership: FederationMembership;
}

// ── Trust ──

export type TrustLevel = 'full' | 'limited' | 'observational';

export interface TrustRelationship {
  readonly id: string;
  readonly fromNode: string;
  readonly toNode: string;
  readonly level: TrustLevel;
  readonly establishedAt: number;
  readonly expiresAt: number | null;
}

// ── Audit ──

export type FederationEventType =
  | 'NODE_REGISTERED'
  | 'NODE_UNREGISTERED'
  | 'NODE_HEARTBEAT'
  | 'NODE_SUSPENDED'
  | 'TRUST_ESTABLISHED'
  | 'TRUST_REVOKED'
  | 'CAPABILITY_ADVERTISED'
  | 'MEMBERSHIP_EXPIRED';

export interface FederationEvent {
  readonly id: string;
  readonly type: FederationEventType;
  readonly nodeId: string;
  readonly detail: string;
  readonly timestamp: number;
}

// ── Registry ──

export interface FederationRegistry {
  registerNode(identity: NodeIdentity, role: FederationRole, capabilities: readonly CapabilityAdvertisement[]): FederationNode;
  unregisterNode(nodeId: string): void;
  getNode(nodeId: string): FederationNode | undefined;
  listNodes(): readonly FederationNode[];

  establishTrust(fromNodeId: string, toNodeId: string, level: TrustLevel): TrustRelationship;
  revokeTrust(relationshipId: string): void;
  getTrustRelationships(nodeId: string): readonly TrustRelationship[];
  verifyTrust(fromNodeId: string, toNodeId: string): boolean;

  advertiseCapabilities(nodeId: string, capabilities: readonly CapabilityAdvertisement[]): void;
  resolveCapability(capabilityType: string, minVersion: string): readonly FederationNode[];

  heartbeat(nodeId: string): void;
  getMembership(nodeId: string): FederationMembership | undefined;

  getEvents(limit?: number): readonly FederationEvent[];
}

// ── Error ──

export class FederationRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FederationRegistryError';
  }
}
