import {
  CompensationAction,
  CompensationStepResult,
  SagaCompensator,
  SagaPlan,
} from "./saga-compensation";

export class SagaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SagaError';
  }
}

export class SagaCompensatorImpl implements SagaCompensator {
  planFrom(
    transactionId: string,
    completedSteps: ReadonlyArray<{
      stepIndex: number;
      providerId: string;
      operation: string;
      result: Readonly<Record<string, unknown>>;
    }>,
  ): SagaPlan {
    if (completedSteps.length === 0) {
      throw new SagaError('No completed steps to compensate');
    }

    const sorted = [...completedSteps].sort((a, b) => b.stepIndex - a.stepIndex);

    const actions: CompensationAction[] = sorted.map((step) => ({
      stepIndex: step.stepIndex,
      providerId: step.providerId,
      operation: `${step.operation}-compensation`,
      input: { ...step.result, originalOperation: step.operation },
    }));

    const stepResults: CompensationStepResult[] = actions.map((a) => ({
      stepIndex: a.stepIndex,
      state: 'PLANNED' as const,
      error: null,
      completedAt: null,
    }));

    return {
      transactionId,
      actions,
      stepResults,
      state: 'PLANNED',
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
  }

  execute(
    plan: SagaPlan,
    compensator: (action: CompensationAction) => Promise<'COMPENSATED' | 'COMPENSATION_FAILED'>,
  ): SagaPlan {
    throw new SagaError('Async execution not supported in this version');
  }
}
