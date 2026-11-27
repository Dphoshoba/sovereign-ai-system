import { ExecutionPlanStep } from "./workflow-graph";

// ── States ──

export type WorkflowState = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RECOVERING';
export type StepState = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

// ── Conditions ──

export interface OutputCondition {
  readonly type: 'output_equals';
  readonly stepId: string;
  readonly field: string;
  readonly value: unknown;
}

export interface AndCondition {
  readonly type: 'and';
  readonly conditions: readonly StepCondition[];
}

export interface OrCondition {
  readonly type: 'or';
  readonly conditions: readonly StepCondition[];
}

export type StepCondition = OutputCondition | AndCondition | OrCondition;

// ── Joins ──

export type JoinType = 'ALL' | 'ANY';

export interface JoinConfig {
  readonly type: JoinType;
}

// ── Step Metadata ──

export interface ConditionalExecutionStep extends ExecutionPlanStep {
  readonly condition: StepCondition | null;
  readonly joinConfig: JoinConfig;
}

// ── Step Result ──

export interface StepResult {
  readonly stepId: string;
  readonly state: StepState;
  readonly output: Readonly<Record<string, unknown>> | null;
  readonly error: string | null;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly durationMs: number;
}

// ── Execution Context ──

export interface WorkflowExecutionContext {
  readonly workflowId: string;
  readonly state: WorkflowState;
  readonly stepResults: Readonly<Map<string, StepResult>>;
  readonly startTime: string;
  readonly completedAt: string | null;
  readonly error: string | null;
}

// ── Step Executor ──

export interface StepInput {
  readonly stepId: string;
  readonly providerId: string;
  readonly operation: string;
  readonly input: Readonly<Record<string, unknown>>;
  readonly timeoutMs: number;
}

export interface StepOutput {
  readonly state: 'COMPLETED' | 'FAILED';
  readonly output: Readonly<Record<string, unknown>> | null;
  readonly error: string | null;
}

export interface StepExecutorFn {
  (step: StepInput): StepOutput;
}

// ── Condition Evaluator ──

export interface ConditionEvaluator {
  (condition: StepCondition, results: Readonly<Map<string, StepResult>>): boolean;
}

// ── Runtime ──

export interface WorkflowRuntime {
  execute(
    steps: readonly ConditionalExecutionStep[],
    executor: StepExecutorFn,
    conditionFn?: ConditionEvaluator,
    workflowId?: string,
  ): WorkflowExecutionContext;
}
