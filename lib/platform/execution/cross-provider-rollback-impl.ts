import {
  CompensatorFn,
  CrossProviderRollback,
  RollbackResult,
} from "./cross-provider-rollback";

export class RollbackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RollbackError';
  }
}

export class CrossProviderRollbackImpl implements CrossProviderRollback {
  rollback(
    transactionId: string,
    completedSteps: ReadonlyArray<{
      stepIndex: number;
      providerId: string;
      operation: string;
      result: Readonly<Record<string, unknown>>;
    }>,
    compensator: CompensatorFn,
  ): RollbackResult {
    if (completedSteps.length === 0) {
      throw new RollbackError('No completed steps to roll back');
    }

    const sorted = [...completedSteps].sort((a, b) => b.stepIndex - a.stepIndex);

    const compensatedSteps: number[] = [];
    const failedCompensations: number[] = [];

    for (const step of sorted) {
      const compensationOp = `${step.operation}-compensation`;
      const compensationInput = {
        ...step.result,
        originalOperation: step.operation,
      };

      const result = compensator(step.providerId, compensationOp, compensationInput);

      if (result === 'COMPENSATED') {
        compensatedSteps.push(step.stepIndex);
      } else {
        failedCompensations.push(step.stepIndex);
      }
    }

    let state: RollbackResult['state'];
    if (failedCompensations.length === 0) {
      state = 'FULLY_COMPENSATED';
    } else if (compensatedSteps.length > 0) {
      state = 'PARTIALLY_COMPENSATED';
    } else {
      state = 'ROLLBACK_FAILED';
    }

    return {
      transactionId,
      state,
      compensatedSteps,
      failedCompensations,
      completedAt: new Date().toISOString(),
    };
  }
}
