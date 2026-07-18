export type RollbackState =
  | 'FULLY_COMPENSATED'
  | 'PARTIALLY_COMPENSATED'
  | 'ROLLBACK_FAILED';

export interface RollbackResult {
  readonly transactionId: string;
  readonly state: RollbackState;
  readonly compensatedSteps: readonly number[];
  readonly failedCompensations: readonly number[];
  readonly completedAt: string;
}

export interface CompensatorFn {
  (providerId: string, operation: string, input: Record<string, unknown>): 'COMPENSATED' | 'COMPENSATION_FAILED';
}

export interface CrossProviderRollback {
  rollback(
    transactionId: string,
    completedSteps: ReadonlyArray<{
      stepIndex: number;
      providerId: string;
      operation: string;
      result: Readonly<Record<string, unknown>>;
    }>,
    compensator: CompensatorFn,
  ): RollbackResult;
}
