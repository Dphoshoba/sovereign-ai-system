import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowRuntimeImpl, WorkflowRuntimeError, defaultConditionEvaluator } from '../../lib/platform/execution/workflow-runtime-impl';
import {
  ConditionalExecutionStep,
  StepExecutorFn,
  WorkflowState,
} from '../../lib/platform/execution/workflow-runtime';

function successStep(stepId: string, output: Record<string, unknown> = {}): ConditionalExecutionStep {
  return {
    stepId, providerId: 'p1', operation: 'read', input: {}, dependsOn: [],
    level: 0, timeoutMs: 5000, condition: null, joinConfig: { type: 'ALL' },
  };
}

function successFn(overrides?: Partial<Record<string, Record<string, unknown>>>): StepExecutorFn {
  return (step) => ({
    state: 'COMPLETED',
    output: overrides?.[step.stepId] ?? { result: 'ok' },
    error: null,
  });
}

describe('WorkflowRuntimeImpl', () => {
  let runtime: WorkflowRuntimeImpl;

  beforeEach(() => {
    runtime = new WorkflowRuntimeImpl();
  });

  // ── 5B.1 — Sequential Execution ──

  describe('5B.1 — Sequential Execution', () => {
    const linearSteps: ConditionalExecutionStep[] = [
      { ...successStep('a'), level: 0 },
      { ...successStep('b'), level: 1, dependsOn: ['a'] },
      { ...successStep('c'), level: 2, dependsOn: ['b'] },
    ];

    it('executes linear workflow in order', () => {
      const order: string[] = [];
      const tracker: StepExecutorFn = (step) => {
        order.push(step.stepId);
        return { state: 'COMPLETED', output: null, error: null };
      };
      runtime.execute(linearSteps, tracker);
      expect(order).toEqual(['a', 'b', 'c']);
    });

    it('sets workflow state to COMPLETED', () => {
      const ctx = runtime.execute(linearSteps, successFn());
      expect(ctx.state).toBe('COMPLETED');
      expect(ctx.completedAt).toBeDefined();
    });

    it('includes workflowId in context', () => {
      const ctx = runtime.execute(linearSteps, successFn(), undefined, 'my-wf');
      expect(ctx.workflowId).toBe('my-wf');
    });

    it('records step results for all steps', () => {
      const ctx = runtime.execute(linearSteps, successFn());
      expect(ctx.stepResults.size).toBe(3);
      expect(ctx.stepResults.get('a')!.state).toBe('COMPLETED');
      expect(ctx.stepResults.get('b')!.state).toBe('COMPLETED');
      expect(ctx.stepResults.get('c')!.state).toBe('COMPLETED');
    });
  });

  // ── 5B.2 — Parallel Branch Scheduling ──

  describe('5B.2 — Parallel Branch Scheduling', () => {
    it('executes independent steps at same level (order-agnostic)', () => {
      const steps: ConditionalExecutionStep[] = [
        { ...successStep('a'), level: 0 },
        { ...successStep('b'), level: 0 },
        { ...successStep('c'), level: 0 },
      ];
      const ctx = runtime.execute(steps, successFn());
      expect(ctx.stepResults.size).toBe(3);
      for (const id of ['a', 'b', 'c']) {
        expect(ctx.stepResults.get(id)!.state).toBe('COMPLETED');
      }
      expect(ctx.state).toBe('COMPLETED');
    });

    it('executes diamond DAG correctly', () => {
      const steps: ConditionalExecutionStep[] = [
        { ...successStep('start'), level: 0 },
        { ...successStep('left'), level: 1, dependsOn: ['start'] },
        { ...successStep('right'), level: 1, dependsOn: ['start'] },
        { ...successStep('end'), level: 2, dependsOn: ['left', 'right'] },
      ];
      const ctx = runtime.execute(steps, successFn());
      expect(ctx.state).toBe('COMPLETED');
      expect(ctx.stepResults.get('start')!.state).toBe('COMPLETED');
      expect(ctx.stepResults.get('left')!.state).toBe('COMPLETED');
      expect(ctx.stepResults.get('right')!.state).toBe('COMPLETED');
      expect(ctx.stepResults.get('end')!.state).toBe('COMPLETED');
    });
  });

  // ── 5B.3 — Conditional Routing ──

  describe('5B.3 — Conditional Routing', () => {
    it('skips step when condition referencing predecessor is false', () => {
      const steps: ConditionalExecutionStep[] = [
        { ...successStep('check'), level: 0, condition: null, joinConfig: { type: 'ALL' } },
        {
          ...successStep('init'), level: 1, dependsOn: ['check'],
          input: { action: 'create' },
          condition: { type: 'output_equals', stepId: 'check', field: 'result', value: 'should-skip' },
          joinConfig: { type: 'ALL' },
        },
      ];

      const executor: StepExecutorFn = (step) => {
        if (step.stepId === 'check') return { state: 'COMPLETED', output: { result: 'other-value' }, error: null };
        return { state: 'COMPLETED', output: { result: 'ok' }, error: null };
      };

      const ctx = runtime.execute(steps, executor);
      expect(ctx.stepResults.get('init')!.state).toBe('SKIPPED');
    });

    it('executes step when condition referencing predecessor is true', () => {
      const steps: ConditionalExecutionStep[] = [
        { ...successStep('check'), level: 0, condition: null, joinConfig: { type: 'ALL' } },
        {
          ...successStep('init'), level: 1, dependsOn: ['check'],
          condition: { type: 'output_equals', stepId: 'check', field: 'result', value: 'ok' },
          joinConfig: { type: 'ALL' },
        },
      ];

      const executor: StepExecutorFn = (step) => {
        if (step.stepId === 'check') return { state: 'COMPLETED', output: { result: 'ok' }, error: null };
        return { state: 'COMPLETED', output: null, error: null };
      };

      const ctx = runtime.execute(steps, executor);
      expect(ctx.stepResults.get('init')!.state).toBe('COMPLETED');
    });

    it('evaluates AND conditions', () => {
      const steps: ConditionalExecutionStep[] = [
        { ...successStep('a'), level: 0, condition: null, joinConfig: { type: 'ALL' } },
        {
          ...successStep('b'), level: 1, dependsOn: ['a'],
          condition: {
            type: 'and',
            conditions: [
              { type: 'output_equals', stepId: 'a', field: 'x', value: 1 },
              { type: 'output_equals', stepId: 'a', field: 'y', value: 2 },
            ],
          },
          joinConfig: { type: 'ALL' },
        },
      ];

      const executor: StepExecutorFn = (step) => {
        if (step.stepId === 'a') return { state: 'COMPLETED', output: { x: 1, y: 2 }, error: null };
        return { state: 'COMPLETED', output: null, error: null };
      };

      const ctx = runtime.execute(steps, executor);
      expect(ctx.stepResults.get('b')!.state).toBe('COMPLETED');
    });

    it('evaluates OR conditions', () => {
      const steps: ConditionalExecutionStep[] = [
        { ...successStep('a'), level: 0, condition: null, joinConfig: { type: 'ALL' } },
        {
          ...successStep('b'), level: 1, dependsOn: ['a'],
          condition: {
            type: 'or',
            conditions: [
              { type: 'output_equals', stepId: 'a', field: 'x', value: 999 },
              { type: 'output_equals', stepId: 'a', field: 'y', value: 'yes' },
            ],
          },
          joinConfig: { type: 'ALL' },
        },
      ];

      const executor: StepExecutorFn = (step) => {
        if (step.stepId === 'a') return { state: 'COMPLETED', output: { x: 1, y: 'yes' }, error: null };
        return { state: 'COMPLETED', output: null, error: null };
      };

      const ctx = runtime.execute(steps, executor);
      expect(ctx.stepResults.get('b')!.state).toBe('COMPLETED');
    });
  });

  // ── 5B.4 — Join Nodes ──

  describe('5B.4 — Join Nodes', () => {
    it('ALL join: skips successor when a predecessor fails', () => {
      const steps: ConditionalExecutionStep[] = [
        { ...successStep('a'), level: 0, condition: null, joinConfig: { type: 'ALL' } },
        { ...successStep('b'), level: 0, condition: null, joinConfig: { type: 'ALL' } },
        {
          stepId: 'c', providerId: 'p3', operation: 'write', input: {},
          dependsOn: ['a', 'b'],
          level: 1, timeoutMs: 5000, condition: null, joinConfig: { type: 'ALL' },
        },
      ];

      const executor: StepExecutorFn = (step) => {
        if (step.stepId === 'b') return { state: 'FAILED', output: null, error: 'b failed' };
        return { state: 'COMPLETED', output: null, error: null };
      };

      const ctx = runtime.execute(steps, executor);
      expect(ctx.stepResults.get('c')!.state).toBe('SKIPPED');
      expect(ctx.stepResults.get('c')!.error).toBe('Predecessor step failed');
    });

    it('ANY join: executes successor when at least one predecessor succeeds', () => {
      const steps: ConditionalExecutionStep[] = [
        { ...successStep('a'), level: 0, condition: null, joinConfig: { type: 'ALL' } },
        { ...successStep('b'), level: 0, condition: null, joinConfig: { type: 'ALL' } },
        {
          stepId: 'c', providerId: 'p3', operation: 'write', input: {},
          dependsOn: ['a', 'b'],
          level: 1, timeoutMs: 5000, condition: null, joinConfig: { type: 'ANY' },
        },
      ];

      let bCalled = false;
      const executor: StepExecutorFn = (step) => {
        if (step.stepId === 'b') {
          bCalled = true;
          return { state: 'FAILED', output: null, error: 'b failed' };
        }
        return { state: 'COMPLETED', output: null, error: null };
      };

      const ctx = runtime.execute(steps, executor);
      expect(bCalled).toBe(true);
      expect(ctx.stepResults.get('c')!.state).toBe('COMPLETED');
    });

    it('ANY join: skips successor when ALL predecessors fail', () => {
      const steps: ConditionalExecutionStep[] = [
        {
          stepId: 'a', providerId: 'p1', operation: 'read', input: {},
          dependsOn: [], level: 0, timeoutMs: 5000, condition: null,
          joinConfig: { type: 'ALL' },
        },
        {
          stepId: 'b', providerId: 'p2', operation: 'read', input: {},
          dependsOn: [], level: 0, timeoutMs: 5000, condition: null,
          joinConfig: { type: 'ALL' },
        },
        {
          stepId: 'c', providerId: 'p3', operation: 'write', input: {},
          dependsOn: ['a', 'b'],
          level: 1, timeoutMs: 5000, condition: null, joinConfig: { type: 'ANY' },
        },
      ];

      const executor: StepExecutorFn = () =>
        ({ state: 'FAILED', output: null, error: 'failed' });

      const ctx = runtime.execute(steps, executor);
      expect(ctx.stepResults.get('c')!.state).toBe('SKIPPED');
    });
  });

  // ── 5B.5 — Failure Propagation ──

  describe('5B.5 — Failure Propagation', () => {
    it('marks workflow FAILED when a step fails', () => {
      const steps: ConditionalExecutionStep[] = [
        { ...successStep('a'), level: 0 },
        { ...successStep('b'), level: 0 },
      ];

      const executor: StepExecutorFn = (step) => {
        if (step.stepId === 'b') return { state: 'FAILED', output: null, error: 'fatal error' };
        return { state: 'COMPLETED', output: null, error: null };
      };

      const ctx = runtime.execute(steps, executor);
      expect(ctx.state).toBe('FAILED');
      expect(ctx.error).toBe('fatal error');
      expect(ctx.completedAt).toBeDefined();
    });

    it('marks subsequent levels as SKIPPED after predecessor failure', () => {
      const steps: ConditionalExecutionStep[] = [
        { ...successStep('a'), level: 0 },
        {
          stepId: 'b', providerId: 'p2', operation: 'fail', input: {},
          dependsOn: [], level: 0, timeoutMs: 5000, condition: null,
          joinConfig: { type: 'ALL' },
        },
        {
          stepId: 'c', providerId: 'p3', operation: 'write', input: {},
          dependsOn: ['a', 'b'],
          level: 1, timeoutMs: 5000, condition: null, joinConfig: { type: 'ALL' },
        },
      ];

      const executor: StepExecutorFn = (step) =>
        step.stepId === 'b'
          ? { state: 'FAILED', output: null, error: 'fail' }
          : { state: 'COMPLETED', output: null, error: null };

      const ctx = runtime.execute(steps, executor);
      expect(ctx.state).toBe('FAILED');
      expect(ctx.stepResults.get('c')!.state).toBe('SKIPPED');
    });

    it('records step-level error message on failure', () => {
      const steps: ConditionalExecutionStep[] = [
        { ...successStep('a'), level: 0 },
      ];

      const executor: StepExecutorFn = () =>
        ({ state: 'FAILED', output: null, error: 'rate limited' });

      const ctx = runtime.execute(steps, executor);
      expect(ctx.stepResults.get('a')!.state).toBe('FAILED');
      expect(ctx.stepResults.get('a')!.error).toBe('rate limited');
    });

    it('records step timestamps and duration', () => {
      const steps: ConditionalExecutionStep[] = [
        { ...successStep('a'), level: 0 },
      ];

      const ctx = runtime.execute(steps, successFn());
      const result = ctx.stepResults.get('a')!;
      expect(result.startedAt).toBeDefined();
      expect(result.completedAt).toBeDefined();
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Edge Cases ──

  describe('edge cases', () => {
    it('rejects empty workflow', () => {
      expect(() => runtime.execute([], successFn())).toThrow(WorkflowRuntimeError);
      expect(() => runtime.execute([], successFn())).toThrow('empty workflow');
    });

    it('handles single-step workflow', () => {
      const ctx = runtime.execute([successStep('a')], successFn());
      expect(ctx.state).toBe('COMPLETED');
      expect(ctx.stepResults.get('a')!.state).toBe('COMPLETED');
    });

    it('handles executor throwing an error', () => {
      const steps: ConditionalExecutionStep[] = [
        { ...successStep('a'), level: 0 },
      ];

      const executor: StepExecutorFn = () => {
        throw new Error('executor crashed');
      };

      const ctx = runtime.execute(steps, executor);
      expect(ctx.stepResults.get('a')!.state).toBe('FAILED');
      expect(ctx.stepResults.get('a')!.error).toBe('executor crashed');
    });

    it('defaultConditionEvaluator returns false for unknown type', () => {
      const result = defaultConditionEvaluator(
        { type: 'unknown' as any, stepId: 'a', field: 'x', value: 1 },
        new Map(),
      );
      expect(result).toBe(false);
    });

    it('defaultConditionEvaluator returns false for missing step result', () => {
      const result = defaultConditionEvaluator(
        { type: 'output_equals', stepId: 'nonexistent', field: 'x', value: 1 },
        new Map(),
      );
      expect(result).toBe(false);
    });

    it('defaultConditionEvaluator returns false for step without output', () => {
      const results = new Map();
      results.set('a', {
        stepId: 'a', state: 'COMPLETED' as const,
        output: null, error: null,
        startedAt: '', completedAt: '', durationMs: 0,
      });
      const result = defaultConditionEvaluator(
        { type: 'output_equals', stepId: 'a', field: 'x', value: 1 },
        results,
      );
      expect(result).toBe(false);
    });
  });

  // ── Full lifecycle ──

  describe('full lifecycle scenario', () => {
    it('executes a realistic workflow with all features', () => {
      const steps: ConditionalExecutionStep[] = [
        // Level 0 — Init
        {
          stepId: 'validate', providerId: 'p1', operation: 'validate_input', input: { data: 'test' },
          dependsOn: [], level: 0, timeoutMs: 5000, condition: null, joinConfig: { type: 'ALL' },
        },
        {
          stepId: 'enrich', providerId: 'p2', operation: 'enrich_data', input: { source: 'db' },
          dependsOn: [], level: 0, timeoutMs: 5000, condition: null, joinConfig: { type: 'ALL' },
        },
        // Level 1 — Process
        {
          stepId: 'process', providerId: 'p3', operation: 'process', input: {},
          dependsOn: ['validate', 'enrich'], level: 1, timeoutMs: 5000,
          condition: null, joinConfig: { type: 'ALL' },
        },
        // Level 2 — Conditional branch
        {
          stepId: 'notify', providerId: 'p4', operation: 'send_email', input: { to: 'ops@co' },
          dependsOn: ['process'], level: 2, timeoutMs: 5000,
          condition: { type: 'output_equals', stepId: 'process', field: 'result', value: 'ok' },
          joinConfig: { type: 'ALL' },
        },
        {
          stepId: 'archive', providerId: 'p5', operation: 'archive', input: {},
          dependsOn: ['process'], level: 2, timeoutMs: 5000,
          condition: null, joinConfig: { type: 'ALL' },
        },
      ];

      const executor: StepExecutorFn = (step) => {
        switch (step.stepId) {
          case 'validate': return { state: 'COMPLETED', output: { valid: true }, error: null };
          case 'enrich': return { state: 'COMPLETED', output: { enriched: true }, error: null };
          case 'process': return { state: 'COMPLETED', output: { result: 'ok' }, error: null };
          case 'notify': return { state: 'COMPLETED', output: { sent: true }, error: null };
          case 'archive': return { state: 'COMPLETED', output: { archived: true }, error: null };
          default: return { state: 'FAILED', output: null, error: 'unknown step' };
        }
      };

      const ctx = runtime.execute(steps, executor);
      expect(ctx.state).toBe('COMPLETED');
      expect(ctx.stepResults.get('validate')!.state).toBe('COMPLETED');
      expect(ctx.stepResults.get('enrich')!.state).toBe('COMPLETED');
      expect(ctx.stepResults.get('process')!.state).toBe('COMPLETED');
      expect(ctx.stepResults.get('notify')!.state).toBe('COMPLETED');
      expect(ctx.stepResults.get('archive')!.state).toBe('COMPLETED');
      expect(ctx.stepResults.size).toBe(5);
    });
  });
});
