import { ExecutionPlan, WorkflowDefinition } from "./workflow-graph";
import {
  ConditionEvaluator,
  StepExecutorFn,
  StepResult,
  WorkflowExecutionContext,
  WorkflowState,
} from "./workflow-runtime";
import { CompensatorFn, RollbackResult } from "./cross-provider-rollback";

// ── Checkpoint ──

export interface WorkflowCheckpoint {
  readonly workflowId: string;
  readonly plan: ExecutionPlan;
  readonly stepResults: Readonly<Record<string, StepResult>>;
  readonly currentLevel: number;
  readonly state: WorkflowState;
  readonly error: string | null;
  readonly createdAt: string;
}

// ── Recovery Manager ──

export interface WorkflowRecoveryManager {
  checkpoint(
    ctx: WorkflowExecutionContext,
    plan: ExecutionPlan,
  ): WorkflowCheckpoint;

  resume(
    checkpoint: WorkflowCheckpoint,
    executor: StepExecutorFn,
    conditionFn?: ConditionEvaluator,
  ): WorkflowExecutionContext;

  replay(
    definition: WorkflowDefinition,
    executor: StepExecutorFn,
    conditionFn?: ConditionEvaluator,
  ): WorkflowExecutionContext;

  compensate(
    ctx: WorkflowExecutionContext,
    compensator: CompensatorFn,
  ): RollbackResult;
}
