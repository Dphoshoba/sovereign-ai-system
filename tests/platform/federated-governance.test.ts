import { describe, it, expect, beforeEach } from 'vitest';
import { FederationRegistryImpl } from '../../lib/platform/federation/federation-registry-impl';
import { FederatedGovernanceImpl } from '../../lib/platform/federation/federated-governance-impl';
import {
  FederatedGovernance,
  FederatedGovernanceError,
} from '../../lib/platform/federation/federated-governance';
import { NodeIdentity } from '../../lib/platform/federation/federation-registry';

const nodeA: NodeIdentity = { nodeId: 'gamma-us-east', host: 'us-east.gamma.local', platformVersion: '1.0.0', metadata: {} };
const nodeB: NodeIdentity = { nodeId: 'gamma-eu-west', host: 'eu-west.gamma.local', platformVersion: '1.0.0', metadata: {} };
const nodeC: NodeIdentity = { nodeId: 'gamma-ap-south', host: 'ap-south.gamma.local', platformVersion: '1.1.0', metadata: {} };

describe('FederatedGovernanceImpl', () => {
  let registry: FederationRegistryImpl;
  let governance: FederatedGovernance;

  beforeEach(() => {
    registry = new FederationRegistryImpl();
    registry.registerNode(nodeA, 'participant', []);
    registry.registerNode(nodeB, 'participant', []);
    registry.registerNode(nodeC, 'participant', []);
    governance = new FederatedGovernanceImpl(registry);
  });

  // ── 8C.1 — Policy Domains ──

  describe('8C.1 — Policy Domains', () => {
    it('creates a domain with named members', () => {
      const d = governance.createDomain('data-sync', ['gamma-us-east', 'gamma-eu-west']);
      expect(d.name).toBe('data-sync');
      expect(d.memberNodeIds).toContain('gamma-us-east');
      expect(d.memberNodeIds).toContain('gamma-eu-west');
    });

    it('throws on creating domain with unknown node', () => {
      expect(() => governance.createDomain('test', ['unknown'])).toThrow(FederatedGovernanceError);
    });

    it('adds member to existing domain', () => {
      const d = governance.createDomain('sync', ['gamma-us-east']);
      governance.addMember(d.id, 'gamma-eu-west');
      expect(governance.getDomain(d.id)!.memberNodeIds.length).toBe(2);
    });

    it('removes member from domain', () => {
      const d = governance.createDomain('sync', ['gamma-us-east', 'gamma-eu-west']);
      governance.removeMember(d.id, 'gamma-us-east');
      expect(governance.getDomain(d.id)!.memberNodeIds).not.toContain('gamma-us-east');
    });

    it('lists all domains', () => {
      governance.createDomain('a', ['gamma-us-east']);
      governance.createDomain('b', ['gamma-eu-west']);
      expect(governance.listDomains().length).toBe(2);
    });

    it('finds domains for a node', () => {
      const d1 = governance.createDomain('a', ['gamma-us-east', 'gamma-eu-west']);
      governance.createDomain('b', ['gamma-eu-west']);
      const forB = governance.getDomainsForNode('gamma-eu-west');
      expect(forB.length).toBe(2);
      const forA = governance.getDomainsForNode('gamma-us-east');
      expect(forA.length).toBe(1);
      expect(forA[0].id).toBe(d1.id);
    });
  });

  // ── 8C.2 — Policy Rules ──

  describe('8C.2 — Policy Rules', () => {
    it('adds a policy rule to a domain', () => {
      const d = governance.createDomain('sync', ['gamma-us-east']);
      const rule = governance.addPolicy(d.id, 'Allow data sync', 'allow', 'workflow_type', 'data-sync', 100);
      expect(rule.domainId).toBe(d.id);
      expect(rule.effect).toBe('allow');
    });

    it('removes a policy rule', () => {
      const d = governance.createDomain('sync', ['gamma-us-east']);
      const rule = governance.addPolicy(d.id, 'Deny backup', 'deny', 'workflow_type', 'backup', 100);
      governance.removePolicy(rule.id);
      expect(governance.getPolicies(d.id).length).toBe(0);
    });

    it('lists policies for a domain', () => {
      const d = governance.createDomain('sync', ['gamma-us-east']);
      governance.addPolicy(d.id, 'Allow sync', 'allow', 'workflow_type', 'data-sync', 100);
      governance.addPolicy(d.id, 'Deny backup', 'deny', 'workflow_type', 'backup', 200);
      expect(governance.getPolicies(d.id).length).toBe(2);
    });
  });

  // ── 8C.3 — Policy Overrides ──

  describe('8C.3 — Policy Overrides', () => {
    it('sets a local override on a policy rule', () => {
      const d = governance.createDomain('sync', ['gamma-us-east', 'gamma-eu-west']);
      const rule = governance.addPolicy(d.id, 'Deny sync', 'deny', 'workflow_type', 'data-sync', 100);
      const ovr = governance.setOverride(d.id, 'gamma-us-east', rule.id, 'allow', 'Local exception', 'admin');
      expect(ovr.newEffect).toBe('allow');
      expect(ovr.nodeId).toBe('gamma-us-east');
    });

    it('removes an override', () => {
      const d = governance.createDomain('sync', ['gamma-us-east']);
      const rule = governance.addPolicy(d.id, 'Deny sync', 'deny', 'workflow_type', 'data-sync', 100);
      const ovr = governance.setOverride(d.id, 'gamma-us-east', rule.id, 'allow', 'Exception', 'admin');
      governance.removeOverride(ovr.id);
      expect(governance.getOverrides(d.id, 'gamma-us-east').length).toBe(0);
    });

    it('lists overrides for domain and node', () => {
      const d = governance.createDomain('sync', ['gamma-us-east', 'gamma-eu-west']);
      const r1 = governance.addPolicy(d.id, 'Deny sync', 'deny', 'workflow_type', 'data-sync', 100);
      const r2 = governance.addPolicy(d.id, 'Deny backup', 'deny', 'workflow_type', 'backup', 100);
      governance.setOverride(d.id, 'gamma-us-east', r1.id, 'allow', 'Exception', 'admin');
      governance.setOverride(d.id, 'gamma-eu-west', r2.id, 'allow', 'EU exception', 'admin');
      expect(governance.getOverrides(d.id, 'gamma-us-east').length).toBe(1);
      expect(governance.getOverrides(d.id, 'gamma-eu-west').length).toBe(1);
    });
  });

  // ── 8C.4 — Policy Evaluation ──

  describe('8C.4 — Policy Evaluation', () => {
    it('allows action when no policies match', () => {
      const d = governance.createDomain('sync', ['gamma-us-east']);
      governance.addPolicy(d.id, 'Deny backup', 'deny', 'workflow_type', 'backup', 100);
      const result = governance.evaluateAction('gamma-us-east', 'data-sync', 'execution');
      expect(result.decision).toBe('allowed');
    });

    it('denies action when matching deny policy exists', () => {
      const d = governance.createDomain('sync', ['gamma-us-east']);
      governance.addPolicy(d.id, 'Deny data-sync', 'deny', 'workflow_type', 'data-sync', 100);
      const result = governance.evaluateAction('gamma-us-east', 'data-sync', 'execution');
      expect(result.decision).toBe('denied');
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('requires approval when matching policy requires it', () => {
      const d = governance.createDomain('sync', ['gamma-us-east']);
      governance.addPolicy(d.id, 'Approve data-sync', 'require_approval', 'workflow_type', 'data-sync', 100);
      const result = governance.evaluateAction('gamma-us-east', 'data-sync', 'execution');
      expect(result.decision).toBe('requires_approval');
      expect(result.requiresApprovalChain).toBe(true);
    });

    it('applies local override to flip deny to allow', () => {
      const d = governance.createDomain('sync', ['gamma-us-east', 'gamma-eu-west']);
      const rule = governance.addPolicy(d.id, 'Deny data-sync', 'deny', 'workflow_type', 'data-sync', 100);
      governance.setOverride(d.id, 'gamma-us-east', rule.id, 'allow', 'Local exception', 'admin');

      const forEast = governance.evaluateAction('gamma-us-east', 'data-sync', 'execution');
      expect(forEast.decision).toBe('allowed');
      expect(forEast.appliedOverrides.length).toBe(1);

      const forWest = governance.evaluateAction('gamma-eu-west', 'data-sync', 'execution');
      expect(forWest.decision).toBe('denied');
      expect(forWest.appliedOverrides.length).toBe(0);
    });

    it('returns allowed for node not in any domain', () => {
      const result = governance.evaluateAction('gamma-us-east', 'data-sync', 'execution');
      expect(result.decision).toBe('allowed');
    });

    it('uses highest priority rule when multiple match', () => {
      const d = governance.createDomain('sync', ['gamma-us-east']);
      governance.addPolicy(d.id, 'Low priority deny', 'deny', 'workflow_type', '*', 10);
      governance.addPolicy(d.id, 'High priority allow', 'allow', 'workflow_type', 'data-sync', 100);
      const result = governance.evaluateAction('gamma-us-east', 'data-sync', 'execution');
      expect(result.decision).toBe('allowed');
    });

    it('glob wildcard matches all workflow types', () => {
      const d = governance.createDomain('sync', ['gamma-us-east']);
      governance.addPolicy(d.id, 'Deny all', 'deny', 'workflow_type', '*', 10);
      expect(governance.evaluateAction('gamma-us-east', 'anything', 'execution').decision).toBe('denied');
    });
  });

  // ── 8C.5 — Approval Chains ──

  describe('8C.5 — Approval Chains', () => {
    it('creates an approval chain with required nodes', () => {
      const chain = governance.createApprovalChain('corr-1', 'data-sync', 'gamma-us-east', ['gamma-eu-west', 'gamma-ap-south']);
      expect(chain.steps.length).toBe(2);
      expect(chain.status).toBe('pending');
      expect(chain.steps.every(s => s.status === 'pending')).toBe(true);
    });

    it('approves a step in the chain', () => {
      const chain = governance.createApprovalChain('corr-1', 'data-sync', 'gamma-us-east', ['gamma-eu-west']);
      const updated = governance.approveStep(chain.id, 'gamma-eu-west', 'operator-eu', 'Looks good');
      expect(updated.steps[0].status).toBe('approved');
      expect(updated.steps[0].approvedBy).toBe('operator-eu');
      expect(updated.status).toBe('approved');
      expect(updated.completedAt).toBeGreaterThan(0);
    });

    it('denies a step in the chain', () => {
      const chain = governance.createApprovalChain('corr-1', 'data-sync', 'gamma-us-east', ['gamma-eu-west']);
      const updated = governance.denyStep(chain.id, 'gamma-eu-west', 'operator-eu', 'Not this time');
      expect(updated.steps[0].status).toBe('denied');
      expect(updated.status).toBe('denied');
    });

    it('requires all steps approved before chain completes', () => {
      const chain = governance.createApprovalChain('corr-1', 'sync', 'gamma-us-east', ['gamma-eu-west', 'gamma-ap-south']);
      const after1 = governance.approveStep(chain.id, 'gamma-eu-west', 'op-eu', 'ok');
      expect(after1.status).toBe('pending');
      const after2 = governance.approveStep(chain.id, 'gamma-ap-south', 'op-ap', 'ok');
      expect(after2.status).toBe('approved');
    });

    it('retrieves pending approvals for a node', () => {
      const chain = governance.createApprovalChain('corr-1', 'sync', 'gamma-us-east', ['gamma-eu-west', 'gamma-ap-south']);
      const pending = governance.getPendingApprovals('gamma-eu-west');
      expect(pending.length).toBe(1);
      expect(pending[0].id).toBe(chain.id);
    });

    it('returns empty pending for node with no approvals', () => {
      expect(governance.getPendingApprovals('gamma-us-east').length).toBe(0);
    });

    it('throws on unknown chain', () => {
      expect(() => governance.approveStep('unknown', 'node', 'op', 'reason')).toThrow(FederatedGovernanceError);
    });
  });

  // ── 8C.6 — Edge Cases ──

  describe('8C.6 — Edge Cases', () => {
    it('handles empty domain name', () => {
      const d = governance.createDomain('', ['gamma-us-east']);
      expect(d.name).toBe('');
    });

    it('handles duplicate member add idempotently', () => {
      const d = governance.createDomain('sync', ['gamma-us-east']);
      governance.addMember(d.id, 'gamma-us-east');
      expect(d.memberNodeIds.length).toBe(1);
    });

    it('handles empty policy list evaluation', () => {
      governance.createDomain('sync', ['gamma-us-east']);
      const result = governance.evaluateAction('gamma-us-east', 'data-sync', 'execution');
      expect(result.decision).toBe('allowed');
    });

    it('rejects step approval on completed chain', () => {
      const chain = governance.createApprovalChain('corr-1', 'sync', 'gamma-us-east', ['gamma-eu-west']);
      governance.denyStep(chain.id, 'gamma-eu-west', 'op', 'no');
      // Re-approving a denied step has no effect since it's already denied
      const updated = governance.approveStep(chain.id, 'gamma-eu-west', 'op', 'retry');
      expect(updated.status).toBe('denied');
    });

    it('throws on creating rule for unknown domain', () => {
      expect(() => governance.addPolicy('nonexistent', 'test', 'allow', 'workflow_type', '*', 1))
        .toThrow(FederatedGovernanceError);
    });
  });

  // ── 8C.7 — Determinism ──

  describe('8C.7 — Determinism', () => {
    it('produces same evaluation for same state', () => {
      const g1 = new FederatedGovernanceImpl(registry);
      const g2 = new FederatedGovernanceImpl(registry);

      const d1 = g1.createDomain('sync', ['gamma-us-east']);
      const d2 = g2.createDomain('sync', ['gamma-us-east']);

      g1.addPolicy(d1.id, 'Deny sync', 'deny', 'workflow_type', 'data-sync', 100);
      g2.addPolicy(d2.id, 'Deny sync', 'deny', 'workflow_type', 'data-sync', 100);

      const r1 = g1.evaluateAction('gamma-us-east', 'data-sync', 'execution');
      const r2 = g2.evaluateAction('gamma-us-east', 'data-sync', 'execution');
      expect(r1.decision).toBe(r2.decision);
      expect(r1.violations.length).toBe(r2.violations.length);
    });
  });
});
