import { describe, it, expect, beforeEach } from 'vitest';
import { OperationalDecision, DecisionAction } from '../../lib/platform/execution/autonomous-decision';
import {
  GovernanceGateImpl,
  OverrideManagerImpl,
  DEFAULT_GOVERNANCE_CONFIG,
} from '../../lib/platform/governance/governance-gate-impl';
import {
  GovernanceConfig,
  GovernanceGateError,
  OverrideManagerError,
  OperationalOverride,
} from '../../lib/platform/governance/governance-gate';

// ── Helpers ──

const mkDecision = (action: DecisionAction, level: 'none' | 'low' | 'medium' | 'high', risk = 0): OperationalDecision => ({
  id: `dec-${Date.now()}`,
  timestamp: Date.now(),
  triggeringState: {
    operationalState: 'healthy', overallScore: 100, activeImpacts: [], layerHealth: [],
  },
  selectedAction: {
    action, confidence: 1, rationale: 'Test', riskScore: risk,
    requiredApprovalLevel: level, rejected: false, rejectionReason: null,
  },
  alternatives: [],
  riskAssessment: { overallRisk: risk, factors: [] },
  policyReferences: ['G-044'],
  auditRecord: {
    decisionId: 'dec-test', timestamp: 0,
    inputs: { operationalState: 'healthy', activeImpacts: 0, layerHealthCount: 0 },
    evaluatedRules: [], selectedAction: action,
    rejectedAlternatives: [], confidence: 1, policyReferences: [],
  },
});

// ── GovernanceGate Tests ──

describe('GovernanceGateImpl', () => {
  let gate: GovernanceGateImpl;

  beforeEach(() => {
    gate = new GovernanceGateImpl();
  });

  // ── 7D.1 — Threshold-Based Auto-Approval ──

  describe('7D.1 — Threshold-Based Auto-Approval', () => {
    it('auto-approves when required level is none (below medium threshold)', () => {
      const result = gate.evaluate(mkDecision('no_action', 'none'));
      expect(result.verdict).toBe('auto_approved');
    });

    it('auto-approves when required level is low (below medium threshold)', () => {
      const result = gate.evaluate(mkDecision('monitor', 'low'));
      expect(result.verdict).toBe('auto_approved');
    });

    it('auto-approves when required level is medium (at threshold)', () => {
      const result = gate.evaluate(mkDecision('monitor', 'medium'));
      expect(result.verdict).toBe('auto_approved');
    });

    it('requires approval when required level is high (exceeds medium threshold)', () => {
      const result = gate.evaluate(mkDecision('initiate_recovery', 'high'));
      expect(result.verdict).toBe('pending_approval');
    });

    it('requires approval when action is request_human_approval', () => {
      const result = gate.evaluate(mkDecision('request_human_approval', 'none'));
      expect(result.verdict).toBe('pending_approval');
    });
  });

  // ── 7D.2 — Custom Threshold ──

  describe('7D.2 — Custom Threshold', () => {
    it('auto-approves all when threshold is high', () => {
      const highGate = new GovernanceGateImpl({ ...DEFAULT_GOVERNANCE_CONFIG, autoApproveThreshold: 'high' });
      expect(highGate.evaluate(mkDecision('initiate_recovery', 'high')).verdict).toBe('auto_approved');
    });

    it('requires approval for medium and above when threshold is low', () => {
      const lowGate = new GovernanceGateImpl({ ...DEFAULT_GOVERNANCE_CONFIG, autoApproveThreshold: 'low' });
      expect(lowGate.evaluate(mkDecision('monitor', 'medium')).verdict).toBe('pending_approval');
      expect(lowGate.evaluate(mkDecision('monitor', 'low')).verdict).toBe('auto_approved');
    });

    it('requires approval for none level when threshold is lower', () => {
      const strictGate = new GovernanceGateImpl({ ...DEFAULT_GOVERNANCE_CONFIG, autoApproveThreshold: 'none' });
      expect(strictGate.evaluate(mkDecision('monitor', 'none')).verdict).toBe('auto_approved');
      expect(strictGate.evaluate(mkDecision('monitor', 'low')).verdict).toBe('pending_approval');
    });
  });

  // ── 7D.3 — Action-Based Approval Requirement ──

  describe('7D.3 — Action-Based Approval Requirement', () => {
    it('requires approval for explicitly listed actions', () => {
      const config: GovernanceConfig = {
        ...DEFAULT_GOVERNANCE_CONFIG,
        requireApprovalForActions: ['pause_workflows'],
      };
      const strictGate = new GovernanceGateImpl(config);
      const result = strictGate.evaluate(mkDecision('pause_workflows', 'none'));
      expect(result.verdict).toBe('pending_approval');
    });

    it('does not require approval for non-listed actions', () => {
      const config: GovernanceConfig = {
        ...DEFAULT_GOVERNANCE_CONFIG,
        requireApprovalForActions: ['pause_workflows'],
      };
      const strictGate = new GovernanceGateImpl(config);
      const result = strictGate.evaluate(mkDecision('monitor', 'none'));
      expect(result.verdict).toBe('auto_approved');
    });
  });

  // ── 7D.4 — Approval Resolution ──

  describe('7D.4 — Approval Resolution', () => {
    it('approves a pending request and records resolver', () => {
      const pending = gate.evaluate(mkDecision('initiate_recovery', 'high'));
      expect(pending.verdict).toBe('pending_approval');

      const approved = gate.approve(pending.id, 'operator-1', 'Looks safe');
      expect(approved.verdict).toBe('auto_approved');
      expect(approved.resolvedBy).toBe('operator-1');
      expect(approved.resolvedAt).toBeGreaterThan(0);
    });

    it('denies a pending request and records reason', () => {
      const pending = gate.evaluate(mkDecision('initiate_recovery', 'high'));
      const denied = gate.deny(pending.id, 'operator-1', 'Too risky');
      expect(denied.verdict).toBe('denied');
      expect(denied.resolvedBy).toBe('operator-1');
      expect(denied.rationale).toBe('Too risky');
    });

    it('throws when approving non-existent request', () => {
      expect(() => gate.approve('nonexistent', 'op', 'reason')).toThrow(GovernanceGateError);
    });

    it('throws when approving already-resolved request', () => {
      const pending = gate.evaluate(mkDecision('initiate_recovery', 'high'));
      gate.approve(pending.id, 'op', 'ok');
      expect(() => gate.approve(pending.id, 'op', 'again')).toThrow(GovernanceGateError);
    });
  });

  // ── 7D.5 — Pending and History ──

  describe('7D.5 — Pending and History', () => {
    it('returns auto-approved decisions from history but not pending', () => {
      gate.evaluate(mkDecision('no_action', 'none'));
      expect(gate.getPending().length).toBe(0);
      expect(gate.getHistory().length).toBe(1);
    });

    it('returns pending-approval decisions from both pending and history', () => {
      gate.evaluate(mkDecision('initiate_recovery', 'high'));
      expect(gate.getPending().length).toBe(1);
      expect(gate.getHistory().length).toBe(1);
    });

    it('removes from pending after approval', () => {
      const p = gate.evaluate(mkDecision('initiate_recovery', 'high'));
      gate.approve(p.id, 'op', 'ok');
      expect(gate.getPending().length).toBe(0);
    });

    it('removes from pending after denial', () => {
      const p = gate.evaluate(mkDecision('initiate_recovery', 'high'));
      gate.deny(p.id, 'op', 'no');
      expect(gate.getPending().length).toBe(0);
    });
  });

  // ── 7D.6 — Request Properties ──

  describe('7D.6 — Request Properties', () => {
    it('sets action and level from decision', () => {
      const result = gate.evaluate(mkDecision('initiate_recovery', 'high', 75));
      expect(result.action).toBe('initiate_recovery');
      expect(result.requiredLevel).toBe('high');
      expect(result.riskScore).toBe(75);
    });

    it('links request to decision id', () => {
      const dec = mkDecision('initiate_recovery', 'low');
      const result = gate.evaluate(dec);
      expect(result.decisionId).toBe(dec.id);
    });

    it('includes all fields from decision context', () => {
      const result = gate.evaluate(mkDecision('initiate_recovery', 'high', 75));
      expect(result.action).toBe('initiate_recovery');
      expect(result.requiredLevel).toBe('high');
      expect(result.riskScore).toBe(75);
    });
  });
});

