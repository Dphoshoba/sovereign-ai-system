import { describe, it, expect, beforeEach } from 'vitest';
import { PlanningEngineImpl, PlanningEngineError } from '../../lib/platform/execution/planning-engine-impl';
import {
  PlanningContext,
  PlanningRequest,
  ProviderCapability,
} from '../../lib/platform/execution/planning-engine';
import { WorkflowDefinition } from '../../lib/platform/execution/workflow-graph';
import { WorkflowExecutionPolicy } from '../../lib/platform/execution/workflow-governance';

const emptyCtx: PlanningContext = {
  workflowId: 'wf-1',
  version: '1.0.0',
  executionId: 'exec-1',
  costCeiling: null,
  latencyObjectiveMs: null,
  preferredProviders: [],
  jurisdiction: null,
};

const caps: readonly ProviderCapability[] = [
  { providerId: 'p1', operation: 'read', estimatedCost: 10, estimatedLatencyMs: 100, confidence: 0.95 },
  { providerId: 'p2', operation: 'read', estimatedCost: 5, estimatedLatencyMs: 300, confidence: 0.80 },
  { providerId: 'p3', operation: 'write', estimatedCost: 20, estimatedLatencyMs: 200, confidence: 0.90 },
  { providerId: 'p4', operation: 'write', estimatedCost: 15, estimatedLatencyMs: 500, confidence: 0.70 },
  { providerId: 'p5', operation: 'delete', estimatedCost: 8, estimatedLatencyMs: 150, confidence: 0.85 },
];

const simpleDef: WorkflowDefinition = {
  workflowId: 'wf-1',
  name: 'Simple',
  version: '1.0.0',
  steps: [
    { stepId: 'a', providerId: 'p1', operation: 'read', input: {}, dependsOn: [], timeoutMs: 5000 },
    { stepId: 'b', providerId: 'p3', operation: 'write', input: {}, dependsOn: ['a'], timeoutMs: 5000 },
  ],
  metadata: {},
};

const multiCapDef: WorkflowDefinition = {
  workflowId: 'wf-2',
  name: 'MultiCap',
  version: '1.0.0',
  steps: [
    { stepId: 'read', providerId: 'p1', operation: 'read', input: {}, dependsOn: [], timeoutMs: 5000 },
    { stepId: 'write', providerId: 'p3', operation: 'write', input: {}, dependsOn: ['read'], timeoutMs: 5000 },
  ],
  metadata: {},
};

