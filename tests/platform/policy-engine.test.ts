import { describe, it, expect, beforeEach } from 'vitest';
import { PolicyEngineImpl, PolicyEngineError } from '../../lib/platform/execution/policy-engine-impl';
import {
  EvaluationContext,
  PolicyDefinition,
  PolicyRule,
} from '../../lib/platform/execution/policy-engine';

const makePolicy = (overrides: Partial<PolicyDefinition> = {}): PolicyDefinition => ({
  policyId: 'pol-provider-1',
  version: '1.0.0',
  name: 'Provider Eligibility',
  description: 'Restricts which providers can execute workflows',
  rules: [
    {
      id: 'rule-1',
      name: 'Restrict jurisdiction',
      effect: 'deny',
      conditions: [
        { field: 'jurisdiction', operator: 'eq', value: 'restricted' },
      ],
      priority: 10,
    },
    {
      id: 'rule-2',
      name: 'Allow premium providers',
      effect: 'allow',
      conditions: [
        { field: 'serviceClass', operator: 'eq', value: 'premium' },
      ],
      priority: 5,
    },
  ],
  createdAt: 1000,
  enabled: true,
  ...overrides,
});

const defaultCtx: EvaluationContext = {
  workflowId: 'wf-1',
  executionId: 'exec-1',
  workflowClass: 'standard',
  providerId: 'p1',
  jurisdiction: 'us-east',
  estimatedCost: 50,
  estimatedLatencyMs: 200,
  planningScore: 85,
  priority: 3,
  serviceClass: 'standard',
};

