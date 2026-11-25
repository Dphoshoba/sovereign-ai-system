export type CompensationState = 'PLANNED' | 'COMPENSATED' | 'COMPENSATION_FAILED';

export type SagaState = 'PLANNED' | 'EXECUTING' | 'COMPLETED' | 'FAILED';

export interface CompensationAction {
  readonly stepIndex: number;
  readonly providerId: string;
  readonly operation: string;
  readonly input: Readonly<Record<string, unknown>>;
}

export interface CompensationStepResult {
  readonly stepIndex: number;
  readonly state: CompensationState;
  readonly error: string | null;
  readonly completedAt: string | null;
}

export interface SagaPlan {
  readonly transactionId: string;
  readonly actions: readonly CompensationAction[];
  readonly stepResults: readonly CompensationStepResult[];
  readonly state: SagaState;
  readonly createdAt: string;
  readonly completedAt: string | null;
}

export interface SagaCompensator {
  planFrom(
    transactionId: string,
    completedSteps: ReadonlyArray<{
      stepIndex: number;
      providerId: string;
      operation: string;
      result: Readonly<Record<string, unknown>>;
    }>,
  ): SagaPlan;
  execute(
    plan: SagaPlan,
    compensator: (action: CompensationAction) => Promise<'COMPENSATED' | 'COMPENSATION_FAILED'>,
  ): SagaPlan;
}
