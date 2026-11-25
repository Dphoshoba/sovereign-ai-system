import type { CalendarMutationPreview } from './mutation-types';
import type { CalendarMutationGovernanceDecision } from './mutation-governance';
import type { CalendarMutationApprovalPreparation } from './mutation-approval';
import type { CalendarMutationPreviewReceipt } from './mutation-preview-receipt';
import type { CalendarMutationPreviewAuditRecord } from './mutation-preview-audit';

export type CalendarMutationOperation = CalendarMutationPreview['operation'];

export type MutationQueuePreparationStatus =
  | 'ready'
  | 'rejected';

export type CalendarExecutionIntentType = 'preview_only' | 'no_live_execution';

export interface ExecutionIntentMetadata {
  intentType: CalendarExecutionIntentType;
  previewOnly: true;
  executionAllowed: false;
  liveExecutionAuthorized: false;
  operatorApprovalRequired: true;
  queueExecuted: false;
  liveActionPerformed: false;
}

export interface IdempotencyMetadata {
  idempotencyKey: string;
  queueEntryId: string;
}

export interface RetryMetadata {
  retryEligible: boolean;
  retryCount: number;
  maxRetries: number;
  retryPolicy: {
    // deterministic fixed intervals (metadata only)
    delaySeconds: [number, number, number];
  };
}

export interface AuditReferences {
  approvalPreparationId: string;
  receiptId: string;
  auditId: string;
  // for projection / downstream systems
  controls: {
    previewOnly: true;
    executionAllowed: false;
    liveExecutionAuthorized: false;
    queueSubmissionAllowed: false;
    autoApprovalAllowed: false;
    executionAllowedForQueueRunner: false;
  };
}

export interface SchedulingPriorityMetadata {
  priority: 'low' | 'normal' | 'high' | 'critical';
  scheduledTimeIso?: string;
}

export interface ApprovalEvidenceEnvelope {
  approvalPreparation: CalendarMutationApprovalPreparation;
  receipt: CalendarMutationPreviewReceipt;
  audit: CalendarMutationPreviewAuditRecord;
}

export interface MutationQueuePreparation {
  status: MutationQueuePreparationStatus;
  queuePreparationId: string;
  idempotency: IdempotencyMetadata;
  executionIntent: ExecutionIntentMetadata;

  // scheduling and priority are metadata only
  scheduling: SchedulingPriorityMetadata;

  // retry metadata (metadata only)
  retry: RetryMetadata;

  // evidence + receipts
  evidence: ApprovalEvidenceEnvelope;

  // derived receipt references
  auditReferences: AuditReferences;

  // preflight + reasoning
  rejectedReasons?: string[];
  generatedAt: string;
}

const FIXED_DELAY_SECONDS: [number, number, number] = [5, 10, 20];

function stableIso(iso: string): string {
  // Don’t generate timestamps here; just normalize the provided ISO
  return iso;
}

function stableQueueEntryId(previewId: string): string {
  return `cal_queue_entry_${previewId}`;
}

function stableQueuePreparationId(previewId: string): string {
  return `cal_queue_prep_${previewId}`;
}

function stableIdempotencyKey(previewId: string, operation: CalendarMutationOperation): string {
  // deterministic, no randomization
  return `cal_idem_${operation}_${previewId}`;
}

function priorityFromRiskLevel(riskLevel: CalendarMutationPreview['riskLevel']): SchedulingPriorityMetadata['priority'] {
  switch (riskLevel) {
    case 'low':
      return 'low';
    case 'medium':
      return 'normal';
    case 'high':
      return 'high';
    case 'critical':
      return 'critical';
    default:
      return 'normal';
  }
}

