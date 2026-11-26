import type { CalendarMutationPreview } from './mutation-types';
import type { CalendarMutationGovernanceDecision } from './mutation-governance';
import type { CalendarMutationApprovalPreparation } from './mutation-approval';
import type { CalendarMutationPreviewReceipt } from './mutation-preview-receipt';

export interface CalendarMutationPreviewAuditRecord {
  auditId: string;
  previewId: string;
  operation: CalendarMutationPreview['operation'];
  recurringScope: CalendarMutationPreview['recurringScope'];
  governance: {
    allowed: boolean;
    blocked: boolean;
    reasonCount: number;
    warningCount: number;
    policyIds: string[];
  };
  approval: {
    status: CalendarMutationApprovalPreparation['approvalStatus'];
    preparationId: string;
    requiresHumanReview: true;
    requiresApproval: true;
    requiresAudit: true;
  };
  receiptId: string;
  risk: {
    score: number;
    level: CalendarMutationPreview['riskLevel'];
    factorCodes: string[];
  };
  controls: {
    previewOnly: true;
    executionAllowed: false;
    liveExecutionAuthorized: false;
    queueSubmissionAllowed: false;
    autoApprovalAllowed: false;
  };
  generatedAt: string;
}

export function buildCalendarMutationPreviewAuditRecord(
  preview: CalendarMutationPreview,
  governance: CalendarMutationGovernanceDecision,
  approval: CalendarMutationApprovalPreparation,
  receipt: CalendarMutationPreviewReceipt,
  generatedAtIso: string
): CalendarMutationPreviewAuditRecord {
  return {
    auditId: `preview-audit-${preview.previewId}`,
    previewId: preview.previewId,
    operation: preview.operation,
    recurringScope: preview.recurringScope,
    governance: {
      allowed: governance.allowed,
      blocked: governance.blocked,
      reasonCount: governance.reasons.length,
      warningCount: governance.warnings.length,
      policyIds: governance.policyResults.map(p => p.policyId),
    },
    approval: {
      status: approval.approvalStatus,
      preparationId: approval.approvalPreparationId,
      requiresHumanReview: true,
      requiresApproval: true,
      requiresAudit: true,
    },
    receiptId: receipt.receiptId,
    risk: {
      score: governance.risk.score,
      level: governance.risk.level,
      factorCodes: governance.risk.factors.map(f => f.code),
    },
    controls: {
      previewOnly: true,
      executionAllowed: false,
      liveExecutionAuthorized: false,
      queueSubmissionAllowed: false,
      autoApprovalAllowed: false,
    },
    generatedAt: generatedAtIso,
  };
}
