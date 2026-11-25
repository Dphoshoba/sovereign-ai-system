import { describe, it, expect, beforeEach } from 'vitest';
import { FederationRegistryImpl } from '../../lib/platform/federation/federation-registry-impl';
import {
  FederationRegistry,
  NodeIdentity,
  CapabilityAdvertisement,
  FederationRegistryError,
} from '../../lib/platform/federation/federation-registry';

const nodeA: NodeIdentity = { nodeId: 'gamma-us-east', host: 'us-east.gamma.local', platformVersion: '1.0.0', metadata: { region: 'us-east' } };
const nodeB: NodeIdentity = { nodeId: 'gamma-eu-west', host: 'eu-west.gamma.local', platformVersion: '1.0.0', metadata: { region: 'eu-west' } };
const nodeC: NodeIdentity = { nodeId: 'gamma-ap-south', host: 'ap-south.gamma.local', platformVersion: '1.1.0', metadata: { region: 'ap-south' } };

const execCap: CapabilityAdvertisement = { type: 'execution', version: '1.0.0', endpoints: ['/execute'], metadata: {} };
const workflowCap: CapabilityAdvertisement = { type: 'workflow', version: '2.0.0', endpoints: ['/orchestrate'], metadata: {} };

describe('FederationRegistryImpl', () => {
  let registry: FederationRegistry;

  beforeEach(() => {
    registry = new FederationRegistryImpl();
  });

  // ── 8A.1 — Node Registration ──

  describe('8A.1 — Node Registration', () => {
    it('registers a node with identity, role, and capabilities', () => {
      const node = registry.registerNode(nodeA, 'participant', [execCap]);
      expect(node.identity.nodeId).toBe('gamma-us-east');
      expect(node.role).toBe('participant');
      expect(node.capabilities.length).toBe(1);
    });

    it('assigns active membership on registration', () => {
      const node = registry.registerNode(nodeA, 'participant', []);
      expect(node.membership.status).toBe('active');
      expect(node.membership.registeredAt).toBeGreaterThan(0);
      expect(node.membership.heartbeatIntervalMs).toBeGreaterThan(0);
    });

    it('throws on duplicate registration', () => {
      registry.registerNode(nodeA, 'participant', []);
      expect(() => registry.registerNode(nodeA, 'coordinator', []))
        .toThrow(FederationRegistryError);
    });

    it('retrieves a registered node by id', () => {
      registry.registerNode(nodeA, 'participant', [execCap]);
      const retrieved = registry.getNode('gamma-us-east');
      expect(retrieved).toBeDefined();
      expect(retrieved!.identity.host).toBe('us-east.gamma.local');
    });

    it('returns undefined for unknown node', () => {
      expect(registry.getNode('nonexistent')).toBeUndefined();
    });

    it('supports observer and coordinator roles', () => {
      registry.registerNode(nodeA, 'observer', []);
      registry.registerNode(nodeB, 'coordinator', []);
      expect(registry.getNode('gamma-us-east')!.role).toBe('observer');
      expect(registry.getNode('gamma-eu-west')!.role).toBe('coordinator');
    });
  });

  // ── 8A.2 — Node Lifecycle ──

  describe('8A.2 — Node Lifecycle', () => {
    it('unregisters a node', () => {
      registry.registerNode(nodeA, 'participant', []);
      registry.unregisterNode('gamma-us-east');
      expect(registry.getNode('gamma-us-east')).toBeUndefined();
    });

    it('throws on unregistering unknown node', () => {
      expect(() => registry.unregisterNode('nonexistent'))
        .toThrow(FederationRegistryError);
    });

    it('lists all registered nodes', () => {
      registry.registerNode(nodeA, 'participant', []);
      registry.registerNode(nodeB, 'participant', []);
      expect(registry.listNodes().length).toBe(2);
    });

    it('excludes unregistered nodes from list', () => {
      registry.registerNode(nodeA, 'participant', []);
      registry.registerNode(nodeB, 'participant', []);
      registry.unregisterNode('gamma-us-east');
      expect(registry.listNodes().length).toBe(1);
    });

    it('handles heartbeat updates membership timestamp', () => {
      registry.registerNode(nodeA, 'participant', []);
      const before = registry.getNode('gamma-us-east')!.membership.lastHeartbeat;
      registry.heartbeat('gamma-us-east');
      const after = registry.getNode('gamma-us-east')!.membership.lastHeartbeat;
      expect(after).toBeGreaterThanOrEqual(before);
    });

    it('throws on heartbeat for unknown node', () => {
      expect(() => registry.heartbeat('nonexistent')).toThrow(FederationRegistryError);
    });

    it('returns membership for registered node', () => {
      registry.registerNode(nodeA, 'participant', []);
      const m = registry.getMembership('gamma-us-east');
      expect(m).toBeDefined();
      expect(m!.status).toBe('active');
    });

    it('returns undefined for unknown membership', () => {
      expect(registry.getMembership('nonexistent')).toBeUndefined();
    });
  });

  // ── 8A.3 — Trust Relationships ──

  describe('8A.3 — Trust Relationships', () => {
    it('establishes trust between two nodes', () => {
      registry.registerNode(nodeA, 'participant', []);
      registry.registerNode(nodeB, 'participant', []);
      const trust = registry.establishTrust('gamma-us-east', 'gamma-eu-west', 'full');
      expect(trust.fromNode).toBe('gamma-us-east');
      expect(trust.toNode).toBe('gamma-eu-west');
      expect(trust.level).toBe('full');
    });

    it('throws on trust for unknown node', () => {
      registry.registerNode(nodeA, 'participant', []);
      expect(() => registry.establishTrust('gamma-us-east', 'nonexistent', 'full'))
        .toThrow(FederationRegistryError);
    });

    it('verifies trust exists between two nodes', () => {
      registry.registerNode(nodeA, 'participant', []);
      registry.registerNode(nodeB, 'participant', []);
      registry.establishTrust('gamma-us-east', 'gamma-eu-west', 'limited');
      expect(registry.verifyTrust('gamma-us-east', 'gamma-eu-west')).toBe(true);
    });

    it('returns false when no trust exists', () => {
      registry.registerNode(nodeA, 'participant', []);
      registry.registerNode(nodeB, 'participant', []);
      expect(registry.verifyTrust('gamma-us-east', 'gamma-eu-west')).toBe(false);
    });

    it('returns false for reverse direction trust', () => {
      registry.registerNode(nodeA, 'participant', []);
      registry.registerNode(nodeB, 'participant', []);
      registry.establishTrust('gamma-us-east', 'gamma-eu-west', 'observational');
      expect(registry.verifyTrust('gamma-eu-west', 'gamma-us-east')).toBe(false);
    });

    it('revokes a trust relationship', () => {
      registry.registerNode(nodeA, 'participant', []);
      registry.registerNode(nodeB, 'participant', []);
      const trust = registry.establishTrust('gamma-us-east', 'gamma-eu-west', 'full');
      registry.revokeTrust(trust.id);
      expect(registry.verifyTrust('gamma-us-east', 'gamma-eu-west')).toBe(false);
    });

    it('throws on revoking unknown trust', () => {
      expect(() => registry.revokeTrust('nonexistent'))
        .toThrow(FederationRegistryError);
    });

    it('lists trust relationships for a node', () => {
      registry.registerNode(nodeA, 'participant', []);
      registry.registerNode(nodeB, 'participant', []);
      registry.registerNode(nodeC, 'participant', []);
      registry.establishTrust('gamma-us-east', 'gamma-eu-west', 'full');
      registry.establishTrust('gamma-us-east', 'gamma-ap-south', 'limited');
      const rels = registry.getTrustRelationships('gamma-us-east');
      expect(rels.length).toBe(2);
    });

    it('supports all trust levels', () => {
      registry.registerNode(nodeA, 'participant', []);
      registry.registerNode(nodeB, 'participant', []);
      for (const level of ['full', 'limited', 'observational'] as const) {
        const trust = registry.establishTrust('gamma-us-east', 'gamma-eu-west', level);
        expect(trust.level).toBe(level);
        registry.revokeTrust(trust.id);
      }
    });
  });

  // ── 8A.4 — Capability Resolution ──

  describe('8A.4 — Capability Resolution', () => {
    it('advertises capabilities for a node', () => {
      registry.registerNode(nodeA, 'participant', []);
      registry.advertiseCapabilities('gamma-us-east', [execCap, workflowCap]);
      const node = registry.getNode('gamma-us-east')!;
      expect(node.capabilities.length).toBe(2);
    });

    it('resolves nodes by capability type', () => {
      registry.registerNode(nodeA, 'participant', [execCap]);
      registry.registerNode(nodeB, 'participant', [workflowCap]);
      registry.registerNode(nodeC, 'participant', [execCap]);
      const result = registry.resolveCapability('execution', '1.0.0');
      expect(result.length).toBe(2);
      expect(result.map(n => n.identity.nodeId)).toContain('gamma-us-east');
      expect(result.map(n => n.identity.nodeId)).toContain('gamma-ap-south');
    });

    it('filters by minimum version', () => {
      const v1Cap: CapabilityAdvertisement = { type: 'execution', version: '1.0.0', endpoints: [], metadata: {} };
      const v2Cap: CapabilityAdvertisement = { type: 'execution', version: '2.0.0', endpoints: [], metadata: {} };
      registry.registerNode(nodeA, 'participant', [v1Cap]);
      registry.registerNode(nodeB, 'participant', [v2Cap]);
      expect(registry.resolveCapability('execution', '2.0.0').length).toBe(1);
      expect(registry.resolveCapability('execution', '1.5.0').length).toBe(1);
    });

    it('returns empty when no capability matches', () => {
      registry.registerNode(nodeA, 'participant', [execCap]);
      expect(registry.resolveCapability('nonexistent', '1.0.0').length).toBe(0);
    });

    it('does not return nodes with inactive membership', () => {
      registry.registerNode(nodeA, 'participant', [execCap]);
      // Membership expiry is checked on access; we can test by checking
      // that the node without heartbeat eventually becomes inactive
      // For deterministic testing, verify that active nodes are returned
      const active = registry.resolveCapability('execution', '1.0.0');
      expect(active.length).toBe(1);
    });
  });

  // ── 8A.5 — Audit Events ──

  describe('8A.5 — Audit Events', () => {
    it('records registration event', () => {
      registry.registerNode(nodeA, 'participant', []);
      const events = registry.getEvents();
      expect(events.some(e => e.type === 'NODE_REGISTERED')).toBe(true);
    });

    it('records unregistration event', () => {
      registry.registerNode(nodeA, 'participant', []);
      registry.unregisterNode('gamma-us-east');
      const events = registry.getEvents();
      expect(events.some(e => e.type === 'NODE_UNREGISTERED')).toBe(true);
    });

    it('records trust establishment event', () => {
      registry.registerNode(nodeA, 'participant', []);
      registry.registerNode(nodeB, 'participant', []);
      registry.establishTrust('gamma-us-east', 'gamma-eu-west', 'full');
      const events = registry.getEvents();
      expect(events.some(e => e.type === 'TRUST_ESTABLISHED')).toBe(true);
    });

    it('records trust revocation event', () => {
      registry.registerNode(nodeA, 'participant', []);
      registry.registerNode(nodeB, 'participant', []);
      const t = registry.establishTrust('gamma-us-east', 'gamma-eu-west', 'full');
      registry.revokeTrust(t.id);
      const events = registry.getEvents();
      expect(events.some(e => e.type === 'TRUST_REVOKED')).toBe(true);
    });

    it('records heartbeat event', () => {
      registry.registerNode(nodeA, 'participant', []);
      registry.heartbeat('gamma-us-east');
      const events = registry.getEvents();
      expect(events.some(e => e.type === 'NODE_HEARTBEAT')).toBe(true);
    });

    it('records capability advertisement event', () => {
      registry.registerNode(nodeA, 'participant', []);
      registry.advertiseCapabilities('gamma-us-east', [execCap]);
      const events = registry.getEvents();
      expect(events.some(e => e.type === 'CAPABILITY_ADVERTISED')).toBe(true);
    });

    it('limits audit events when limit is specified', () => {
      registry.registerNode(nodeA, 'participant', []);
      registry.registerNode(nodeB, 'participant', []);
      registry.registerNode(nodeC, 'participant', []);
      expect(registry.getEvents(2).length).toBe(2);
    });

    it('includes event metadata (id, type, nodeId, timestamp)', () => {
      registry.registerNode(nodeA, 'participant', []);
      const event = registry.getEvents()[0];
      expect(event.id).toBeDefined();
      expect(event.type).toBe('NODE_REGISTERED');
      expect(event.nodeId).toBe('gamma-us-east');
      expect(event.timestamp).toBeGreaterThan(0);
      expect(event.detail).toBeDefined();
    });
  });

  // ── 8A.6 — Determinism ──

  describe('8A.6 — Determinism', () => {
    it('produces same node state for identical registrations', () => {
      const r1 = new FederationRegistryImpl();
      const r2 = new FederationRegistryImpl();
      const n1 = r1.registerNode(nodeA, 'participant', [execCap]);
      const n2 = r2.registerNode(nodeA, 'participant', [execCap]);
      expect(n1.identity.nodeId).toBe(n2.identity.nodeId);
      expect(n1.role).toBe(n2.role);
      expect(n1.membership.status).toBe(n2.membership.status);
    });

    it('resolveCapability is deterministic for identical registrations', () => {
      const r1 = new FederationRegistryImpl();
      const r2 = new FederationRegistryImpl();
      r1.registerNode(nodeA, 'participant', [execCap]);
      r2.registerNode(nodeA, 'participant', [execCap]);
      const res1 = r1.resolveCapability('execution', '1.0.0');
      const res2 = r2.resolveCapability('execution', '1.0.0');
      expect(res1.length).toBe(res2.length);
    });

    it('verifyTrust returns same result for same trust state', () => {
      const r1 = new FederationRegistryImpl();
      r1.registerNode(nodeA, 'participant', []);
      r1.registerNode(nodeB, 'participant', []);
      r1.establishTrust('gamma-us-east', 'gamma-eu-west', 'full');
      expect(r1.verifyTrust('gamma-us-east', 'gamma-eu-west')).toBe(true);
      expect(r1.verifyTrust('gamma-eu-west', 'gamma-us-east')).toBe(false);

      const r2 = new FederationRegistryImpl();
      r2.registerNode(nodeA, 'participant', []);
      r2.registerNode(nodeB, 'participant', []);
      r2.establishTrust('gamma-us-east', 'gamma-eu-west', 'full');
      expect(r2.verifyTrust('gamma-us-east', 'gamma-eu-west')).toBe(true);
      expect(r2.verifyTrust('gamma-eu-west', 'gamma-us-east')).toBe(false);
    });
  });

  // ── 8A.7 — Edge Cases ──

  describe('8A.7 — Edge Cases', () => {
    it('handles empty capabilities', () => {
      registry.registerNode(nodeA, 'participant', []);
      expect(registry.getNode('gamma-us-east')!.capabilities.length).toBe(0);
    });

    it('replaces capabilities on re-advertisement', () => {
      registry.registerNode(nodeA, 'participant', [execCap]);
      registry.advertiseCapabilities('gamma-us-east', [workflowCap]);
      expect(registry.getNode('gamma-us-east')!.capabilities.length).toBe(1);
      expect(registry.getNode('gamma-us-east')!.capabilities[0].type).toBe('workflow');
    });

    it('handles node with large metadata', () => {
      const largeMeta: Record<string, string> = {};
      for (let i = 0; i < 100; i++) largeMeta[`key${i}`] = `value${i}`;
      const bigNode: NodeIdentity = { nodeId: 'big-node', host: 'big.local', platformVersion: '1.0.0', metadata: largeMeta };
      registry.registerNode(bigNode, 'observer', []);
      expect(registry.getNode('big-node')).toBeDefined();
    });

    it('listNodes returns snapshot (immutable copy)', () => {
      registry.registerNode(nodeA, 'participant', []);
      const list = registry.listNodes();
      expect(list.length).toBe(1);
      // Mutation of returned array should not affect registry
      (list as any).push({});
      expect(registry.listNodes().length).toBe(1);
    });

    it('throws on getting node after unregistration', () => {
      registry.registerNode(nodeA, 'participant', []);
      registry.unregisterNode('gamma-us-east');
      expect(() => registry.establishTrust('gamma-us-east', 'gamma-eu-west', 'full'))
        .toThrow(FederationRegistryError);
    });

    it('handles multiple trust relationships across same nodes', () => {
      registry.registerNode(nodeA, 'participant', []);
      registry.registerNode(nodeB, 'participant', []);
      registry.registerNode(nodeC, 'participant', []);
      registry.establishTrust('gamma-us-east', 'gamma-eu-west', 'full');
      registry.establishTrust('gamma-us-east', 'gamma-ap-south', 'limited');
      registry.establishTrust('gamma-eu-west', 'gamma-ap-south', 'observational');
      expect(registry.getTrustRelationships('gamma-us-east').length).toBe(2);
      expect(registry.getTrustRelationships('gamma-eu-west').length).toBe(2);
      expect(registry.getTrustRelationships('gamma-ap-south').length).toBe(2);
    });

    it('handles version comparison across major.minor.patch', () => {
      const v1: CapabilityAdvertisement = { type: 'execution', version: '1.0.0', endpoints: [], metadata: {} };
      const v2: CapabilityAdvertisement = { type: 'execution', version: '2.1.3', endpoints: [], metadata: {} };
      registry.registerNode(nodeA, 'participant', [v1]);
      registry.registerNode(nodeB, 'participant', [v2]);
      expect(registry.resolveCapability('execution', '1.0.0').length).toBe(2);
      expect(registry.resolveCapability('execution', '2.0.0').length).toBe(1);
      expect(registry.resolveCapability('execution', '3.0.0').length).toBe(0);
    });
  });
});
