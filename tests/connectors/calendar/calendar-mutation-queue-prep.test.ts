import { describe, it, expect } from 'vitest';
import { evaluateCalendarMutationGovernance } from '../../../lib/connectors/calendar/mutation-governance';
import { prepareCalendarMutationApproval } from '../../../lib/connectors/calendar/mutation-approval';
import { buildMutationPreviewReceipt } from '../../../lib/connectors/calendar/mutation-preview-receipt';
import { buildCalendarMutationPreviewAuditRecord } from '../../../lib/connectors/calendar/mutation-preview-audit';
import { prepareCalendarMutationQueuePreparation } from '../../../lib/connectors/calendar/mutation-queue-prep';
import type { CalendarMutationPreview } from '../../../lib/connectors/calendar/mutation-types';
import type { CalendarMutationGovernanceDecision } from '../../../lib/connectors/calendar/mutation-governance';

const GENERATED_AT = '2026-07-20T00:00:00.000Z';

function basePreview(overrides: Partial<CalendarMutationPreview> = {}): CalendarMutationPreview {
  return {
    previewId: 'p-queue-1',
    operation: 'update',
    calendarId: 'primary',
    eventId: 'evt-1',
    beforeState: null,
    proposedState: null,
    normalizedTimezone: 'UTC',
    attendees: [{ email: 'member@example.com' }],
    recurringScope: 'single',
    detectedConflicts: [],
    validationErrors: [],
    warnings: [],
    riskScore: 10,
    riskLevel: 'low',
    requiredApproval: true,
    requiredScopes: ['https://www.googleapis.com/auth/calendar.events'],
    estimatedApiOperation: 'events.patch',
    changeSummary: {
      changedFields: ['summary'],
      attendeeAdded: [],
      attendeeRemoved: [],
      timeMoved: false,
      timezoneChanged: false,
      recurrenceChanged: false,
      impactNotes: [],
    },
    auditMetadata: {
      connectorId: 'calendar',
      stage: 'stage2a-preview',
      generatedAt: GENERATED_AT,
      deterministicSeed: 'seed',
    },
    previewOnly: true,
    executionAllowed: false,
    ...overrides,
  };
}

const orgAllow = {
  organizationId: 'org-queue',
  tenantId: 'tenant-queue',
  environment: 'dev' as const,
  policyVersion: 'v1',
  allowedModes: ['preview', 'live'],
  deniedConnectors: [],
  deniedCapabilities: [],
};

function buildEvidence(preview: CalendarMutationPreview, governanceAt?: any) {
  const governance = governanceAt ?? evaluateCalendarMutationGovernance({
    requestId: 'req-q',
    workflowId: 'wf-q',
    organization: orgAllow,
    preview,
  });

  const approval = prepareCalendarMutationApproval(preview, governance, GENERATED_AT);
  const receipt = buildMutationPreviewReceipt(preview, governance, approval, GENERATED_AT);
  const audit = buildCalendarMutationPreviewAuditRecord(preview, governance, approval, receipt, GENERATED_AT);

  return { governance, approval, receipt, audit };
}