describe('PolicyEngineImpl', () => {
  let engine: PolicyEngineImpl;

  beforeEach(() => {
    engine = new PolicyEngineImpl();
  });

  // ── 6D.1 — Declarative Policy Model ──

  describe('6D.1 — Declarative Policy Model', () => {
    it('registers a policy definition', () => {
      expect(() => engine.register(makePolicy())).not.toThrow();
    });

    it('registers multiple policies independently', () => {
      engine.register(makePolicy({ policyId: 'pol-1' }));
      engine.register(makePolicy({ policyId: 'pol-2' }));
      const outcome = engine.evaluate(defaultCtx);
      expect(outcome.evaluations.length).toBe(2);
    });

    it('rejects a policy with no rules', () => {
      expect(() => engine.register(makePolicy({ rules: [] })))
        .toThrow(PolicyEngineError);
    });

    it('rejects a policy with duplicate rule IDs', () => {
      const rules: PolicyRule[] = [
        { id: 'dup', name: 'First', effect: 'allow', conditions: [], priority: 1 },
        { id: 'dup', name: 'Second', effect: 'deny', conditions: [], priority: 2 },
      ];
      expect(() => engine.register(makePolicy({ rules })))
        .toThrow(PolicyEngineError);
    });

    it('ignores disabled policies during evaluation', () => {
      engine.register(makePolicy({ policyId: 'pol-disabled', enabled: false }));
      const outcome = engine.evaluate(defaultCtx);
      expect(outcome.evaluations.length).toBe(0);
      expect(outcome.overallDecision).toBe('allow');
    });
  });

  // ── 6D.2 — Runtime Policy Evaluation ──

  describe('6D.2 — Runtime Policy Evaluation', () => {
    it('returns allow when no rules match', () => {
      engine.register(makePolicy());
      const outcome = engine.evaluate(defaultCtx);
      expect(outcome.overallDecision).toBe('allow');
    });

    it('returns deny when a deny rule matches', () => {
      engine.register(makePolicy());
      const outcome = engine.evaluate({ ...defaultCtx, jurisdiction: 'restricted' });
      expect(outcome.overallDecision).toBe('deny');
    });

    it('returns allow for an allow rule match', () => {
      engine.register(makePolicy());
      const outcome = engine.evaluate({ ...defaultCtx, serviceClass: 'premium' });
      expect(outcome.overallDecision).toBe('allow');
    });

    it('evaluates all enabled policies and picks most restrictive', () => {
      engine.register(makePolicy({ policyId: 'pol-deny' }));
      engine.register(makePolicy({
        policyId: 'pol-allow',
        rules: [
          { id: 'r1', name: 'Allow everything', effect: 'allow' as const, conditions: [], priority: 1 },
        ],
      }));
      const outcome = engine.evaluate({ ...defaultCtx, jurisdiction: 'restricted' });
      expect(outcome.overallDecision).toBe('deny');
    });

    it('returns allow when no policies are registered', () => {
      const outcome = engine.evaluate(defaultCtx);
      expect(outcome.overallDecision).toBe('allow');
      expect(outcome.summary).toContain('No enabled policies');
    });

    it('includes rationale in evaluations', () => {
      engine.register(makePolicy());
      const outcome = engine.evaluate({ ...defaultCtx, jurisdiction: 'restricted' });
      for (const evalResult of outcome.evaluations) {
        expect(evalResult.rationale.length).toBeGreaterThan(0);
      }
    });

    it('includes requestId and timestamp in outcome', () => {
      engine.register(makePolicy());
      const outcome = engine.evaluate(defaultCtx);
      expect(outcome.requestId).toContain('exec-1');
      expect(outcome.timestamp).toBeGreaterThan(0);
    });

    it('supports eq and neq condition operators', () => {
      engine.register(makePolicy({
        rules: [
          { id: 'r1', name: 'Deny restricted', effect: 'deny', conditions: [{ field: 'jurisdiction', operator: 'eq', value: 'restricted' }], priority: 1 },
          { id: 'r2', name: 'Allow non-restricted', effect: 'allow', conditions: [{ field: 'jurisdiction', operator: 'neq', value: 'restricted' }], priority: 1 },
        ],
      }));
      expect(engine.evaluate({ ...defaultCtx, jurisdiction: 'restricted' }).overallDecision).toBe('deny');
      expect(engine.evaluate({ ...defaultCtx, jurisdiction: 'us-east' }).overallDecision).toBe('allow');
    });

    it('supports in and nin condition operators', () => {
      engine.register(makePolicy({
        rules: [
          { id: 'r1', name: 'Blocked providers', effect: 'deny', conditions: [{ field: 'providerId', operator: 'in', value: ['p1', 'p2', 'p3'] }], priority: 1 },
          { id: 'r2', name: 'Allow others', effect: 'allow', conditions: [{ field: 'providerId', operator: 'nin', value: ['p1', 'p2', 'p3'] }], priority: 1 },
        ],
      }));
      expect(engine.evaluate({ ...defaultCtx, providerId: 'p1' }).overallDecision).toBe('deny');
      expect(engine.evaluate({ ...defaultCtx, providerId: 'p4' }).overallDecision).toBe('allow');
    });

    it('supports lt, gt, lte, gte condition operators', () => {
      engine.register(makePolicy({
        rules: [
          { id: 'r1', name: 'Cost limit', effect: 'deny', conditions: [{ field: 'estimatedCost', operator: 'gt', value: 100 }], priority: 1 },
          { id: 'r2', name: 'Latency limit', effect: 'deny', conditions: [{ field: 'estimatedLatencyMs', operator: 'gte', value: 500 }], priority: 1 },
        ],
      }));
      expect(engine.evaluate({ ...defaultCtx, estimatedCost: 150 }).overallDecision).toBe('deny');
      expect(engine.evaluate({ ...defaultCtx, estimatedLatencyMs: 500 }).overallDecision).toBe('deny');
      expect(engine.evaluate({ ...defaultCtx, estimatedCost: 50, estimatedLatencyMs: 200 }).overallDecision).toBe('allow');
    });
  });

  // ── 6D.3 — Compliance Framework ──

  describe('6D.3 — Compliance Framework', () => {
    it('generates compliance records on evaluation', () => {
      engine.register(makePolicy());
      engine.evaluate(defaultCtx);
      const records = engine.getComplianceRecords('wf-1');
      expect(records.length).toBe(1);
    });

    it('includes policy version and matched rules in compliance records', () => {
      engine.register(makePolicy());
      engine.evaluate({ ...defaultCtx, jurisdiction: 'restricted' });
      const records = engine.getComplianceRecords('wf-1');
      expect(records[0].policyVersion).toBe('1.0.0');
      expect(records[0].matchedRules.length).toBeGreaterThan(0);
      expect(records[0].decision).toBe('deny');
    });

    it('generates records for each policy evaluated', () => {
      engine.register(makePolicy({ policyId: 'pol-1' }));
      engine.register(makePolicy({ policyId: 'pol-2' }));
      engine.evaluate(defaultCtx);
      const records = engine.getComplianceRecords('wf-1');
      expect(records.length).toBe(2);
    });

    it('filters compliance records by workflow', () => {
      engine.register(makePolicy({ policyId: 'pol-1' }));
      engine.evaluate(defaultCtx);
      engine.evaluate({ ...defaultCtx, workflowId: 'wf-2', executionId: 'exec-2' });
      const wf1Records = engine.getComplianceRecords('wf-1');
      const wf2Records = engine.getComplianceRecords('wf-2');
      expect(wf1Records.length).toBe(1);
      expect(wf2Records.length).toBe(1);
    });

    it('includes rationale in compliance records', () => {
      engine.register(makePolicy());
      engine.evaluate(defaultCtx);
      const records = engine.getComplianceRecords('wf-1');
      expect(records[0].rationale.length).toBeGreaterThan(0);
    });
  });

  // ── 6D.4 — Approval Framework ──

  describe('6D.4 — Approval Framework', () => {
    it('returns null approval when no policy requires it', () => {
      engine.register(makePolicy());
      const result = engine.evaluateWithApproval(defaultCtx);
      expect(result.approval).toBeNull();
    });

    it('returns approval requirement when a policy requires approval', () => {
      engine.register(makePolicy({
        rules: [
          { id: 'r1', name: 'High cost needs approval', effect: 'require_approval', conditions: [{ field: 'estimatedCost', operator: 'gt', value: 100 }], priority: 1 },
        ],
      }));
      const result = engine.evaluateWithApproval({ ...defaultCtx, estimatedCost: 200 });
      expect(result.approval).not.toBeNull();
      expect(result.approval!.required).toBe(true);
      expect(result.approval!.policyId).toBe('pol-provider-1');
    });

    it('includes delegatable roles in approval requirement', () => {
      engine.register(makePolicy({
        rules: [
          { id: 'r1', name: 'Approval needed', effect: 'require_approval', conditions: [], priority: 1 },
        ],
      }));
      const result = engine.evaluateWithApproval(defaultCtx);
      expect(result.approval!.delegatableTo).toContain('governance_admin');
      expect(result.approval!.canDelegate).toBe(true);
    });

    it('supports policy exception approval type', () => {
      engine.register(makePolicy({
        rules: [
          { id: 'r1', name: 'Exception required', effect: 'require_approval', conditions: [{ field: 'providerId', operator: 'eq', value: 'p-external' }], priority: 1 },
        ],
      }));
      const result = engine.evaluateWithApproval({ ...defaultCtx, providerId: 'p-external' });
      expect(result.approval!.reason).toContain('require_approval');
    });
  });

  // ── G-042 — Deterministic Policy Evaluation ──

  describe('G-042 — Deterministic Policy Evaluation', () => {
    it('produces identical outcomes for identical context', () => {
      engine.register(makePolicy());
      const r1 = engine.evaluate(defaultCtx);
      const r2 = engine.evaluate(defaultCtx);
      expect(r1.overallDecision).toBe(r2.overallDecision);
    });

    it('produces identical compliance records for identical inputs', () => {
      engine.register(makePolicy({ policyId: 'pol-1' }));
      engine.evaluate(defaultCtx);
      engine.evaluate(defaultCtx);
      const records = engine.getComplianceRecords('wf-1');
      // Both evaluations should have the same structure
      expect(records[0].rationale).toBe(records[1].rationale);
      expect(records[0].decision).toBe(records[1].decision);
    });

    it('returns consistent results across engine instances', () => {
      const e1 = new PolicyEngineImpl();
      const e2 = new PolicyEngineImpl();
      const policy = makePolicy();
      e1.register(policy);
      e2.register(policy);
      expect(e1.evaluate(defaultCtx).overallDecision).toBe(e2.evaluate(defaultCtx).overallDecision);
    });
  });

  // ── Edge Cases ──

  describe('Edge Cases', () => {
    it('handles constrained effect', () => {
      engine.register(makePolicy({
        rules: [
          { id: 'r1', name: 'Constrained execution', effect: 'constrained', conditions: [{ field: 'estimatedCost', operator: 'gt', value: 50 }], priority: 1 },
        ],
      }));
      const outcome = engine.evaluate({ ...defaultCtx, estimatedCost: 100 });
      expect(outcome.overallDecision).toBe('constrained');
    });

    it('resolves conflicting priorities correctly', () => {
      engine.register(makePolicy({
        rules: [
          { id: 'low', name: 'Low priority allow', effect: 'allow', conditions: [], priority: 1 },
          { id: 'high', name: 'High priority deny', effect: 'deny', conditions: [{ field: 'providerId', operator: 'eq', value: 'p1' }], priority: 10 },
        ],
      }));
      const outcome = engine.evaluate({ ...defaultCtx, providerId: 'p1' });
      expect(outcome.overallDecision).toBe('deny');
    });
  });

  // ── Architectural Boundary ──

  describe('Architectural Boundary', () => {
    it('evaluates policies without executing workflows', () => {
      engine.register(makePolicy());
      const outcome = engine.evaluate(defaultCtx);
      expect(outcome.overallDecision).toBeDefined();
    });

    it('evaluates policies without scheduling work', () => {
      engine.register(makePolicy());
      const outcome = engine.evaluate(defaultCtx);
      expect((outcome as any).executionOrder).toBeUndefined();
    });

    it('evaluates policies without generating plans', () => {
      engine.register(makePolicy());
      const outcome = engine.evaluate(defaultCtx);
      expect((outcome as any).selectedPlan).toBeUndefined();
    });
  });
});
