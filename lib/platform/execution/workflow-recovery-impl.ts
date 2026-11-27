import { ExecutionPlan, WorkflowDefinition, WorkflowGraphEngine } from "./workflow-graph";
import { WorkflowGraphEngineImpl } from "./workflow-graph-impl";
import {
  ConditionalExecutionStep,
  ConditionEvaluator,
  StepExecutorFn,
  StepResult,
  WorkflowExecutionContext,
  WorkflowState,
} from "./workflow-runtime";
import { WorkflowRuntimeImpl } from "./workflow-runtime-impl";
import { CompensatorFn, RollbackResult } from "./cross-provider-rollback";
import { CrossProviderRollbackImpl } from "./cross-provider-rollback-impl";
import { WorkflowCheckpoint, WorkflowRecoveryManager } from "./workflow-recovery";

export class WorkflowRecoveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkflowRecoveryError';
  }
}

export class WorkflowRecoveryManagerImpl implements WorkflowRecoveryManager {
  private readonly graphEngine: WorkflowGraphEngine;
  private readonly runtime: WorkflowRuntimeImpl;
  private readonly rollback: CrossProviderRollbackImpl;

  constructor(
    graphEngine?: WorkflowGraphEngine,
    runtime?: WorkflowRuntimeImpl,
    rollback?: CrossProviderRollbackImpl,
  ) {
    this.graphEngine = graphEngine ?? new WorkflowGraphEngineImpl();
    this.runtime = runtime ?? new WorkflowRuntimeImpl();
    this.rollback = rollback ?? new CrossProviderRollbackImpl();
  }

  // ── Checkpoint ──

  checkpoint(
    ctx: WorkflowExecutionContext,
    plan: ExecutionPlan,
  ): WorkflowCheckpoint {
    const completedLevel = this.findCurrentLevel(ctx, plan);

    return {
      workflowId: ctx.workflowId,
      plan,
      stepResults: Object.fromEntries(ctx.stepResults),
      currentLevel: completedLevel,
      state: ctx.state,
      error: ctx.error,
      createdAt: new Date().toISOString(),
    };
  }

  // ── Resume ──

  resume(
    checkpoint: WorkflowCheckpoint,
    executor: StepExecutorFn,
    conditionFn?: ConditionEvaluator,
  ): WorkflowExecutionContext {
    if (checkpoint.state === 'COMPLETED') {
      throw new WorkflowRecoveryError('Cannot resume a completed workflow');
    }
    if (checkpoint.state === 'FAILED' && checkpoint.currentLevel < 0) {
      throw new WorkflowRecoveryError('Cannot resume a workflow with no completed steps');
    }

    // Build remaining steps starting from the next level
    const plan = checkpoint.plan;
    const remainingLevels = checkpoint.currentLevel + 1;
    const remainingSteps: ConditionalExecutionStep[] = [];

    for (const step of plan.orderedSteps) {
      if (step.level >= remainingLevels) {
        // Only include if not already completed
        const existingResult = checkpoint.stepResults[step.stepId];
        if (!existingResult || existingResult.state === 'FAILED' || existingResult.state === 'SKIPPED') {
          remainingSteps.push({
            ...step,
            condition: null,
            joinConfig: { type: 'ALL' },
          });
        }
      }
    }

    if (remainingSteps.length === 0) {
      // Nothing to resume — reconstruct context from checkpoint
      return {
        workflowId: checkpoint.workflowId,
        state: 'COMPLETED',
        stepResults: new Map(Object.entries(checkpoint.stepResults)),
        startTime: checkpoint.createdAt,
        completedAt: new Date().toISOString(),
        error: null,
      };
    }

    // Execute remaining steps
    const resumeCtx = this.runtime.execute(
      remainingSteps,
      executor,
      conditionFn,
      checkpoint.workflowId,
    );

    // Merge checkpoint results with new results
    const mergedResults = new Map(Object.entries(checkpoint.stepResults));
    for (const [stepId, result] of resumeCtx.stepResults) {
      mergedResults.set(stepId, result);
    }

    return {
      workflowId: checkpoint.workflowId,
      state: resumeCtx.state,
      stepResults: mergedResults,
      startTime: checkpoint.createdAt,
      completedAt: resumeCtx.completedAt,
      error: resumeCtx.error,
    };
  }

  // ── Replay ──

  replay(
    definition: WorkflowDefinition,
    executor: StepExecutorFn,
    conditionFn?: ConditionEvaluator,
  ): WorkflowExecutionContext {
    const validation = this.graphEngine.validate(definition);
    if (!validation.valid) {
      const reasons: string[] = [];
      if (validation.cycles.length > 0) reasons.push('cycle');
      if (validation.missingDependencies.length > 0) reasons.push('missing dependencies');
      if (validation.duplicateSteps.length > 0) reasons.push('duplicate steps');
      if (validation.emptyWorkflow) reasons.push('empty');
      throw new WorkflowRecoveryError(
        `Cannot replay invalid workflow: ${reasons.join(', ')}`,
      );
    }

    const plan = this.graphEngine.plan(definition);

    const planSteps: ConditionalExecutionStep[] = plan.orderedSteps.map((s) => ({
      ...s,
      condition: null,
      joinConfig: { type: 'ALL' as const },
    }));

    return this.runtime.execute(planSteps, executor, conditionFn, definition.workflowId);
  }

  // ── Compensate ──

  compensate(
    ctx: WorkflowExecutionContext,
    compensator: CompensatorFn,
  ): RollbackResult {
    const completedSteps: Array<{
      stepIndex: number;
      providerId: string;
      operation: string;
      result: Readonly<Record<string, unknown>>;
    }> = [];

    // Assign stepIndex based on order of completion
    let idx = 0;
    for (const [stepId, result] of ctx.stepResults) {
      if (result.state === 'COMPLETED' && result.output) {
        completedSteps.push({
          stepIndex: idx,
          providerId: stepId,
          operation: 'workflow.step',
          result: result.output,
        });
        idx++;
      }
    }

    if (completedSteps.length === 0) {
      throw new WorkflowRecoveryError('No completed steps to compensate');
    }

    return this.rollback.rollback(ctx.workflowId, completedSteps, compensator);
  }

  // ── Private ──

  private findCurrentLevel(
    ctx: WorkflowExecutionContext,
    plan: ExecutionPlan,
  ): number {
    const sorted = [...plan.orderedSteps].sort(
      (a, b) => b.level - a.level,
    );

    for (const step of sorted) {
      const result = ctx.stepResults.get(step.stepId);
      if (result && (result.state === 'COMPLETED' || result.state === 'FAILED')) {
        return step.level;
      }
    }

    // No steps started yet
    return -1;
  }
}
