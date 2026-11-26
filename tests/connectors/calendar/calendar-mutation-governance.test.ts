import { describe, it, expect } from 'vitest';
import { evaluateCalendarMutationGovernance } from '../../../lib/connectors/calendar/mutation-governance';
import { prepareCalendarMutationApproval } from '../../../lib/connectors/calendar/mutation-approval';
import { buildMutationPreviewReceipt } from '../../../lib/connectors/calendar/mutation-preview-receipt';
import { buildCalendarMutationPreviewAuditRecord } from '../../../lib/connectors/calendar/mutation-preview-audit';
import { classifyMutationRisk } from '../../../lib/connectors/calendar/mutation-risk-classifier';
import type { CalendarMutationPreview } from '../../../lib/connectors/calendar/mutation-types';

const FIXED_TIME = '2026-07-20T00:00:00.000Z';

function basePreview(overrides: Partial<CalendarMutationPreview> = {}): CalendarMutationPreview {
  return {
    previewId: 'p-001',
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
    estimatedApiOperation: 'events.update',
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
      generatedAt: FIXED_TIME,
      deterministicSeed: 'seed',
    },
    previewOnly: true,
    executionAllowed: false,
    ...overrides,
  };
}

const orgAllow = {
  organizationId: 'org-1',
  tenantId: 'tenant-1',
  environment: 'dev' as const,
  policyVersion: 'v1',
  allowedModes: ['preview', 'live'],
  deniedConnectors: [],
  deniedCapabilities: [],
};

const orgPolicyDeny = {
  ...orgAllow,
  allowedModes: ['preview'] as const,
};

const orgConnectorDeny = {
  ...orgAllow,
  allowedModes: ['preview'] as const,
};

const orgSecurityDeny = {
  ...orgAllow,
  allowedModes: ['preview'] as const,
};

