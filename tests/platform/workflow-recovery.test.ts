import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowRecoveryManagerImpl, WorkflowRecoveryError } from '../../lib/platform/execution/workflow-recovery-impl';
import { WorkflowGraphEngineImpl } from '../../lib/platform/execution/workflow-graph-impl';
import { WorkflowDefinition, ExecutionPlan } from '../../lib/platform/execution/workflow-graph';
import { WorkflowExecutionContext, StepExecutorFn, StepResult, ConditionalExecutionStep, WorkflowState } from '../../lib/platform/execution/workflow-runtime';
import { WorkflowRuntimeImpl } from '../../lib/platform/execution/workflow-runtime-impl';
import { CompensatorFn } from '../../lib/platform/execution/cross-provider-rollback';

function successFn(): StepExecutorFn {
  return (step) => ({
    state: 'COMPLETED' as const,
    output: { result: `ok-${step.stepId}` },
    error: null,
  });
}

function makePlan(def: WorkflowDefinition): ExecutionPlan {
  return new WorkflowGraphEngineImpl().plan(def);
}

function makeLinearDef(): WorkflowDefinition {
  return {
    workflowId: 'wf-linear',
    name: 'Linear',
    version: '1.0.0',
    steps: [
      { stepId: 'a', providerId: 'p1', operation: 'read', input: {}, dependsOn: [], timeoutMs: 5000 },
      { stepId: 'b', providerId: 'p2', operation: 'write', input: {}, dependsOn: ['a'], timeoutMs: 5000 },
      { stepId: 'c', providerId: 'p3', operation: 'delete', input: {}, dependsOn: ['b'], timeoutMs: 5000 },
    ],
    metadata: {},
  };
}

function makeDiamondDef(): WorkflowDefinition {
  return {
    workflowId: 'wf-diamond',
    name: 'Diamond',
    version: '1.0.0',
    steps: [
      { stepId: 'start', providerId: 'p1', operation: 'init', input: {}, dependsOn: [], timeoutMs: 5000 },
      { stepId: 'left', providerId: 'p2', operation: 'process', input: {}, dependsOn: ['start'], timeoutMs: 5000 },
      { stepId: 'right', providerId: 'p3', operation: 'process', input: {}, dependsOn: ['start'], timeoutMs: 5000 },
      { stepId: 'end', providerId: 'p4', operation: 'finalize', input: {}, dependsOn: ['left', 'right'], timeoutMs: 5000 },
    ],
    metadata: {},
  };
}