describe('PlanningEngineImpl', () => {
  let engine: PlanningEngineImpl;

  beforeEach(() => {
    engine = new PlanningEngineImpl();
  });

  // ── 6A.1 — Execution Planning ──

  describe('6A.1 — Execution Planning', () => {
    it('produces a planning result from a valid workflow', () => {
      const req: PlanningRequest = { definition: simpleDef, context: emptyCtx, capabilities: caps, policy: null };
      const result = engine.plan(req);
      expect(result.workflowId).toBe('wf-1');
      expect(result.executionId).toBe('exec-1');
      expect(result.selectedPlan).toBeDefined();
      expect(result.selectedPlan.assignments.length).toBe(2);
    });

    it('includes a ranked list of alternative plans', () => {
      const req: PlanningRequest = { definition: multiCapDef, context: emptyCtx, capabilities: caps, policy: null };
      const result = engine.plan(req);
      expect(result.alternatives.length).toBeGreaterThan(0);
      expect(result.selectedPlan.rank).toBe(1);
      for (const alt of result.alternatives) {
        expect(alt.rank).toBeGreaterThan(result.selectedPlan.rank);
      }
    });

    it('throws for empty workflow', () => {
      const empty: WorkflowDefinition = { workflowId: 'empty', name: '', version: '', steps: [], metadata: {} };
      const req: PlanningRequest = { definition: empty, context: emptyCtx, capabilities: caps, policy: null };
      expect(() => engine.plan(req)).toThrow(PlanningEngineError);
    });

    it('returns a deterministic primary plan for identical inputs', () => {
      const req1: PlanningRequest = { definition: multiCapDef, context: emptyCtx, capabilities: caps, policy: null };
      const req2: PlanningRequest = { definition: multiCapDef, context: emptyCtx, capabilities: caps, policy: null };
      expect(engine.plan(req1).selectedPlan.assignments).toEqual(
        engine.plan(req2).selectedPlan.assignments,
      );
    });

    it('records rationale in the selected plan explanation', () => {
      const req: PlanningRequest = { definition: multiCapDef, context: emptyCtx, capabilities: caps, policy: null };
      const result = engine.plan(req);
      expect(result.selectedPlan.explanation).toContain('Score:');
      expect(result.selectedPlan.explanation).toContain('Cost:');
      expect(result.selectedPlan.explanation).toContain('Latency:');
    });
  });

  // ── 6A.2 — Cost & Latency Awareness ──

  describe('6A.2 — Cost & Latency Awareness', () => {
    it('assigns providers with cost and latency metadata', () => {
      const req: PlanningRequest = { definition: multiCapDef, context: emptyCtx, capabilities: caps, policy: null };
      const result = engine.plan(req);
      for (const assignment of result.selectedPlan.assignments) {
        expect(assignment.cost).toBeGreaterThanOrEqual(0);
        expect(assignment.latencyMs).toBeGreaterThanOrEqual(0);
        expect(assignment.confidence).toBeGreaterThan(0);
      }
    });

    it('reports totalCost and totalLatencyMs on each plan', () => {
      const req: PlanningRequest = { definition: multiCapDef, context: emptyCtx, capabilities: caps, policy: null };
      const result = engine.plan(req);
      expect(result.selectedPlan.totalCost).toBeGreaterThan(0);
      expect(result.selectedPlan.totalLatencyMs).toBeGreaterThan(0);
    });

    it('prefers lower cost in cost_optimal strategy', () => {
      const req: PlanningRequest = { definition: multiCapDef, context: emptyCtx, capabilities: caps, policy: null };
      const result = engine.plan(req);
      const costPlan = result.alternatives.find((p) => p.strategy === 'cost_optimal') ?? result.selectedPlan;
      expect(costPlan.totalCost).toBeLessThanOrEqual(
        result.alternatives.find((p) => p.strategy === 'latency_optimal')?.totalCost ?? Infinity,
      );
    });

    it('prefers lower latency in latency_optimal strategy', () => {
      const readCaps = [
        { providerId: 'fast', operation: 'read', estimatedCost: 50, estimatedLatencyMs: 10, confidence: 0.9 },
        { providerId: 'slow', operation: 'read', estimatedCost: 5, estimatedLatencyMs: 1000, confidence: 0.9 },
      ];
      const def: WorkflowDefinition = {
        workflowId: 'wf-lat', name: 'LatTest', version: '1.0.0',
        steps: [{ stepId: 's1', providerId: 'fast', operation: 'read', input: {}, dependsOn: [], timeoutMs: 5000 }],
        metadata: {},
      };
      const result = engine.plan({ definition: def, context: emptyCtx, capabilities: readCaps, policy: null });
      const latencyPlan = [...result.alternatives, result.selectedPlan].find((p) => p.strategy === 'latency_optimal');
      expect(latencyPlan).toBeDefined();
      expect(latencyPlan!.assignments[0].providerId).toBe('fast');
    });

    it('snapshots metadata used for the planning decision', () => {
      const req: PlanningRequest = { definition: multiCapDef, context: emptyCtx, capabilities: caps, policy: null };
      const result = engine.plan(req);
      expect(result.providerMetadataSnapshot.length).toBe(caps.length);
    });
  });

  // ── 6A.3 — Policy-Aware Routing ──

  describe('6A.3 — Policy-Aware Routing', () => {
    const policy: WorkflowExecutionPolicy = {
      workflowId: 'wf-2',
      version: '1.0.0',
      permittedProviders: ['p1', 'p3'],
      maxExecutionTimeMs: 10000,
      allowRetries: true,
      allowCompensation: true,
      requireApproval: false,
    };

    it('respects permittedProviders from policy', () => {
      const req: PlanningRequest = { definition: multiCapDef, context: emptyCtx, capabilities: caps, policy };
      const result = engine.plan(req);
      for (const assignment of result.selectedPlan.assignments) {
        expect(policy.permittedProviders).toContain(assignment.providerId);
      }
    });

    it('reports violations when policy constraints are exceeded', () => {
      const ctx: PlanningContext = { ...emptyCtx, costCeiling: 10, latencyObjectiveMs: 250 };
      const req: PlanningRequest = { definition: multiCapDef, context: ctx, capabilities: caps, policy };
      const result = engine.plan(req);
      for (const plan of [result.selectedPlan, ...result.alternatives]) {
        expect(plan.violations).toBeDefined();
      }
    });

    it('penalizes plans using providers not in the permitted list', () => {
      const restrictivePolicy: WorkflowExecutionPolicy = {
        workflowId: 'wf-2', version: '1.0.0',
        permittedProviders: ['p1'], maxExecutionTimeMs: 10000,
        allowRetries: true, allowCompensation: true, requireApproval: false,
      };
      const req: PlanningRequest = { definition: multiCapDef, context: emptyCtx, capabilities: caps, policy: restrictivePolicy };
      const result = engine.plan(req);
      const allPlans = [result.selectedPlan, ...result.alternatives];
      const hasViolations = allPlans.some((p) => p.violations.length > 0);
      expect(hasViolations).toBe(true);
    });

    it('does not restrict when policy is null', () => {
      const req: PlanningRequest = { definition: multiCapDef, context: emptyCtx, capabilities: caps, policy: null };
      const result = engine.plan(req);
      expect(result.selectedPlan.assignments.length).toBe(2);
    });
  });

  // ── 6A.4 — Alternative Plan Generation ──

  describe('6A.4 — Alternative Plan Generation', () => {
    it('generates a balanced plan plus alternatives', () => {
      const req: PlanningRequest = { definition: multiCapDef, context: emptyCtx, capabilities: caps, policy: null };
      const result = engine.plan(req);
      expect(result.selectedPlan).toBeDefined();
      expect(result.alternatives.length).toBe(3);
    });

    it('ranks plans by score descending', () => {
      const req: PlanningRequest = { definition: multiCapDef, context: emptyCtx, capabilities: caps, policy: null };
      const result = engine.plan(req);
      const allPlans = [result.selectedPlan, ...result.alternatives];
      for (let i = 1; i < allPlans.length; i++) {
        expect(allPlans[i].score).toBeLessThanOrEqual(allPlans[i - 1].score);
      }
    });

    it('assigns unique rank numbers to each plan', () => {
      const req: PlanningRequest = { definition: multiCapDef, context: emptyCtx, capabilities: caps, policy: null };
      const result = engine.plan(req);
      const ranks = [result.selectedPlan, ...result.alternatives].map((p) => p.rank);
      const unique = new Set(ranks);
      expect(unique.size).toBe(ranks.length);
    });

    it('each alternative has a different strategy label', () => {
      const req: PlanningRequest = { definition: multiCapDef, context: emptyCtx, capabilities: caps, policy: null };
      const result = engine.plan(req);
      const strategies = [result.selectedPlan, ...result.alternatives].map((p) => p.strategy);
      const unique = new Set(strategies);
      expect(unique.size).toBe(strategies.length);
    });

    it('selected plan has highest score', () => {
      const req: PlanningRequest = { definition: multiCapDef, context: emptyCtx, capabilities: caps, policy: null };
      const result = engine.plan(req);
      for (const alt of result.alternatives) {
        expect(result.selectedPlan.score).toBeGreaterThanOrEqual(alt.score);
      }
    });
  });

  // ── Determinism (G-039) ──

  describe('G-039 — Deterministic Execution Planning', () => {
    it('produces identical results across repeated calls', () => {
      const req: PlanningRequest = { definition: multiCapDef, context: emptyCtx, capabilities: caps, policy: null };
      const r1 = engine.plan(req);
      const r2 = engine.plan(req);
      const r3 = engine.plan(req);
      expect(r1.selectedPlan).toEqual(r2.selectedPlan);
      expect(r2.selectedPlan).toEqual(r3.selectedPlan);
      expect(r1.alternatives).toEqual(r2.alternatives);
    });

    it('produces the same plan for identical step ordering', () => {
      const def1: WorkflowDefinition = {
        ...multiCapDef,
        steps: [
          { stepId: 'a', providerId: 'p1', operation: 'read', input: {}, dependsOn: [], timeoutMs: 5000 },
          { stepId: 'b', providerId: 'p3', operation: 'write', input: {}, dependsOn: ['a'], timeoutMs: 5000 },
        ],
      };
      const def2: WorkflowDefinition = {
        ...multiCapDef,
        steps: [
          { stepId: 'a', providerId: 'p1', operation: 'read', input: {}, dependsOn: [], timeoutMs: 5000 },
          { stepId: 'b', providerId: 'p3', operation: 'write', input: {}, dependsOn: ['a'], timeoutMs: 5000 },
        ],
      };
      const r1 = engine.plan({ definition: def1, context: emptyCtx, capabilities: caps, policy: null });
      const r2 = engine.plan({ definition: def2, context: emptyCtx, capabilities: caps, policy: null });
      expect(r1.selectedPlan.assignments).toEqual(r2.selectedPlan.assignments);
    });
  });

  // ── Architectural Boundary ──

  describe('Architectural Boundary', () => {
    it('produces plans without executing workflow steps', () => {
      const req: PlanningRequest = { definition: multiCapDef, context: emptyCtx, capabilities: caps, policy: null };
      const result = engine.plan(req);
      expect(result.selectedPlan.assignments.length).toBeGreaterThan(0);
    });
  });
});
