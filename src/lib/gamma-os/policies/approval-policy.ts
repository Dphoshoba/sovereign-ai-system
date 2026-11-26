import type { PolicyEvaluator } from "./policy-types";

export const approvalPolicy: PolicyEvaluator = {
  id: "approval-required",
  category: "approval",
  order: 10,
  evaluate(input) {
    const required = input.context.requiresApproval;
    return {
      policyId: "approval-required",
      category: "approval",
      severity: required ? "warning" : "info",
      blocking: false,
      passed: true,
      reason: required
        ? "Approval is required before execution can proceed."
        : "Approval is not required for this request.",
      remediation: required
        ? "Route request to approval workflow and await decision."
        : "No remediation required.",
      order: 10,
      flags: {
        approvalRequired: required,
      },
    };
  },
};

export const humanReviewPolicy: PolicyEvaluator = {
  id: "human-review-required",
  category: "approval",
  order: 20,
  evaluate(input) {
    const required = input.context.requiresHumanReview;
    return {
      policyId: "human-review-required",
      category: "approval",
      severity: required ? "warning" : "info",
      blocking: false,
      passed: true,
      reason: required
        ? "Human review is required for this request."
        : "Human review is not required for this request.",
      remediation: required
        ? "Assign to human review queue before execution."
        : "No remediation required.",
      order: 20,
      flags: {
        humanReviewRequired: required,
      },
    };
  },
};

export const auditPolicy: PolicyEvaluator = {
  id: "audit-required",
  category: "approval",
  order: 30,
  evaluate(input) {
    const required = input.context.requiresAudit;
    return {
      policyId: "audit-required",
      category: "approval",
      severity: required ? "warning" : "info",
      blocking: false,
      passed: true,
      reason: required
        ? "Audit trail is required for this request."
        : "Audit trail is not required for this request.",
      remediation: required
        ? "Attach immutable audit reference and log policy decisions."
        : "No remediation required.",
      order: 30,
      flags: {
        auditRequired: required,
      },
    };
  },
};