export function prepareCalendarMutationQueuePreparation(params: {
  requestId: string;
  workflowId: string;
  preview: CalendarMutationPreview;
  governance: CalendarMutationGovernanceDecision;
  approval: CalendarMutationApprovalPreparation;
  receipt: CalendarMutationPreviewReceipt;
  audit: CalendarMutationPreviewAuditRecord;
  generatedAtIso: string;
}): MutationQueuePreparation {
  const generatedAt = stableIso(params.generatedAtIso);

  // Hard safety: metadata-only; reject all unsafe states.
  const executionIntent: ExecutionIntentMetadata = {
    intentType: 'preview_only',
    previewOnly: true,
    executionAllowed: false,
    liveExecutionAuthorized: false,
    operatorApprovalRequired: true,
    queueExecuted: false,
    liveActionPerformed: false,
  };

  const queueEntryId = stableQueueEntryId(params.preview.previewId);
  const queuePreparationId = stableQueuePreparationId(params.preview.previewId);
  const idempotencyKey = stableIdempotencyKey(params.preview.previewId, params.preview.operation);

  const controls = {
    previewOnly: true as const,
    executionAllowed: false as const,
    liveExecutionAuthorized: false as const,
    queueSubmissionAllowed: false as const,
    autoApprovalAllowed: false as const,
    executionAllowedForQueueRunner: false as const,
  };

  const auditReferences: AuditReferences = {
    approvalPreparationId: params.approval.approvalPreparationId,
    receiptId: params.receipt.receiptId,
    auditId: params.audit.auditId,
    controls,
  };

  const retry: RetryMetadata = {
    retryEligible: false, // queue runner not invoked; still metadata-only
    retryCount: 0,
    maxRetries: 3,
    retryPolicy: {
      delaySeconds: FIXED_DELAY_SECONDS,
    },
  };

  const scheduling: SchedulingPriorityMetadata = {
    priority: priorityFromRiskLevel(params.governance.risk.level),
    scheduledTimeIso: undefined,
  };

  // Decide rejection based on governance/approval/preview prerequisites.
  // Stage 2C required reject conditions:
  // missing approval, rejected/expired approval, needs-changes approval,
  // blocked governance, invalid preview, missing scope, insufficient permission,
  // unsupported operation, duplicate idempotency key.
  // This function assumes the caller already computed governance + approval + receipt + audit.
  // We therefore implement the explicit reject conditions using evidence fields.

  const rejectedReasons: string[] = [];

  // governance blocked
  if (params.governance.blocked) rejectedReasons.push('blocked_governance');

  // approval status / preparation existence
  if (params.approval.approvalStatus !== 'pending_human_review') {
    rejectedReasons.push('approval_not_pending_human_review');
  }

  // previewOnly guard
  if (params.preview.previewOnly !== true) rejectedReasons.push('previewOnly_not_true');

  if (params.preview.executionAllowed !== false) rejectedReasons.push('executionAllowed_not_false');

  if (params.approval.executionAllowed !== false || params.approval.liveExecutionAuthorized !== false) {
    rejectedReasons.push('approval_execution_controls_violated');
  }

  // invalid preview
  const hasInvalidPreviewFlag =
    params.preview.validationErrors.some(e => e.code === 'invalid_preview' || e.code === 'preview_invalid');
  if (hasInvalidPreviewFlag) rejectedReasons.push('invalid_preview');

  // missing scope / permission signals based on preview validation errors
  if (params.approval.missingScopeDetected) rejectedReasons.push('missing_scope');
  if (params.approval.missingPermissionDetected) rejectedReasons.push('insufficient_permission');

  // unsupported operations: only create/update/delete supported at Stage 2C
  if (!['create', 'update', 'delete'].includes(params.preview.operation)) {
    rejectedReasons.push('unsupported_operation');
  }

  // duplicate idempotency key: Stage 2C doesn’t persist; reject if caller indicates duplication.
  // The caller can set governance/preview fields to express duplication; for determinism we treat presence
  // of a special validation error code as duplicate signal.
  if (params.preview.validationErrors.some(e => e.code === 'duplicate_idempotency_key')) {
    rejectedReasons.push('duplicate_idempotency_key');
  }

  const status: MutationQueuePreparationStatus = rejectedReasons.length > 0 ? 'rejected' : 'ready';

  const preparation: MutationQueuePreparation = {
    status,
    queuePreparationId,
    idempotency: {
      idempotencyKey,
      queueEntryId,
    },
    executionIntent,
    scheduling,
    retry,
    evidence: {
      approvalPreparation: params.approval,
      receipt: params.receipt,
      audit: params.audit,
    },
    auditReferences,
    generatedAt,
    ...(rejectedReasons.length > 0 ? { rejectedReasons } : {}),
  };

  return preparation;
}
