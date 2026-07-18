import { ReconciliationProvider, ReconciliationRequest, ReconciliationResult, ReconciliationOutcome, AmbiguityReason } from '../provider-contracts/reconciliation-provider';
import { ProviderMutationResult, ProviderVerificationResult } from '../connector-execution-adapter';

export interface ReconciliationEngineConfig {
  escalationAfterMs: number;
  maxReconciliationAttempts: number;
}

export const DEFAULT_RECONCILIATION_CONFIG: ReconciliationEngineConfig = {
  escalationAfterMs: 30000,
  maxReconciliationAttempts: 3,
};

export class ReconciliationEngine {
  private config: ReconciliationEngineConfig;

  constructor(config: Partial<ReconciliationEngineConfig> = {}) {
    this.config = { ...DEFAULT_RECONCILIATION_CONFIG, ...config };
  }

  async reconcileMutation(
    executionId: string,
    operation: string,
    mutationResult: ProviderMutationResult,
    verificationResult: ProviderVerificationResult,
    provider: ReconciliationProvider | null,
  ): Promise<ReconciliationResult> {
    if (!verificationResult.verified) {
      return this.reconcileAmbiguousOutcome(executionId, operation, mutationResult, verificationResult, provider);
    }

    if (verificationResult.drift.length > 0) {
      return this.reconcileDrift(executionId, operation, mutationResult, verificationResult, provider);
    }

    return {
      outcome: 'MUTATION_APPLIED',
      resolvedAt: '2026-01-01T00:00:00Z',
      verifiedState: verificationResult.providerState,
      appliedMutationId: mutationResult.mutationId,
      durationMs: 0,
      details: ['Reconciliation: mutation verified, no drift detected'],
    };
  }

  async reconcileByReadBack(
    executionId: string,
    operation: string,
    mutationResult: ProviderMutationResult,
    readBackState: Record<string, unknown>,
  ): Promise<ReconciliationResult> {
    const mutationBody = (mutationResult.providerState as Record<string, unknown>).body as Record<string, unknown> ?? {};
    const readBackBody = readBackState.body as Record<string, unknown> ?? {};
    const details: string[] = [];
    let outcome: ReconciliationOutcome = 'MUTATION_APPLIED';

    if (!readBackBody.id) {
      outcome = 'MUTATION_NOT_APPLIED';
      details.push('Read-back returned no event, mutation may not have been applied');
    } else if (readBackBody.id !== mutationBody.id) {
      outcome = 'RECONCILIATION_FAILED';
      details.push(`ID mismatch: expected ${mutationBody.id}, got ${readBackBody.id}`);
    } else if (readBackBody.status === 'cancelled' && operation !== 'events.delete') {
      outcome = 'RECONCILIATION_FAILED';
      details.push('Event cancelled after mutation, unexpected state');
    } else {
      details.push(`Mutation confirmed via read-back: id=${readBackBody.id} status=${readBackBody.status}`);
    }

    return {
      outcome,
      resolvedAt: '2026-01-01T00:00:00Z',
      verifiedState: readBackState,
      appliedMutationId: outcome === 'MUTATION_APPLIED' ? mutationResult.mutationId : null,
      durationMs: 0,
      details,
    };
  }

  private async reconcileAmbiguousOutcome(
    executionId: string,
    operation: string,
    mutationResult: ProviderMutationResult,
    verificationResult: ProviderVerificationResult,
    provider: ReconciliationProvider | null,
  ): Promise<ReconciliationResult> {
    if (provider && provider.supportsReconciliation(operation)) {
      const request: ReconciliationRequest = {
        reconciliationId: `rec-${executionId}`,
        executionId,
        operation,
        ambiguityReason: 'STATE_MISMATCH',
        sentRequest: { operation },
        receivedResponse: mutationResult.providerState as Record<string, unknown>,
        priorState: {},
      };
      return provider.reconcile(request);
    }

    return {
      outcome: 'RECONCILIATION_FAILED',
      resolvedAt: '2026-01-01T00:00:00Z',
      verifiedState: verificationResult.providerState,
      appliedMutationId: null,
      durationMs: 0,
      details: [
        'Ambiguous outcome: verification failed, no reconciliation provider available',
        ...verificationResult.drift.map(d => `Drift: ${d}`),
      ],
    };
  }

  private async reconcileDrift(
    executionId: string,
    operation: string,
    mutationResult: ProviderMutationResult,
    verificationResult: ProviderVerificationResult,
    provider: ReconciliationProvider | null,
  ): Promise<ReconciliationResult> {
    if (provider && provider.supportsReconciliation(operation)) {
      const request: ReconciliationRequest = {
        reconciliationId: `rec-drift-${executionId}`,
        executionId,
        operation,
        ambiguityReason: 'STATE_MISMATCH',
        sentRequest: { operation },
        receivedResponse: mutationResult.providerState as Record<string, unknown>,
        priorState: {},
      };
      return provider.reconcile(request);
    }

    return {
      outcome: 'RECONCILIATION_FAILED',
      resolvedAt: '2026-01-01T00:00:00Z',
      verifiedState: verificationResult.providerState,
      appliedMutationId: null,
      durationMs: 0,
      details: [
        'Drift detected: no reconciliation provider available',
        ...verificationResult.drift.map(d => `Drift: ${d}`),
      ],
    };
  }
}
