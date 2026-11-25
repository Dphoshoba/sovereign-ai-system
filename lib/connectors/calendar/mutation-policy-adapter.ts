import { GovernancePolicyEngine } from '../../../src/lib/gamma-os/policies/governance-policy-engine';
import type { GovernanceEngineResult, PolicyEvaluationContext } from '../../../src/lib/gamma-os/policies/policy-types';
import type { CalendarMutationPreview } from './mutation-types';

export interface CalendarMutationGovernanceInput {
  requestId: string;
  workflowId: string;
  organization: PolicyEvaluationContext['organization'];
  preview: CalendarMutationPreview;
  connectorIds?: string[];
  metadata?: Record<string, unknown>;
}

function deriveRequestedCapabilities(preview: CalendarMutationPreview): string[] {
  const caps = [
    'calendar.preview',
    `calendar.mutation.${preview.operation}`,
    `calendar.risk.${preview.riskLevel}`,
  ];

  if (preview.recurringScope !== 'single') {
    caps.push('calendar.mutation.recurring');
  }

  if (preview.changeSummary.timezoneChanged) {
    caps.push('calendar.mutation.timezone-change');
  }

  if (preview.detectedConflicts.length > 0) {
    caps.push('calendar.mutation.conflict-aware');
  }

  return caps;
}

function buildPolicyContext(input: CalendarMutationGovernanceInput): PolicyEvaluationContext {
  const scopeMissing = input.preview.requiredScopes.length > 0 && input.preview.validationErrors.some(
    e => e.code.toLowerCase().includes('scope')
  );
  const permissionMissing = input.preview.validationErrors.some(
    e => e.code.toLowerCase().includes('permission')
  );

  return {
    requestId: input.requestId,
    workflowId: input.workflowId,
    organization: input.organization,
    requestedCapabilities: deriveRequestedCapabilities(input.preview),
    connectorIds: input.connectorIds ?? ['calendar'],
    requiresApproval: true,
    requiresHumanReview: true,
    requiresAudit: true,
    requestedMode: 'preview',
    autonomousPublishingRequested: false,
    metadata: {
      connectorAction: `calendar:${input.preview.operation}`,
      recurringScope: input.preview.recurringScope,
      riskLevel: input.preview.riskLevel,
      riskScore: input.preview.riskScore,
      requiredScopes: input.preview.requiredScopes,
      scopeMissing,
      permissionMissing,
      previewOnly: true,
      executionAllowed: false,
      ...input.metadata,
    },
  };
}

export function evaluateCalendarMutationPolicies(
  input: CalendarMutationGovernanceInput,
  engine: GovernancePolicyEngine = GovernancePolicyEngine.createDefault()
): GovernanceEngineResult {
  const context = buildPolicyContext(input);
  return engine.evaluate(context);
}
