import { RollbackPlan } from '../rollback-contract';
import { ApprovalVerdict } from '../approval-contract';

export type DryRunOutcome = 'DRY_RUN_PASSED' | 'DRY_RUN_FAILED' | 'DRY_RUN_INCOMPLETE';

export type DryRunPhase =
  | 'PLANNING'
  | 'IDEMPOTENCY'
  | 'APPROVAL'
  | 'ROLLBACK_PLANNING'
  | 'VERIFICATION_PLANNING'
  | 'AUDIT'
  | 'REPORTING'
  | 'COMPLETED';

export interface MutationPlan {
  operation: string;
  requestBody: Record<string, unknown> | null;
  expectedStatusCode: number;
  parameters: Record<string, string>;
  idempotencyKey: string;
}

export interface VerificationPlan {
  operation: string;
  readBackOperation: string;
  verificationFields: string[];
  expectedDrift: string[];
  maxVerificationDurationMs: number;
}

export interface DryRunPhaseResult {
  phase: DryRunPhase;
  passed: boolean;
  durationMs: number;
  artifacts: Record<string, unknown>;
}

export interface DryRunArtifacts {
  mutationPlan: MutationPlan;
  idempotencyKey: string;
  approvalVerdict: ApprovalVerdict | null;
  rollbackPlan: RollbackPlan | null;
  verificationPlan: VerificationPlan;
  auditEvents: string[];
  phaseResults: DryRunPhaseResult[];
}

export interface DryRunReport {
  executionId: string;
  operation: string;
  outcome: DryRunOutcome;
  artifacts: DryRunArtifacts;
  executionHash: string;
  transportInvoked: boolean;
  phasesCompleted: string[];
  generatedAt: string;
  warnings: string[];
}