describe('WorkflowRecoveryManagerImpl', () => {
  let recovery: WorkflowRecoveryManagerImpl;

  beforeEach(() => {
    recovery = new WorkflowRecoveryManagerImpl();
  });

  // ── 5C.1 — Checkpoint ──

  describe('5C.1 — Checkpointing', () => {
    it('creates checkpoint from execution context', () => {
      const plan = makePlan(makeLinearDef());
      const runtime = new WorkflowRuntimeImpl();
      const planSteps: ConditionalExecutionStep[] = plan.orderedSteps.map((s) => ({
        ...s, condition: null, joinConfig: { type: 'ALL' as const },
      }));
      const ctx = runtime.execute(planSteps, successFn(), undefined, 'wf-linear');

      const cp = recovery.checkpoint(ctx, plan);
      expect(cp.workflowId).toBe('wf-linear');
      expect(cp.plan).toBeDefined();
      expect(cp.currentLevel).toBe(2);
      expect(cp.state).toBe('COMPLETED');
      expect(cp.createdAt).toBeDefined();
      expect(Object.keys(cp.stepResults)).toHaveLength(3);
    });

    it('captures step results in checkpoint', () => {
      const plan = makePlan(makeLinearDef());
      const runtime = new WorkflowRuntimeImpl();
      const planSteps: ConditionalExecutionStep[] = plan.orderedSteps.map((s) => ({
        ...s, condition: null, joinConfig: { type: 'ALL' as const },
      }));
      const ctx = runtime.execute(planSteps, successFn());

      const cp = recovery.checkpoint(ctx, plan);
      expect(cp.stepResults['a'].state).toBe('COMPLETED');
      expect(cp.stepResults['b'].state).toBe('COMPLETED');
      expect(cp.stepResults['c'].state).toBe('COMPLETED');
    });
  });

  // ── 5C.2 — Resume ──

  describe('5C.2 — Resume from Checkpoint', () => {
    it('resumes from checkpoint and completes remaining steps', () => {
      const plan = makePlan(makeLinearDef());
      const stepResults: Record<string, StepResult> = {
        a: { stepId: 'a', state: 'COMPLETED', output: { result: 'ok-a' }, error: null, startedAt: '', completedAt: '', durationMs: 0 },
      };

      const cp = {
        workflowId: 'wf-linear',
        plan,
        stepResults,
        currentLevel: 0,
        state: 'RUNNING' as WorkflowState,
        error: null,
        createdAt: new Date().toISOString(),
      };

      const ctx = recovery.resume(cp, successFn());
      expect(ctx.state).toBe('COMPLETED');
      expect(ctx.stepResults.get('a')!.state).toBe('COMPLETED');
      expect(ctx.stepResults.get('b')!.state).toBe('COMPLETED');
      expect(ctx.stepResults.get('c')!.state).toBe('COMPLETED');
    });

    it('throws for completed checkpoint', () => {
      const plan = makePlan(makeLinearDef());
      const cp = {
        workflowId: 'wf-1', plan, stepResults: {},
        currentLevel: 2, state: 'COMPLETED' as WorkflowState,
        error: null, createdAt: '',
      };
      expect(() => recovery.resume(cp, successFn()))
        .toThrow(WorkflowRecoveryError);
      expect(() => recovery.resume(cp, successFn()))
        .toThrow('Cannot resume a completed workflow');
    });

    it('resumes diamond workflow after start completes', () => {
      const plan = makePlan(makeDiamondDef());
      const stepResults: Record<string, StepResult> = {
        start: { stepId: 'start', state: 'COMPLETED', output: { result: 'ok-start' }, error: null, startedAt: '', completedAt: '', durationMs: 0 },
      };

      const cp = {
        workflowId: 'wf-diamond', plan, stepResults,
        currentLevel: 0, state: 'RUNNING' as WorkflowState,
        error: null, createdAt: new Date().toISOString(),
      };

      const ctx = recovery.resume(cp, successFn());
      expect(ctx.state).toBe('COMPLETED');
      expect(ctx.stepResults.get('start')!.state).toBe('COMPLETED');
      expect(ctx.stepResults.get('left')!.state).toBe('COMPLETED');
      expect(ctx.stepResults.get('right')!.state).toBe('COMPLETED');
      expect(ctx.stepResults.get('end')!.state).toBe('COMPLETED');
    });
  });

  // ── 5C.3 — Replay ──

  describe('5C.3 — Replay', () => {
    it('replays a valid workflow definition', () => {
      const ctx = recovery.replay(makeLinearDef(), successFn());
      expect(ctx.workflowId).toBe('wf-linear');
      expect(ctx.state).toBe('COMPLETED');
      expect(ctx.stepResults.size).toBe(3);
    });

    it('replays a diamond workflow', () => {
      const ctx = recovery.replay(makeDiamondDef(), successFn());
      expect(ctx.state).toBe('COMPLETED');
      expect(ctx.stepResults.size).toBe(4);
    });

    it('throws for invalid workflow', () => {
      const cyclic: WorkflowDefinition = {
        workflowId: 'wf-cycle',
        name: 'Cycle',
        version: '1.0.0',
        steps: [
          { stepId: 'a', providerId: 'p1', operation: 'read', input: {}, dependsOn: ['b'], timeoutMs: 5000 },
          { stepId: 'b', providerId: 'p2', operation: 'write', input: {}, dependsOn: ['a'], timeoutMs: 5000 },
        ],
        metadata: {},
      };
      expect(() => recovery.replay(cyclic, successFn())).toThrow(WorkflowRecoveryError);
      expect(() => recovery.replay(cyclic, successFn())).toThrow('cycle');
    });

    it('each replay produces deterministic results', () => {
      const ctx1 = recovery.replay(makeLinearDef(), successFn());
      const ctx2 = recovery.replay(makeLinearDef(), successFn());
      expect(ctx1.workflowId).toBe('wf-linear');
      expect(ctx2.workflowId).toBe('wf-linear');
      expect(ctx1.state).toBe('COMPLETED');
      expect(ctx2.state).toBe('COMPLETED');
      expect(ctx1.stepResults.size).toBe(ctx2.stepResults.size);
    });
  });

  // ── 5C.4 — Compensate ──

  describe('5C.4 — Compensation via Phase IV Rollback', () => {
    it('compensates completed steps on failed workflow', () => {
      // Execute a partial workflow
      const plan = makePlan(makeLinearDef());
      const runtime = new WorkflowRuntimeImpl();
      let failB = false;
      const executor: StepExecutorFn = (step) => {
        if (step.stepId === 'b') {
          failB = true;
          return { state: 'FAILED', output: null, error: 'step b failed' };
        }
        return { state: 'COMPLETED', output: { result: `ok-${step.stepId}` }, error: null };
      };

      const planSteps: ConditionalExecutionStep[] = plan.orderedSteps.map((s) => ({
        ...s, condition: null, joinConfig: { type: 'ALL' as const },
      }));
      const ctx = runtime.execute(planSteps, executor);
      expect(ctx.state).toBe('FAILED');

      const alwaysSucceed: CompensatorFn = () => 'COMPENSATED';
      const result = recovery.compensate(ctx, alwaysSucceed);
      expect(result.state).toBe('FULLY_COMPENSATED');
      expect(result.compensatedSteps.length).toBeGreaterThan(0);
    });

    it('throws when no completed steps exist', () => {
      const ctx: WorkflowExecutionContext = {
        workflowId: 'wf-empty',
        state: 'FAILED',
        stepResults: new Map(),
        startTime: '',
        completedAt: null,
        error: 'failed',
      };
      expect(() => recovery.compensate(ctx, () => 'COMPENSATED'))
        .toThrow(WorkflowRecoveryError);
    });

    it('only compensates steps with output', () => {
      const stepResults = new Map<string, StepResult>();
      stepResults.set('a', {
        stepId: 'a', state: 'COMPLETED', output: { id: '1' }, error: null,
        startedAt: '', completedAt: '', durationMs: 0,
      });
      stepResults.set('b', {
        stepId: 'b', state: 'COMPLETED', output: null, error: null,
        startedAt: '', completedAt: '', durationMs: 0,
      });

      const ctx: WorkflowExecutionContext = {
        workflowId: 'wf-partial',
        state: 'FAILED',
        stepResults,
        startTime: '',
        completedAt: null,
        error: 'error',
      };

      const captured: string[] = [];
      const tracingCompensator: CompensatorFn = (providerId, op, input) => {
        captured.push(providerId);
        return 'COMPENSATED';
      };

      recovery.compensate(ctx, tracingCompensator);
      expect(captured).toEqual(['a']);
    });

    it('returns FULLY_COMPENSATED when all compensations succeed', () => {
      const stepResults = new Map<string, StepResult>();
      stepResults.set('a', {
        stepId: 'a', state: 'COMPLETED', output: { x: 1 }, error: null,
        startedAt: '', completedAt: '', durationMs: 0,
      });

      const ctx: WorkflowExecutionContext = {
        workflowId: 'wf-comp',
        state: 'FAILED',
        stepResults,
        startTime: '',
        completedAt: null,
        error: 'err',
      };

      const result = recovery.compensate(ctx, () => 'COMPENSATED');
      expect(result.state).toBe('FULLY_COMPENSATED');
    });
  });

  // ── Full lifecycle ──

  describe('full lifecycle', () => {
    it('executes → checkpoints → resumes → completes', () => {
      const plan = makePlan(makeLinearDef());
      const runtime = new WorkflowRuntimeImpl();

      // Execute first step only
      const step1Plan: ConditionalExecutionStep[] = [
        { ...plan.orderedSteps[0], condition: null, joinConfig: { type: 'ALL' as const } },
      ];
      const ctx1 = runtime.execute(step1Plan, successFn(), undefined, 'wf-lifecycle');
      expect(ctx1.stepResults.get('a')!.state).toBe('COMPLETED');

      // Checkpoint — override state to RUNNING since we paused before completion
      const cp = recovery.checkpoint(
        { ...ctx1, state: 'RUNNING' as WorkflowState },
        plan,
      );
      expect(cp.currentLevel).toBe(0);

      // Resume
      const ctx2 = recovery.resume(cp, successFn());
      expect(ctx2.state).toBe('COMPLETED');
      expect(ctx2.stepResults.get('a')!.state).toBe('COMPLETED');
      expect(ctx2.stepResults.get('b')!.state).toBe('COMPLETED');
      expect(ctx2.stepResults.get('c')!.state).toBe('COMPLETED');
    });
  });
});
