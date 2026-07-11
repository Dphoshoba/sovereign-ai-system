import type { GovernanceDecision, OrganizationContext } from "../contracts";

export type PolicyCategory =
  | "approval"
  | "execution"
  | "connector"
  | "organization"
  | "security";

export type PolicySeverity = "info" | "warning" | "critical";

export type PolicyId =
  | "approval-required"
  | "human-review-required"
  | "audit-required"
  | "preview-only-enforcement"
  | "live-execution-default-deny"
  | "autonomous-publishing-prohibited"
  | "connector-restrictions"
  | "organization-policy"
  | "security-policy";

export interface PolicyEvaluationContext {
  requestId: string;
  workflowId: string;
  organization: OrganizationContext;
  requestedCapabilities: string[];
  connectorIds: string[];
  requiresApproval: boolean;
  requiresHumanReview: boolean;
  requiresAudit: boolean;
  requestedMode: "preview" | "live";
  autonomousPublishingRequested: boolean;
  metadata?: Record<string, unknown>;
}

export interface PolicyInput {
  context: PolicyEvaluationContext;
}

export interface PolicyResult {
  policyId: PolicyId;
  category: PolicyCategory;
  severity: PolicySeverity;
  blocking: boolean;
  passed: boolean;
  reason: string;
  remediation: string;
  order: number;
  flags?: {
    approvalRequired?: boolean;
    humanReviewRequired?: boolean;
    auditRequired?: boolean;
    previewOnly?: boolean;
    liveExecutionDenied?: boolean;
    autonomousPublishingDenied?: boolean;
  };
}

export interface NormalizedPolicyDecision {
  allowed: boolean;
  blocked: boolean;
  approvalRequired: boolean;
  humanReviewRequired: boolean;
  auditRequired: boolean;
  previewOnly: boolean;
  violations: string[];
  warnings: string[];
  remediations: string[];
  evaluatedPolicyIds: PolicyId[];
}

export interface PolicyEvaluator {
  id: PolicyId;
  category: PolicyCategory;
  order: number;
  evaluate(input: PolicyInput): PolicyResult;
}

export interface GovernanceEngineResult {
  normalized: NormalizedPolicyDecision;
  policyResults: PolicyResult[];
  governanceDecision: GovernanceDecision;
}
