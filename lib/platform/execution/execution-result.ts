import { RuntimeResult } from "./runtime-result";
import { ExecutionFailureCode } from "./failure-classifier";

export type ExecutionOutcome =
  | 'EXECUTION_SUCCEEDED'
  | 'EXECUTION_FAILED'
  | 'VERIFICATION_FAILED'
  | 'ROLLBACK_SUCCEEDED'
  | 'ROLLBACK_FAILED'
  | 'APPROVAL_DENIED';

export interface ExecutionResult extends RuntimeResult {
  executionOutcome: ExecutionOutcome;
  adapterId: string;
  mutationId: string | null;
  providerState: Record<string, unknown> | null;
  executionDurationMs: number;
  mutationAttempted: boolean;
  rollbackAttempted: boolean;
  rollbackSuccessful: boolean;
}
