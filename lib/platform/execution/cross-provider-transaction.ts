export type TransactionState =
  | 'PENDING'
  | 'ACTIVE'
  | 'COMMITTED'
  | 'ABORTED'
  | 'PARTIAL';

export interface TransactionStepDescriptor {
  readonly stepIndex: number;
  readonly providerId: string;
  readonly operation: string;
  readonly input: Readonly<Record<string, unknown>>;
  readonly dependsOn: readonly number[];
}

export interface TransactionStepResult {
  readonly stepIndex: number;
  readonly state: 'PENDING' | 'COMPLETED' | 'FAILED';
  readonly result: Readonly<Record<string, unknown>> | null;
  readonly error: string | null;
  readonly completedAt: string | null;
}

export interface CrossProviderTransaction {
  readonly transactionId: string;
  readonly correlationId: string;
  readonly state: TransactionState;
  readonly steps: readonly TransactionStepDescriptor[];
  readonly stepResults: readonly TransactionStepResult[];
  readonly createdAt: string;
  readonly completedAt: string | null;
}

export interface TransactionCoordinator {
  create(
    steps: TransactionStepDescriptor[],
  ): CrossProviderTransaction;
  start(transactionId: string): CrossProviderTransaction;
  completeStep(
    transactionId: string,
    stepIndex: number,
    result: Record<string, unknown>,
  ): CrossProviderTransaction;
  failStep(
    transactionId: string,
    stepIndex: number,
    error: string,
  ): CrossProviderTransaction;
  getState(transactionId: string): TransactionState | undefined;
  getTransaction(transactionId: string): CrossProviderTransaction | undefined;
}
