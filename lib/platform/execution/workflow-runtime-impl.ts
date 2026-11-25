import { ExecutionPlanStep } from "./workflow-graph";
import {
  AndCondition,
  ConditionalExecutionStep,
  ConditionEvaluator,
  JoinConfig,
  JoinType,
  OrCondition,
  OutputCondition,
  StepCondition,
  StepExecutorFn,
  StepResult,
  StepState,
  WorkflowExecutionContext,
  WorkflowRuntime,
  WorkflowState,
} from "./workflow-runtime";

export class WorkflowRuntimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkflowRuntimeError';
  }
}

let nextWfExecutionId = 0;

export class WorkflowRuntimeImpl implements WorkflowRuntime {
  execute(
    steps: readonly ConditionalExecutionStep[],
    executor: StepExecutorFn,
    conditionFn?: ConditionEvaluator,
    workflowId?: string,
  ): WorkflowExecutionContext {
    if (steps.length === 0) {
      throw new WorkflowRuntimeError('Cannot execute empty workflow');
    }

    nextWfExecutionId++;
    const wfId = workflowId ?? `wf-exec-${nextWfExecutionId}`;
    const startTime = new Date().toISOString();
    const stepResults = new Map<string, StepResult>();
    let workflowState: WorkflowState = 'RUNNING';
    let workflowError: string | null = null;

    const evaluateCondition: ConditionEvaluator =
      conditionFn ?? defaultConditionEvaluator;

    // Group steps by level
    const maxLevel = Math.max(...steps.map((s) => s.level));
    const levels = new Map<number, ConditionalExecutionStep[]>();
    for (const s of steps) {
      const list = levels.get(s.level) ?? [];
      list.push(s);
      levels.set(s.level, list);
    }

    for (let level = 0; level <= maxLevel; level++) {
      const levelSteps = levels.get(level) ?? [];

      for (const step of levelSteps) {
        // Check if step already completed by a prior level reference
        if (stepResults.has(step.stepId)) continue;

        // Check join condition — if a predecessor failed and join is ALL, skip
        const skipDueToFailedDeps = shouldSkipDueToFailedDeps(
          step,
          stepResults,
        );

        if (skipDueToFailedDeps) {
          stepResults.set(step.stepId, {
            stepId: step.stepId,
            state: 'SKIPPED',
            output: null,
            error: 'Predecessor step failed',
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            durationMs: 0,
          });
          continue;
        }

        // Check condition
        if (step.condition) {
          const conditionResult = evaluateCondition(step.condition, stepResults);
          if (!conditionResult) {
            stepResults.set(step.stepId, {
              stepId: step.stepId,
              state: 'SKIPPED',
              output: null,
              error: null,
              startedAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
              durationMs: 0,
            });
            continue;
          }
        }

        // Execute step
        const stepStartTime = Date.now();
        const startedAt = new Date(stepStartTime).toISOString();

        let stepState: StepState;
        let stepOutput: Record<string, unknown> | null = null;
        let stepError: string | null = null;

        try {
          const result = executor({
            stepId: step.stepId,
            providerId: step.providerId,
            operation: step.operation,
            input: { ...step.input },
            timeoutMs: step.timeoutMs,
          });

          if (result.state === 'COMPLETED') {
            stepState = 'COMPLETED';
            stepOutput = result.output ? { ...result.output } : null;
          } else {
            stepState = 'FAILED';
            stepError = result.error;
          }
        } catch (err) {
          stepState = 'FAILED';
          stepError = err instanceof Error ? err.message : String(err);
        }

        const completedAt = new Date().toISOString();
        const durationMs = Date.now() - stepStartTime;

        stepResults.set(step.stepId, {
          stepId: step.stepId,
          state: stepState,
          output: stepOutput,
          error: stepError,
          startedAt,
          completedAt,
          durationMs,
        });

        // Mark failure — continue processing remaining steps
        if (stepState === 'FAILED') {
          workflowState = 'FAILED';
          workflowError = stepError;
        }
      }
    }

    // Determine final state
    if (workflowState === 'RUNNING') {
      const anyFailed = [...stepResults.values()].some(
        (r) => r.state === 'FAILED',
      );
      const anyRunning = [...stepResults.values()].some(
        (r) => r.state === 'RUNNING',
      );
      if (anyFailed) {
        workflowState = 'FAILED';
      } else if (!anyRunning) {
        workflowState = 'COMPLETED';
      }
    }

    return {
      workflowId: wfId,
      state: workflowState,
      stepResults,
      startTime,
      completedAt:
        workflowState === 'COMPLETED' || workflowState === 'FAILED'
          ? new Date().toISOString()
          : null,
      error: workflowError,
    };
  }
}

// ── Join Logic ──

function shouldSkipDueToFailedDeps(
  step: ConditionalExecutionStep,
  results: Readonly<Map<string, StepResult>>,
): boolean {
  const directDeps = step.dependsOn.filter(
    (depId) => results.has(depId) && depId !== step.stepId,
  );

  if (directDeps.length === 0) return false;

  const joinType = step.joinConfig?.type ?? 'ALL';

  if (joinType === 'ANY') {
    // Skip only if ALL predecessors failed
    return directDeps.every((depId) => {
      const r = results.get(depId);
      return r && (r.state === 'FAILED' || r.state === 'SKIPPED');
    });
  }

  // ALL — skip if any predecessor failed
  return directDeps.some((depId) => {
    const r = results.get(depId);
    return r && (r.state === 'FAILED' || r.state === 'SKIPPED');
  });
}

// ── Default Condition Evaluator ──

function getNestedField(
  obj: Record<string, unknown>,
  field: string,
): unknown {
  const parts = field.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export const defaultConditionEvaluator: ConditionEvaluator = (
  condition: StepCondition,
  results: Readonly<Map<string, StepResult>>,
): boolean => {
  switch (condition.type) {
    case 'output_equals': {
      const oc = condition as OutputCondition;
      const stepResult = results.get(oc.stepId);
      if (!stepResult || !stepResult.output) return false;
      const actual = getNestedField(stepResult.output, oc.field);
      return actual === oc.value;
    }

    case 'and': {
      const ac = condition as AndCondition;
      return ac.conditions.every((c) =>
        defaultConditionEvaluator(c, results),
      );
    }

    case 'or': {
      const oc = condition as OrCondition;
      return oc.conditions.some((c) =>
        defaultConditionEvaluator(c, results),
      );
    }

    default:
      return false;
  }
};
