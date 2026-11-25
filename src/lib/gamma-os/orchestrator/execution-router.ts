import type { GovernanceEngineResult } from "../policies/policy-types";

export interface ExecutionRouteIntent {
  route: "preview" | "approval" | "audit";
  status: "ready" | "blocked";
  reason?: string;
  executionAllowed: false;
}

export function routeExecutionIntent(params: {
  governanceDecision: GovernanceEngineResult["normalized"];
  previewReady: boolean;
  approvalReady: boolean;
  auditReady: boolean;
}): ExecutionRouteIntent {
  const { governanceDecision, previewReady, approvalReady, auditReady } = params;

  if (governanceDecision.blocked) {
    return {
      route: "audit",
      status: "blocked",
      reason: "Governance denied orchestration.",
      executionAllowed: false,
    };
  }

  if (previewReady) {
    return {
      route: "preview",
      status: "ready",
      executionAllowed: false,
    };
  }

  if (approvalReady) {
    return {
      route: "approval",
      status: "ready",
      executionAllowed: false,
    };
  }

  if (auditReady) {
    return {
      route: "audit",
      status: "ready",
      executionAllowed: false,
    };
  }

  return {
    route: "audit",
    status: "blocked",
    reason: "No orchestration route is available.",
    executionAllowed: false,
  };
}