describe('calendar stage2c deterministic mutation queue preparation (metadata only)', () => {
  it('prepares ready queue metadata for valid update', () => {
    const preview = basePreview({ previewId: 'p-queue-1', operation: 'update', estimatedApiOperation: 'events.patch' });
    const { governance, approval, receipt, audit } = buildEvidence(preview);

    const prep = prepareCalendarMutationQueuePreparation({
      requestId: 'req-q',
      workflowId: 'wf-q',
      preview,
      governance,
      approval,
      receipt,
      audit,
      generatedAtIso: GENERATED_AT,
    });

    expect(prep.status).toBe('ready');
    expect(prep.executionIntent.previewOnly).toBe(true);
    expect(prep.executionIntent.executionAllowed).toBe(false);
    expect(prep.executionIntent.liveExecutionAuthorized).toBe(false);
    expect(prep.executionIntent.queueExecuted).toBe(false);
    expect(prep.executionIntent.liveActionPerformed).toBe(false);
    expect(prep.auditReferences.controls.queueSubmissionAllowed).toBe(false);
  });

  it('create/update/delete intents are supported (metadata)', () => {
    const ops: Array<{ op: 'create' | 'update' | 'delete'; apiOp: 'events.insert' | 'events.update' | 'events.patch' | 'events.delete' }> = [
      { op: 'create', apiOp: 'events.insert' },
      { op: 'update', apiOp: 'events.patch' },
      { op: 'delete', apiOp: 'events.delete' },
    ];

    for (const { op, apiOp } of ops) {
      const preview = basePreview({ operation: op, estimatedApiOperation: apiOp, previewId: `p-${op}` });
      const { governance, approval, receipt, audit } = buildEvidence(preview);
      const prep = prepareCalendarMutationQueuePreparation({
        requestId: 'req-q',
        workflowId: 'wf-q',
        preview,
        governance,
        approval,
        receipt,
        audit,
        generatedAtIso: GENERATED_AT,
      });
      expect(prep.status).toBe('ready');
      expect(prep.evidence.receipt.operation).toBe(op);
      expect(prep.auditReferences.receiptId).toContain(preview.previewId);
    }
  });

  it('deterministic queueEntryId and idempotency key', () => {
    const preview = basePreview({ previewId: 'p-deterministic', operation: 'update' });
    const { governance, approval, receipt, audit } = buildEvidence(preview);

    const first = prepareCalendarMutationQueuePreparation({
      requestId: 'req-q1',
      workflowId: 'wf-q1',
      preview,
      governance,
      approval,
      receipt,
      audit,
      generatedAtIso: GENERATED_AT,
    });

    const second = prepareCalendarMutationQueuePreparation({
      requestId: 'req-q2',
      workflowId: 'wf-q2',
      preview,
      governance,
      approval,
      receipt,
      audit,
      generatedAtIso: GENERATED_AT,
    });

    expect(first.idempotency.queueEntryId).toBe(second.idempotency.queueEntryId);
    expect(first.idempotency.idempotencyKey).toBe(second.idempotency.idempotencyKey);
    expect(first.queuePreparationId).toBe(second.queuePreparationId);
  });

  it('priority mapping derives from governance risk level', () => {
    const preview = basePreview({ previewId: 'p-priority', operation: 'delete', estimatedApiOperation: 'events.delete', recurringScope: 'series' });
    const { governance, approval, receipt, audit } = buildEvidence(preview);
    const prep = prepareCalendarMutationQueuePreparation({
      requestId: 'req-q',
      workflowId: 'wf-q',
      preview,
      governance,
      approval,
      receipt,
      audit,
      generatedAtIso: GENERATED_AT,
    });

    expect(prep.status).toBe('ready');
    expect(prep.scheduling.priority).toBeDefined();
  });

  it('rejects when governance is blocked', () => {
    const preview = basePreview({ previewId: 'p-blocked', validationErrors: [], requiredScopes: ['https://missing-scope'] });
    const { governance, approval, receipt, audit } = buildEvidence(
      { ...preview, validationErrors: [{ code: 'missing_scope', message: 'scope missing' }] } as any
    );

    const prep = prepareCalendarMutationQueuePreparation({
      requestId: 'req-q',
      workflowId: 'wf-q',
      preview: { ...preview, validationErrors: [{ code: 'missing_scope', message: 'scope missing' }] } as any,
      governance,
      approval,
      receipt,
      audit,
      generatedAtIso: GENERATED_AT,
    });

    expect(prep.status).toBe('rejected');
    expect(prep.rejectedReasons).toContain('blocked_governance');
  });

  it('rejects when preview marks duplicate idempotency key', () => {
    const preview = basePreview({
      previewId: 'p-dup',
      validationErrors: [{ code: 'duplicate_idempotency_key', message: 'dup' }],
    });
    const { governance, approval, receipt, audit } = buildEvidence(preview);

    const prep = prepareCalendarMutationQueuePreparation({
      requestId: 'req-q',
      workflowId: 'wf-q',
      preview,
      governance,
      approval,
      receipt,
      audit,
      generatedAtIso: GENERATED_AT,
    });

    expect(prep.status).toBe('rejected');
    expect(prep.rejectedReasons).toContain('duplicate_idempotency_key');
  });

  it('rejects missing scope / insufficient permission based on approval preparation flags', () => {
    const preview = basePreview({
      previewId: 'p-scopeperm',
      validationErrors: [{ code: 'missing_scope', message: 'scope missing' }, { code: 'permission_denied', message: 'denied' }] as any,
    });
    const { governance, approval, receipt, audit } = buildEvidence(preview);

    const prep = prepareCalendarMutationQueuePreparation({
      requestId: 'req-q',
      workflowId: 'wf-q',
      preview,
      governance,
      approval,
      receipt,
      audit,
      generatedAtIso: GENERATED_AT,
    });

    expect(prep.status).toBe('rejected');
    expect(prep.rejectedReasons).toContain('missing_scope');
    expect(prep.rejectedReasons).toContain('insufficient_permission');
  });

  it('never mutates input preview', () => {
    const preview = basePreview({ previewId: 'p-no-mutate', attendees: [{ email: 'member@example.com' }] });
    const before = JSON.stringify(preview);

    const { governance, approval, receipt, audit } = buildEvidence(preview);
    prepareCalendarMutationQueuePreparation({
      requestId: 'req-q',
      workflowId: 'wf-q',
      preview,
      governance,
      approval,
      receipt,
      audit,
      generatedAtIso: GENERATED_AT,
    });

    expect(JSON.stringify(preview)).toBe(before);
  });

  it('receipt/audit references are populated', () => {
    const preview = basePreview({ previewId: 'p-refs', operation: 'create', estimatedApiOperation: 'events.insert' });
    const { governance, approval, receipt, audit } = buildEvidence(preview);

    const prep = prepareCalendarMutationQueuePreparation({
      requestId: 'req-q',
      workflowId: 'wf-q',
      preview,
      governance,
      approval,
      receipt,
      audit,
      generatedAtIso: GENERATED_AT,
    });

    expect(prep.status).toBe('ready');
    expect(prep.auditReferences.receiptId).toBe(prep.evidence.receipt.receiptId);
    expect(prep.auditReferences.auditId).toBe(prep.evidence.audit.auditId);
  });

  it('no queue execution / no calendar write side-effects implied by controls', () => {
    const preview = basePreview({ previewId: 'p-controls', operation: 'update' });
    const { governance, approval, receipt, audit } = buildEvidence(preview);

    const prep = prepareCalendarMutationQueuePreparation({
      requestId: 'req-q',
      workflowId: 'wf-q',
      preview,
      governance,
      approval,
      receipt,
      audit,
      generatedAtIso: GENERATED_AT,
    });

    expect(prep.executionIntent.queueExecuted).toBe(false);
    expect(prep.executionIntent.liveActionPerformed).toBe(false);
    expect(prep.auditReferences.controls.executionAllowedForQueueRunner).toBe(false);
  });

  it('deterministic repeated output for some input', () => {
    const preview = basePreview({ previewId: 'p-deterministic2', operation: 'update' });
    const { governance, approval, receipt, audit } = buildEvidence(preview);

    const a = prepareCalendarMutationQueuePreparation({
      requestId: 'r1',
      workflowId: 'w1',
      preview,
      governance,
      approval,
      receipt,
      audit,
      generatedAtIso: GENERATED_AT,
    });
    const b = prepareCalendarMutationQueuePreparation({
      requestId: 'r2',
      workflowId: 'w2',
      preview,
      governance,
      approval,
      receipt,
      audit,
      generatedAtIso: GENERATED_AT,
    });

    expect(a).toEqual(b);
  });

  it('rejects unsupported operation', () => {
    const preview = basePreview({
      previewId: 'p-unsupported',
      operation: 'update' as any,
      estimatedApiOperation: 'events.patch',
    });

    const governance = evaluateCalendarMutationGovernance({
      requestId: 'req-q',
      workflowId: 'wf-q',
      organization: orgAllow,
      preview,
    });

    const approval = prepareCalendarMutationApproval(preview, governance, GENERATED_AT);
    const receipt = buildMutationPreviewReceipt(preview, governance, approval, GENERATED_AT);
    const audit = buildCalendarMutationPreviewAuditRecord(preview, governance, approval, receipt, GENERATED_AT);

    const prep = prepareCalendarMutationQueuePreparation({
      requestId: 'req-q',
      workflowId: 'wf-q',
      preview: { ...preview, operation: 'unsupported' as any },
      governance,
      approval,
      receipt,
      audit,
      generatedAtIso: GENERATED_AT,
    });

    expect(prep.status).toBe('rejected');
    expect(prep.rejectedReasons).toContain('unsupported_operation');
  });

  it('retry metadata remains metadata-only and deterministic', () => {
    const preview = basePreview({ previewId: 'p-retry', operation: 'delete', estimatedApiOperation: 'events.delete', recurringScope: 'series' });
    const { governance, approval, receipt, audit } = buildEvidence(preview);

    const prep = prepareCalendarMutationQueuePreparation({
      requestId: 'req-q',
      workflowId: 'wf-q',
      preview,
      governance,
      approval,
      receipt,
      audit,
      generatedAtIso: GENERATED_AT,
    });

    expect(prep.retry.retryEligible).toBe(false);
    expect(prep.retry.retryPolicy.delaySeconds).toEqual([5, 10, 20]);
  });

  it('rejects when approval status is not pending_human_review', () => {
    const preview = basePreview();
    const { governance, approval, receipt, audit } = buildEvidence(preview);
    const mockApproval = { ...approval, approvalStatus: 'approved' as any };

    const prep = prepareCalendarMutationQueuePreparation({
      requestId: 'req-q',
      workflowId: 'wf-q',
      preview,
      governance,
      approval: mockApproval,
      receipt,
      audit,
      generatedAtIso: GENERATED_AT,
    });

    expect(prep.status).toBe('rejected');
    expect(prep.rejectedReasons).toContain('approval_not_pending_human_review');
  });

  it('rejects when previewOnly is false', () => {
    // intentionally invalid runtime input to verify rejection
    const preview = basePreview({ previewOnly: false as any });
    const { governance, approval, receipt, audit } = buildEvidence(preview);

    const prep = prepareCalendarMutationQueuePreparation({
      requestId: 'req-q',
      workflowId: 'wf-q',
      preview,
      governance,
      approval,
      receipt,
      audit,
      generatedAtIso: GENERATED_AT,
    });

    expect(prep.status).toBe('rejected');
    expect(prep.rejectedReasons).toContain('previewOnly_not_true');
  });

  it('rejects when executionAllowed is true in preview', () => {
    // intentionally invalid runtime input to verify rejection
    const preview = basePreview({ executionAllowed: true as any });
    const { governance, approval, receipt, audit } = buildEvidence(preview);

    const prep = prepareCalendarMutationQueuePreparation({
      requestId: 'req-q',
      workflowId: 'wf-q',
      preview,
      governance,
      approval,
      receipt,
      audit,
      generatedAtIso: GENERATED_AT,
    });

    expect(prep.status).toBe('rejected');
    expect(prep.rejectedReasons).toContain('executionAllowed_not_false');
  });

  it('rejects when approval execution controls are violated (executionAllowed=true)', () => {
    const preview = basePreview();
    const { governance, approval, receipt, audit } = buildEvidence(preview);
    const mockApproval = { ...approval, executionAllowed: true as any };

    const prep = prepareCalendarMutationQueuePreparation({
      requestId: 'req-q',
      workflowId: 'wf-q',
      preview,
      governance,
      approval: mockApproval,
      receipt,
      audit,
      generatedAtIso: GENERATED_AT,
    });

    expect(prep.status).toBe('rejected');
    expect(prep.rejectedReasons).toContain('approval_execution_controls_violated');
  });

  it('rejects when approval liveExecutionAuthorized is true', () => {
    const preview = basePreview();
    const { governance, approval, receipt, audit } = buildEvidence(preview);
    const mockApproval = { ...approval, liveExecutionAuthorized: true as any };

    const prep = prepareCalendarMutationQueuePreparation({
      requestId: 'req-q',
      workflowId: 'wf-q',
      preview,
      governance,
      approval: mockApproval,
      receipt,
      audit,
      generatedAtIso: GENERATED_AT,
    });

    expect(prep.status).toBe('rejected');
    expect(prep.rejectedReasons).toContain('approval_execution_controls_violated');
  });

  it('rejects when preview contains invalid_preview flag', () => {
    const preview = basePreview({ 
      validationErrors: [{ code: 'invalid_preview', message: 'invalid' }] 
    });
    const { governance, approval, receipt, audit } = buildEvidence(preview);

    const prep = prepareCalendarMutationQueuePreparation({
      requestId: 'req-q',
      workflowId: 'wf-q',
      preview,
      governance,
      approval,
      receipt,
      audit,
      generatedAtIso: GENERATED_AT,
    });

    expect(prep.status).toBe('rejected');
    expect(prep.rejectedReasons).toContain('invalid_preview');
  });

  it('maps all risk levels to corresponding priorities', () => {
    const levels: Array<{ level: string; expected: string }> = [
      { level: 'low', expected: 'low' },
      { level: 'medium', expected: 'normal' },
      { level: 'high', expected: 'high' },
      { level: 'critical', expected: 'critical' },
    ];

    for (const { level, expected } of levels) {
      const preview = basePreview();
      const { approval, receipt, audit } = buildEvidence(preview);
      
      const mockGovernance: CalendarMutationGovernanceDecision = {
        ...evaluateCalendarMutationGovernance({
          requestId: 'req-q',
          workflowId: 'wf-q',
          organization: orgAllow,
          preview,
        }),
        risk: { level: level as any, score: 10, factors: [] },
      };

      const prep = prepareCalendarMutationQueuePreparation({
        requestId: 'req-q',
        workflowId: 'wf-q',
        preview,
        governance: mockGovernance,
        approval,
        receipt,
        audit,
        generatedAtIso: GENERATED_AT,
      });
      expect(prep.scheduling.priority).toBe(expected);
    }
  });

  it('defaults priority to normal for unknown risk levels', () => {
    const preview = basePreview();
    const { approval, receipt, audit } = buildEvidence(preview);
    
    const mockGovernance: CalendarMutationGovernanceDecision = {
      ...evaluateCalendarMutationGovernance({
        requestId: 'req-q',
        workflowId: 'wf-q',
        organization: orgAllow,
        preview,
      }),
      risk: { level: 'unknown' as any, score: 10, factors: [] },
    };

    const prep = prepareCalendarMutationQueuePreparation({
      requestId: 'req-q',
      workflowId: 'wf-q',
      preview,
      governance: mockGovernance,
      approval,
      receipt,
      audit,
      generatedAtIso: GENERATED_AT,
    });
    expect(prep.scheduling.priority).toBe('normal');
  });
});
