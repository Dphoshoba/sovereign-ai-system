import { RollbackPlan } from "../rollback-contract";
import { CompensationChain, CompensationStep } from "./types";

export interface RollbackValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class RollbackValidator {
  validatePlan(plan: RollbackPlan): RollbackValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!plan.rollbackId) {
      errors.push('MISSING_ROLLBACK_ID: rollbackId is required');
    }
    if (!plan.executionId) {
      errors.push('MISSING_EXECUTION_ID: executionId is required');
    }
    if (!plan.connectorId) {
      errors.push('MISSING_CONNECTOR_ID: connectorId is required');
    }
    if (!plan.operation) {
      errors.push('MISSING_OPERATION: operation is required');
    }
    if (!plan.strategy) {
      errors.push('MISSING_STRATEGY: strategy is required');
    }
    if (!plan.scope) {
      errors.push('MISSING_SCOPE: scope is required');
    }
    if (!plan.planHash) {
      errors.push('MISSING_PLAN_HASH: planHash is required');
    }

    if (plan.scope === 'NONE') {
      warnings.push('SCOPE_IS_NONE: rollback plan has NONE scope — no rollback will occur');
    }

    if (!plan.steps || plan.steps.length === 0) {
      warnings.push('NO_STEPS: rollback plan has no steps');
    }

    for (const step of plan.steps || []) {
      if (step.stepIndex < 0) {
        errors.push(`INVALID_STEP_INDEX: step ${step.action} has negative index`);
      }
      if (!step.action) {
        errors.push('MISSING_STEP_ACTION: a step has no action');
      }
      if (!step.compensatingOperation) {
        errors.push(`MISSING_COMPENSATING_OPERATION: step ${step.stepIndex} has no compensating operation`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  validateChain(chain: CompensationChain): RollbackValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!chain.chainId) {
      errors.push('MISSING_CHAIN_ID: chainId is required');
    }
    if (!chain.executionId) {
      errors.push('MISSING_CHAIN_EXECUTION_ID: executionId is required');
    }
    if (!chain.strategy) {
      errors.push('MISSING_CHAIN_STRATEGY: strategy is required');
    }
    if (!chain.chainHash) {
      errors.push('MISSING_CHAIN_HASH: chainHash is required');
    }

    if (chain.steps.length === 0) {
      warnings.push('EMPTY_CHAIN: compensation chain has no steps');
    }

    if (chain.completedSteps > chain.totalSteps) {
      errors.push('INVALID_COMPLETION: completedSteps exceeds totalSteps');
    }

    const pendingSteps = chain.steps.filter((s) => s.status === 'PENDING').length;
    const executingSteps = chain.steps.filter((s) => s.status === 'EXECUTING').length;

    if (pendingSteps + executingSteps + chain.completedSteps !== chain.totalSteps) {
      warnings.push('STEP_STATUS_MISMATCH: step status counts do not match total');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  validateStep(step: CompensationStep): RollbackValidationResult {
    const errors: string[] = [];

    if (step.stepIndex < 0) {
      errors.push('NEGATIVE_STEP_INDEX');
    }
    if (!step.originalAction) {
      errors.push('MISSING_ORIGINAL_ACTION');
    }
    if (!step.compensatingAction) {
      errors.push('MISSING_COMPENSATING_ACTION');
    }

    return { valid: errors.length === 0, errors, warnings: [] };
  }
}
