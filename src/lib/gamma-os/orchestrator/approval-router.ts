import type { GovernanceEngineResult } from "../policies/policy-types";
import type { ApprovalRoute } from "./execution-plan";

export function routeApproval(params: {
  governanceDecision: GovernanceEngineResult["normalized"] & { obligations?: string[] };
  requiredCapabilities: string[];
}): ApprovalRoute {
  const { governanceDecision, requiredCapabilities } = params;

  const checkpoints = [
    "governance-policy-review",
    "human-approval-checkpoint",
    ...requiredCapabilities.map((capability) => `capability:${capability}`),
  ].sort((a, b) => a.localeCompare(b));

  if (governanceDecision.blocked) {
    return {
      route: "approval",
      status: "blocked",
      checkpoints,
      requiresHumanReview: true,
      reason: "Governance blocked workflow before approval routing.",
    };
  }

  const obligations = governanceDecision.obligations ?? [];
  const approvalObligation =
    governanceDecision.approvalRequired ||
    obligations.some((obligation: string) => obligation.toLowerCase().includes("approval"));

  if (!approvalObligation) {
    return {
      route: "approval",
      status: "blocked",
      checkpoints,
      requiresHumanReview: true,
      reason: "Approval obligation missing from governance decision.",
    };
  }

  return {
    route: "approval",
    status: "ready",
    checkpoints,
    requiresHumanReview: true,
  };
}
