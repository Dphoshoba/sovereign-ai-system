export type ReconciliationOutcome = 'MUTATION_APPLIED' | 'MUTATION_NOT_APPLIED' | 'RECONCILIATION_FAILED' | 'RECONCILIATION_ESCALATED';

export type AmbiguityReason = 'TIMEOUT_NO_RESPONSE' | 'SUCCESS_WITH_ERROR' | 'DUPLICATE_DETECTED' | 'STATE_MISMATCH';

export interface ReconciliationRequest {
  reconciliationId: string;
  executionId: string;
  operation: string;
  ambiguityReason: AmbiguityReason;
  sentRequest: Record<string, unknown>;
  receivedResponse: Record<string, unknown> | null;
  priorState: Record<string, unknown>;
}

export interface ReconciliationResult {
  outcome: ReconciliationOutcome;
  resolvedAt: string;
  verifiedState: Record<string, unknown>;
  appliedMutationId: string | null;
  durationMs: number;
  details: string[];
}

export interface ReconciliationProvider {
  reconcile(request: ReconciliationRequest): Promise<ReconciliationResult>;

  supportsReconciliation(operation: string): boolean;
}
