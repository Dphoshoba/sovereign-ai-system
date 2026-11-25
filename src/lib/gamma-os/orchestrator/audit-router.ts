import type { GovernanceEngineResult } from "../policies/policy-types";
import type { AuditRoute } from "./execution-plan";

export function routeAudit(params: {
  governanceDecision: GovernanceEngineResult["normalized"];
  requestId: string;
  workflowId: string;
}): AuditRoute {
  const { governanceDecision, requestId, workflowId } = params;

  const policyIds = governanceDecision.evaluatedPolicyIds ?? [];
  const references = [
    `request:${requestId}`,
    `workflow:${workflowId}`,
    ...policyIds.map((id: string) => `policy:${id}`),
  ].sort((a, b) => a.localeCompare(b));

  if (governanceDecision.blocked) {
    return {
      route: "audit",
      status: "blocked",
      references,
      immutableProjection: true,
      reason: "Governance denied orchestration; audit route is blocked.",
    };
  }

  return {
    route: "audit",
    status: "ready",
    references,
    immutableProjection: true,
  };
}
