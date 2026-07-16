import type { CalendarMutationPreview } from './mutation-types';
import type { CalendarMutationGovernanceDecision } from './mutation-governance';

export interface CalendarMutationApprovalPreparation {
  approvalPreparationId: string;
  previewId: string;
  operation: CalendarMutationPreview['operation'];
  riskLevel: CalendarMutationPreview['riskLevel'];
  riskScore: number;
  requiresApproval: true;
  requiresHumanReview: true;
  requiresAudit: true;
  governanceAllowed: boolean;
  governanceBlocked: boolean;
  requiredScopes: string[];
  missingScopeDetected: boolean;
  missingPermissionDetected: boolean;
  policyViolationCount: number;
  warningCount: number;
  approvalStatus: 'pending_human_review' | 'blocked';
  reasonSummary: string[];
  previewOnly: true;
  executionAllowed: false;
  liveExecutionAuthorized: false;
  generatedAt: string;
}

function deterministicApprovalPreparationId(previewId: string): string {
  return `approval-prep-${previewId}`;
}

export function prepareCalendarMutationApproval(
  preview: CalendarMutationPreview,
  governance: CalendarMutationGovernanceDecision,
  generatedAtIso: string
): CalendarMutationApprovalPreparation {
  const missingScopeDetected = preview.validationErrors.some(e =>
    e.code.toLowerCase().includes('scope')
  );
  const missingPermissionDetected = preview.validationErrors.some(e =>
    e.code.toLowerCase().includes('permission')
  );

  return {
    approvalPreparationId: deterministicApprovalPreparationId(preview.previewId),
    previewId: preview.previewId,
    operation: preview.operation,
    riskLevel: governance.risk.level,
    riskScore: governance.risk.score,
    requiresApproval: true,
    requiresHumanReview: true,
    requiresAudit: true,
    governanceAllowed: governance.allowed,
    governanceBlocked: governance.blocked,
    requiredScopes: [...preview.requiredScopes],
    missingScopeDetected,
    missingPermissionDetected,
    policyViolationCount: governance.reasons.length,
    warningCount: governance.warnings.length,
    approvalStatus: governance.allowed ? 'pending_human_review' : 'blocked',
    reasonSummary: governance.allowed
      ? ['Approval preparation ready; explicit human decision required.']
      : governance.reasons,
    previewOnly: true,
    executionAllowed: false,
    liveExecutionAuthorized: false,
    generatedAt: generatedAtIso,
  };
}
