import {
  CrossProviderTransaction,
  TransactionCoordinator,
  TransactionState,
  TransactionStepDescriptor,
  TransactionStepResult,
} from "./cross-provider-transaction";

let nextTransactionId = 0;

export class TransactionCoordinatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransactionCoordinatorError';
  }
}

export class TransactionCoordinatorImpl implements TransactionCoordinator {
  private readonly transactions = new Map<string, CrossProviderTransaction>();

  create(steps: TransactionStepDescriptor[]): CrossProviderTransaction {
    if (steps.length === 0) {
      throw new TransactionCoordinatorError('Transaction must have at least one step');
    }

    const ids = new Set(steps.map((s) => s.stepIndex));
    if (ids.size !== steps.length) {
      throw new TransactionCoordinatorError('Duplicate step indices');
    }

    nextTransactionId++;
    const transactionId = `tx-${nextTransactionId}`;

    const stepResults: TransactionStepResult[] = steps.map((s) => ({
      stepIndex: s.stepIndex,
      state: 'PENDING' as const,
      result: null,
      error: null,
      completedAt: null,
    }));

    const transaction: CrossProviderTransaction = {
      transactionId,
      correlationId: `corr-${transactionId}`,
      state: 'PENDING',
      steps: [...steps],
      stepResults,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    this.transactions.set(transactionId, transaction);
    return transaction;
  }

  start(transactionId: string): CrossProviderTransaction {
    const tx = this.getOrThrow(transactionId);
    if (tx.state !== 'PENDING') {
      throw new TransactionCoordinatorError(
        `Cannot start transaction '${transactionId}': state is ${tx.state}`,
      );
    }
    return this.update(transactionId, { state: 'ACTIVE' });
  }

  completeStep(
    transactionId: string,
    stepIndex: number,
    result: Record<string, unknown>,
  ): CrossProviderTransaction {
    const tx = this.getOrThrow(transactionId);

    const step = tx.steps.find((s) => s.stepIndex === stepIndex);
    if (!step) {
      throw new TransactionCoordinatorError(
        `Step index ${stepIndex} not found in transaction '${transactionId}'`,
      );
    }

    if (step.dependsOn.length > 0) {
      for (const dep of step.dependsOn) {
        const depResult = tx.stepResults.find((r) => r.stepIndex === dep);
        if (!depResult || depResult.state !== 'COMPLETED') {
          throw new TransactionCoordinatorError(
            `Step ${stepIndex} depends on step ${dep} which has not completed`,
          );
        }
      }
    }

    const updatedResults = tx.stepResults.map((r) =>
      r.stepIndex === stepIndex
        ? { ...r, state: 'COMPLETED' as const, result, completedAt: new Date().toISOString() }
        : r,
    );

    const allDone = updatedResults.every((r) => r.state === 'COMPLETED' || r.state === 'FAILED');
    const anyFailed = updatedResults.some((r) => r.state === 'FAILED');
    const allCompleted = updatedResults.every((r) => r.state === 'COMPLETED');

    let newState: TransactionState;
    if (allCompleted) {
      newState = 'COMMITTED';
    } else if (anyFailed) {
      newState = 'PARTIAL';
    } else if (allDone) {
      newState = 'COMMITTED';
    } else {
      newState = 'ACTIVE';
    }

    return this.update(transactionId, {
      stepResults: updatedResults,
      state: newState,
      completedAt: newState === 'COMMITTED' || newState === 'PARTIAL' || newState === 'ABORTED'
        ? new Date().toISOString() : null,
    });
  }

  failStep(
    transactionId: string,
    stepIndex: number,
    error: string,
  ): CrossProviderTransaction {
    const tx = this.getOrThrow(transactionId);

    if (!tx.steps.some((s) => s.stepIndex === stepIndex)) {
      throw new TransactionCoordinatorError(
        `Step index ${stepIndex} not found in transaction '${transactionId}'`,
      );
    }

    const updatedResults = tx.stepResults.map((r) =>
      r.stepIndex === stepIndex
        ? {
            ...r,
            state: 'FAILED' as const,
            error,
            completedAt: new Date().toISOString(),
          }
        : r,
    );

    const anyCompleted = updatedResults.some((r) => r.state === 'COMPLETED');
    const newState: TransactionState = anyCompleted ? 'PARTIAL' : 'ABORTED';

    return this.update(transactionId, {
      stepResults: updatedResults,
      state: newState,
      completedAt: new Date().toISOString(),
    });
  }

  getState(transactionId: string): TransactionState | undefined {
    return this.transactions.get(transactionId)?.state;
  }

  getTransaction(transactionId: string): CrossProviderTransaction | undefined {
    return this.transactions.get(transactionId);
  }

  private getOrThrow(transactionId: string): CrossProviderTransaction {
    const tx = this.transactions.get(transactionId);
    if (!tx) {
      throw new TransactionCoordinatorError(
        `Transaction '${transactionId}' not found`,
      );
    }
    return tx;
  }

  private update(
    transactionId: string,
    patch: Partial<CrossProviderTransaction>,
  ): CrossProviderTransaction {
    const existing = this.transactions.get(transactionId)!;
    const updated: CrossProviderTransaction = {
      ...existing,
      ...patch,
      steps: patch.steps ?? existing.steps,
      stepResults: patch.stepResults ?? existing.stepResults,
    };
    this.transactions.set(transactionId, updated);
    return updated;
  }
}