// ── OverrideManager Tests ──

describe('OverrideManagerImpl', () => {
  let manager: OverrideManagerImpl;

  beforeEach(() => {
    manager = new OverrideManagerImpl();
  });

  // ── 7D.7 — Override Apply and Revoke ──

  describe('7D.7 — Override Apply and Revoke', () => {
    it('applies an override', () => {
      const o: OperationalOverride = {
        id: 'ov-1', scope: 'action', target: 'initiate_recovery',
        effect: 'block', reason: 'Blocking automatic recovery', setBy: 'admin',
        setAt: Date.now(), expiresAt: null,
      };
      manager.apply(o);
      expect(manager.getAll().length).toBe(1);
    });

    it('revokes an override', () => {
      const o: OperationalOverride = {
        id: 'ov-1', scope: 'action', target: 'initiate_recovery',
        effect: 'block', reason: 'Testing', setBy: 'admin',
        setAt: Date.now(), expiresAt: null,
      };
      manager.apply(o);
      manager.revoke('ov-1');
      expect(manager.getAll().length).toBe(0);
    });

    it('throws when revoking non-existent override', () => {
      expect(() => manager.revoke('nonexistent')).toThrow(OverrideManagerError);
    });

    it('replaces existing override with same id', () => {
      manager.apply({
        id: 'ov-1', scope: 'action', target: 'initiate_recovery',
        effect: 'block', reason: 'First', setBy: 'admin',
        setAt: Date.now(), expiresAt: null,
      });
      manager.apply({
        id: 'ov-1', scope: 'action', target: 'initiate_recovery',
        effect: 'allow', reason: 'Override updated', setBy: 'admin',
        setAt: Date.now(), expiresAt: null,
      });
      expect(manager.getAll().length).toBe(1);
      expect(manager.getEffective('initiate_recovery', 'action')!.effect).toBe('allow');
    });
  });

  // ── 7D.8 — Override Resolution ──

  describe('7D.8 — Override Resolution', () => {
    it('returns exact match for scope and target', () => {
      manager.apply({
        id: 'ov-1', scope: 'action', target: 'initiate_recovery',
        effect: 'block', reason: 'Block recovery', setBy: 'admin',
        setAt: Date.now(), expiresAt: null,
      });
      const eff = manager.getEffective('initiate_recovery', 'action');
      expect(eff).toBeDefined();
      expect(eff!.effect).toBe('block');
    });

    it('returns undefined when no override matches', () => {
      expect(manager.getEffective('initiate_recovery', 'action')).toBeUndefined();
    });

    it('falls back to global override when no exact match', () => {
      manager.apply({
        id: 'ov-global', scope: 'global', target: '*',
        effect: 'block', reason: 'Lockdown', setBy: 'admin',
        setAt: Date.now(), expiresAt: null,
      });
      const eff = manager.getEffective('initiate_recovery', 'action');
      expect(eff).toBeDefined();
      expect(eff!.effect).toBe('block');
    });

    it('prefers exact match over global fallback', () => {
      manager.apply({
        id: 'ov-global', scope: 'global', target: '*',
        effect: 'block', reason: 'Lockdown', setBy: 'admin',
        setAt: Date.now(), expiresAt: null,
      });
      manager.apply({
        id: 'ov-action', scope: 'action', target: 'initiate_recovery',
        effect: 'allow', reason: 'Override for recovery', setBy: 'admin',
        setAt: Date.now(), expiresAt: null,
      });
      const eff = manager.getEffective('initiate_recovery', 'action');
      expect(eff!.effect).toBe('allow');
    });
  });

  // ── 7D.9 — Override Expiry ──

  describe('7D.9 — Override Expiry', () => {
    it('returns override when not expired', () => {
      manager.apply({
        id: 'ov-1', scope: 'action', target: 'initiate_recovery',
        effect: 'block', reason: 'Block', setBy: 'admin',
        setAt: Date.now(), expiresAt: Date.now() + 60000,
      });
      expect(manager.getEffective('initiate_recovery', 'action')).toBeDefined();
    });

    it('skips override when expired', () => {
      manager.apply({
        id: 'ov-1', scope: 'action', target: 'initiate_recovery',
        effect: 'block', reason: 'Block', setBy: 'admin',
        setAt: Date.now(), expiresAt: Date.now() - 1,
      });
      expect(manager.getEffective('initiate_recovery', 'action')).toBeUndefined();
    });

    it('skips expired global override', () => {
      manager.apply({
        id: 'ov-global', scope: 'global', target: '*',
        effect: 'block', reason: 'Lockdown', setBy: 'admin',
        setAt: Date.now(), expiresAt: Date.now() - 1,
      });
      expect(manager.getEffective('initiate_recovery', 'action')).toBeUndefined();
    });

    it('treats null expiry as never expired', () => {
      manager.apply({
        id: 'ov-1', scope: 'action', target: 'initiate_recovery',
        effect: 'block', reason: 'Block', setBy: 'admin',
        setAt: 0, expiresAt: null,
      });
      expect(manager.getEffective('initiate_recovery', 'action')).toBeDefined();
    });
  });

  // ── 7D.10 — Edge Cases ──

  describe('7D.10 — Edge Cases', () => {
    it('handles force_state override', () => {
      manager.apply({
        id: 'ov-fs', scope: 'global', target: '*',
        effect: 'force_state', reason: 'Emergency', setBy: 'admin',
        forceState: 'maintenance',
        setAt: Date.now(), expiresAt: null,
      });
      const eff = manager.getEffective('any-action', 'action');
      expect(eff!.effect).toBe('force_state');
      expect(eff!.forceState).toBe('maintenance');
    });

    it('handles provider-scoped override', () => {
      manager.apply({
        id: 'ov-prov', scope: 'provider', target: 'p-fast',
        effect: 'block', reason: 'Provider down', setBy: 'admin',
        setAt: Date.now(), expiresAt: null,
      });
      expect(manager.getEffective('p-fast', 'provider')).toBeDefined();
      expect(manager.getEffective('p-other', 'provider')).toBeUndefined();
    });

    it('returns all overrides in getAll', () => {
      manager.apply({
        id: 'ov-1', scope: 'action', target: 'a',
        effect: 'allow', reason: '', setBy: 'admin',
        setAt: 0, expiresAt: null,
      });
      manager.apply({
        id: 'ov-2', scope: 'provider', target: 'b',
        effect: 'block', reason: '', setBy: 'admin',
        setAt: 0, expiresAt: null,
      });
      expect(manager.getAll().length).toBe(2);
    });
  });
});
