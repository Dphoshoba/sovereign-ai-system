import { ProviderMutationResult, ProviderVerificationResult, ProviderRollbackResult } from '../../connector-execution-adapter';
import { RollbackPlan } from '../../rollback-contract';
import { ApprovalVerdict } from '../../approval-contract';

export type SandboxExecutionOutcome =
  | 'SANDBOX_COMPLETED'
  | 'SANDBOX_FAILED'
  | 'SANDBOX_ABORTED'
  | 'SANDBOX_ROLLED_BACK';

export type SandboxPhase =
  | 'ISOLATION_CHECK'
  | 'CREDENTIAL_CHECK'
  | 'APPROVAL_GATE'
  | 'IDEMPOTENCY'
  | 'ROLLBACK_PLANNING'
  | 'AUDIT_PRE'
  | 'EXECUTION'
  | 'VERIFICATION'
  | 'RECONCILIATION'
  | 'ROLLBACK_EXECUTION'
  | 'AUDIT_POST'
  | 'COMPLETED';

export interface SandboxPhaseResult {
  phase: SandboxPhase;
  passed: boolean;
  durationMs: number;
  details: Record<string, unknown>;
}

export interface SandboxExecutionReport {
  executionId: string;
  operation: string;
  outcome: SandboxExecutionOutcome;
  phases: SandboxPhaseResult[];
  mutationResult: ProviderMutationResult | null;
  verificationResult: ProviderVerificationResult | null;
  rollbackResult: ProviderRollbackResult | null;
  approvalVerdict: ApprovalVerdict | null;
  rollbackPlan: RollbackPlan | null;
  auditEvents: string[];
  transportInvoked: boolean;
  violations: string[];
  generatedAt: string;
}