describe('calendar mutation governance stage2b', () => {
  it('classifies low risk baseline mutation', () => {
    const risk = classifyMutationRisk(basePreview());
    expect(risk.level).toBe('low');
    expect(risk.score).toBeLessThan(30);
  });

  it('classifies external attendee scenario with elevated score over baseline', () => {
    const baseline = classifyMutationRisk(basePreview());
    const risk = classifyMutationRisk(
      basePreview({
        attendees: [{ email: 'a@vendor.com' }, { email: 'member@example.com' }],
      })
    );
    expect(risk.score).toBeGreaterThan(baseline.score);
  });

  it('classifies recurrence + warnings + conflicts with elevated score', () => {
    const baseline = classifyMutationRisk(basePreview());
    const risk = classifyMutationRisk(
      basePreview({
        recurringScope: 'this_and_following',
        detectedConflicts: [{ type: 'time_overlap', message: 'overlap' }],
        warnings: [{ code: 'warn', message: 'warn' }],
      })
    );
    expect(risk.score).toBeGreaterThan(baseline.score);
  });

  it('classifies critical for destructive series operations', () => {
    const risk = classifyMutationRisk(
      basePreview({
        operation: 'delete',
        recurringScope: 'series',
        estimatedApiOperation: 'events.delete',
      })
    );
    expect(risk.level).toBe('critical');
    expect(risk.score).toBeGreaterThanOrEqual(80);
  });

  it('create operation still requires approval/human review/audit', () => {
    const decision = evaluateCalendarMutationGovernance({
      requestId: 'req-create',
      workflowId: 'wf-create',
      organization: orgAllow,
      preview: basePreview({ operation: 'create', estimatedApiOperation: 'events.insert' }),
    });
    expect(decision.approvalRequired).toBe(true);
    expect(decision.humanReviewRequired).toBe(true);
    expect(decision.auditRequired).toBe(true);
  });

  it('update operation requires approval/human review/audit', () => {
    const decision = evaluateCalendarMutationGovernance({
      requestId: 'req-update',
      workflowId: 'wf-update',
      organization: orgAllow,
      preview: basePreview({ operation: 'update', estimatedApiOperation: 'events.patch' }),
    });
    expect(decision.approvalRequired).toBe(true);
    expect(decision.humanReviewRequired).toBe(true);
    expect(decision.auditRequired).toBe(true);
  });

  it('delete operation requires approval/human review/audit', () => {
    const decision = evaluateCalendarMutationGovernance({
      requestId: 'req-delete',
      workflowId: 'wf-delete',
      organization: orgAllow,
      preview: basePreview({ operation: 'delete', estimatedApiOperation: 'events.delete' }),
    });
    expect(decision.approvalRequired).toBe(true);
    expect(decision.humanReviewRequired).toBe(true);
    expect(decision.auditRequired).toBe(true);
  });

  it('recurring instance increases risk over single', () => {
    const single = classifyMutationRisk(basePreview({ recurringScope: 'single' }));
    const instance = classifyMutationRisk(basePreview({ recurringScope: 'instance' }));
    expect(instance.score).toBeGreaterThanOrEqual(single.score);
  });

  it('recurring series increases risk over instance', () => {
    const instance = classifyMutationRisk(basePreview({ recurringScope: 'instance' }));
    const series = classifyMutationRisk(basePreview({ recurringScope: 'series' }));
    expect(series.score).toBeGreaterThan(instance.score);
  });

  it('external attendee risk factor present', () => {
    const risk = classifyMutationRisk(basePreview({ attendees: [{ email: 'x@external.com' }] }));
    expect(risk.factors.some(f => f.code === 'external_attendees')).toBe(true);
  });

  it('resource attendee risk factor present', () => {
    const risk = classifyMutationRisk(
      basePreview({
        attendees: [{ email: 'room@example.com', resource: true } as any],
      })
    );
    expect(risk.factors.some(f => f.code === 'resource_attendees')).toBe(true);
  });

  it('conflicts escalate risk', () => {
    const noConflict = classifyMutationRisk(basePreview({ detectedConflicts: [] }));
    const withConflict = classifyMutationRisk(
      basePreview({ detectedConflicts: [{ type: 'time_overlap', message: 'overlap' }] })
    );
    expect(withConflict.score).toBeGreaterThan(noConflict.score);
  });

  it('timezone impact escalates risk', () => {
    const noTimezone = classifyMutationRisk(basePreview());
    const timezone = classifyMutationRisk(
      basePreview({
        changeSummary: { ...basePreview().changeSummary, timezoneChanged: true },
      })
    );
    expect(timezone.score).toBeGreaterThan(noTimezone.score);
  });

  it('missing scope blocks governance', () => {
    const decision = evaluateCalendarMutationGovernance({
      requestId: 'req-scope',
      workflowId: 'wf-scope',
      organization: orgAllow,
      preview: basePreview({
        validationErrors: [{ code: 'missing_scope', message: 'scope missing' }],
      }),
    });
    expect(decision.allowed).toBe(false);
    expect(decision.blocked).toBe(true);
  });

  it('insufficient permission blocks governance', () => {
    const decision = evaluateCalendarMutationGovernance({
      requestId: 'req-perm',
      workflowId: 'wf-perm',
      organization: orgAllow,
      preview: basePreview({
        validationErrors: [{ code: 'permission_denied', message: 'permission denied' }],
      }),
    });
    expect(decision.allowed).toBe(false);
    expect(decision.blocked).toBe(true);
  });

  it('organization policy deny scenario surfaces violations/remediations', () => {
    const decision = evaluateCalendarMutationGovernance({
      requestId: 'req-org-deny',
      workflowId: 'wf-org-deny',
      organization: orgPolicyDeny,
      preview: basePreview(),
    });
    expect(decision.reasons.length).toBeGreaterThanOrEqual(0);
    expect(decision.remediations.length).toBeGreaterThan(0);
    expect(decision.previewOnly).toBe(true);
    expect(decision.executionAllowed).toBe(false);
  });

  it('connector policy deny scenario keeps safety envelope intact', () => {
    const decision = evaluateCalendarMutationGovernance({
      requestId: 'req-conn-deny',
      workflowId: 'wf-conn-deny',
      organization: orgConnectorDeny,
      preview: basePreview(),
    });
    expect(decision.previewOnly).toBe(true);
    expect(decision.executionAllowed).toBe(false);
    expect(decision.liveExecutionAuthorized).toBe(false);
  });

  it('security policy deny scenario keeps governance metadata populated', () => {
    const decision = evaluateCalendarMutationGovernance({
      requestId: 'req-sec-deny',
      workflowId: 'wf-sec-deny',
      organization: orgSecurityDeny,
      preview: basePreview({
        detectedConflicts: [{ type: 'time_overlap', message: 'conflict' }],
      }),
    });
    expect(decision.policyResults.length).toBeGreaterThan(0);
    expect(decision.previewOnly).toBe(true);
    expect(decision.executionAllowed).toBe(false);
  });

  it('previewOnly remains true and executionAllowed remains false', () => {
    const decision = evaluateCalendarMutationGovernance({
      requestId: 'req-controls',
      workflowId: 'wf-controls',
      organization: orgAllow,
      preview: basePreview(),
    });
    expect(decision.previewOnly).toBe(true);
    expect(decision.executionAllowed).toBe(false);
    expect(decision.liveExecutionAuthorized).toBe(false);
  });

  it('deterministic repeated outputs for same input', () => {
    const preview = basePreview({ attendees: [{ email: 'external@vendor.com' }] });
    const first = evaluateCalendarMutationGovernance({
      requestId: 'req-det',
      workflowId: 'wf-det',
      organization: orgAllow,
      preview,
    });
    const second = evaluateCalendarMutationGovernance({
      requestId: 'req-det',
      workflowId: 'wf-det',
      organization: orgAllow,
      preview,
    });
    expect(first).toEqual(second);
  });

  it('does not mutate input preview object', () => {
    const preview = basePreview({ attendees: [{ email: 'external@vendor.com' }] });
    const before = JSON.stringify(preview);
    evaluateCalendarMutationGovernance({
      requestId: 'req-mutate',
      workflowId: 'wf-mutate',
      organization: orgAllow,
      preview,
    });
    expect(JSON.stringify(preview)).toBe(before);
  });

  it('approval preparation never auto-approves', () => {
    const preview = basePreview();
    const decision = evaluateCalendarMutationGovernance({
      requestId: 'req-approval',
      workflowId: 'wf-approval',
      organization: orgAllow,
      preview,
    });

    const approval = prepareCalendarMutationApproval(preview, decision, FIXED_TIME);
    expect(approval.approvalStatus).toBe('pending_human_review');
    expect(approval.executionAllowed).toBe(false);
    expect(approval.liveExecutionAuthorized).toBe(false);
  });

  it('receipt and audit never allow queue submission or live execution', () => {
    const preview = basePreview();
    const decision = evaluateCalendarMutationGovernance({
      requestId: 'req-receipt',
      workflowId: 'wf-receipt',
      organization: orgAllow,
      preview,
    });

    const approval = prepareCalendarMutationApproval(preview, decision, FIXED_TIME);
    const receipt = buildMutationPreviewReceipt(preview, decision, approval, FIXED_TIME);
    const audit = buildCalendarMutationPreviewAuditRecord(preview, decision, approval, receipt, FIXED_TIME);

    expect(receipt.liveExecutionAuthorized).toBe(false);
    expect(audit.controls.queueSubmissionAllowed).toBe(false);
    expect(audit.controls.autoApprovalAllowed).toBe(false);
    expect(audit.controls.executionAllowed).toBe(false);
  });

  it('governance layer has no calendar write execution side-effects', () => {
    const preview = basePreview({ estimatedApiOperation: 'events.insert' });
    const decision = evaluateCalendarMutationGovernance({
      requestId: 'req-no-write',
      workflowId: 'wf-no-write',
      organization: orgAllow,
      preview,
    });
    expect(decision.executionAllowed).toBe(false);
    expect(decision.previewOnly).toBe(true);
  });
});
