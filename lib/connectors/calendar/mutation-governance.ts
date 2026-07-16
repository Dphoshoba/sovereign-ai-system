import type { GovernanceEngineResult } from '../../../src/lib/gamma-os/policies/policy-types';
import type { CalendarMutationPreview } from './mutation-types';
import { classifyMutationRisk, type MutationRiskAssessment } from './mutation-risk-classifier';
import {
  evaluateCalendarMutationPolicies,
  type CalendarMutationGovernanceInput,
} from './mutation-policy-adapter';

export interface CalendarMutationGovernanceDecision {
  requestId: string;
  workflowId: string;
  previewId: string;
  allowed: boolean;
  blocked: boolean;
  reasons: string[];
  warnings: string[];
  remediations: string[];
  policyResults: GovernanceEngineResult['policyResults'];
  approvalRequired: true;
  humanReviewRequired: true;
  auditRequired: true;
  previewOnly: true;
  executionAllowed: false;
  liveExecutionAuthorized: false;
  risk: MutationRiskAssessment;
}

export interface EvaluateCalendarMutationGovernanceInput
  extends Omit<CalendarMutationGovernanceInput, 'preview'> {
  preview: CalendarMutationPreview;
}

export function evaluateCalendarMutationGovernance(
  input: EvaluateCalendarMutationGovernanceInput
): CalendarMutationGovernanceDecision {
  const risk = classifyMutationRisk(input.preview);
  const policy = evaluateCalendarMutationPolicies({
    ...input,
    preview: {
      ...input.preview,
      riskScore: risk.score,
      riskLevel: risk.level,
    },
  });

  const scopeMissing = input.preview.validationErrors.some(e =>
    e.code.toLowerCase().includes('scope')
  );
  const permissionMissing = input.preview.validationErrors.some(e =>
    e.code.toLowerCase().includes('permission')
  );

  const blockedByLocalGuard = scopeMissing || permissionMissing;

  const reasons = [...policy.normalized.violations];
  if (scopeMissing) {
    reasons.push('local_guard: required scopes missing for mutation approval preparation');
  }
  if (permissionMissing) {
    reasons.push('local_guard: permission constraints block mutation approval preparation');
  }

  return {
    requestId: input.requestId,
    workflowId: input.workflowId,
    previewId: input.preview.previewId,
    allowed: policy.normalized.allowed && !blockedByLocalGuard,
    blocked: policy.normalized.blocked || blockedByLocalGuard,
    reasons,
    warnings: policy.normalized.warnings,
    remediations: policy.normalized.remediations,
    policyResults: policy.policyResults,
    approvalRequired: true,
    humanReviewRequired: true,
    auditRequired: true,
    previewOnly: true,
    executionAllowed: false,
    liveExecutionAuthorized: false,
    risk,
  };
}
