export type VerificationOutcome = 'VERIFIED' | 'DRIFT_DETECTED' | 'VERIFICATION_FAILED' | 'VERIFICATION_SKIPPED';

export interface VerificationRequest {
  verificationId: string;
  executionId: string;
  operation: string;
  expectedState: Record<string, unknown>;
  actualProviderState: Record<string, unknown> | null;
  mutationResult: Record<string, unknown>;
}

export interface VerificationResult {
  outcome: VerificationOutcome;
  verifiedAt: string;
  drift: string[];
  actualState: Record<string, unknown>;
  durationMs: number;
}

export interface VerificationProvider {
  verify(request: VerificationRequest): Promise<VerificationResult>;

  isVerificationSupported(operation: string): boolean;
}
