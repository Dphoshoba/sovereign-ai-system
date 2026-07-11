import type { GovernanceEngineResult } from "../policies/policy-types";
import type { PreviewRoute } from "./execution-plan";

export function routePreview(params: {
  governanceDecision: GovernanceEngineResult["normalized"];
}): PreviewRoute {
  const { governanceDecision } = params;

  if (governanceDecision.blocked) {
    return {
      route: "preview",
      status: "blocked",
      reason: "Governance decision blocked orchestration.",
      metadata: {
        deterministic: true,
        mode: "preview-only",
      },
    };
  }

  return {
    route: "preview",
    status: "ready",
    metadata: {
      deterministic: true,
      mode: "preview-only",
    },
  };
}
