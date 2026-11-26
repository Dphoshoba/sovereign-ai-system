import type { CalendarMutationPreview } from './mutation-types';
import type { CalendarMutationGovernanceDecision } from './mutation-governance';
import type { CalendarMutationApprovalPreparation } from './mutation-approval';

export interface CalendarMutationPreviewReceipt {
  receiptId: string;
  previewId: string;
  operation: CalendarMutationPreview['operation'];
  riskLevel: CalendarMutationPreview['riskLevel'];
  riskScore: number;
  governanceAllowed: boolean;
  governanceBlocked: boolean;
  approvalPreparationId: string;
  requiredScopes: string[];
  previewOnly: true;
  executionAllowed: false;
  liveExecutionAuthorized: false;
  generatedAt: string;
}

export function buildMutationPreviewReceipt(
  preview: CalendarMutationPreview,
  governance: CalendarMutationGovernanceDecision,
  approval: CalendarMutationApprovalPreparation,
  generatedAtIso: string
): CalendarMutationPreviewReceipt {
  return {
    receiptId: `preview-receipt-${preview.previewId}`,
    previewId: preview.previewId,
    operation: preview.operation,
    riskLevel: governance.risk.level,
    riskScore: governance.risk.score,
    governanceAllowed: governance.allowed,
    governanceBlocked: governance.blocked,
    approvalPreparationId: approval.approvalPreparationId,
    requiredScopes: [...preview.requiredScopes],
    previewOnly: true,
    executionAllowed: false,
    liveExecutionAuthorized: false,
    generatedAt: generatedAtIso,
  };
}
