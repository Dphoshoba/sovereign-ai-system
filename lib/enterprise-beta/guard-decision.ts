export type GuardDecisionOutcome =
  | "ALLOW_PREVIEW"
  | "REQUIRES_REVIEW"
  | "BLOCK_RUNTIME"
  | "MISSING_CONTEXT"

export type GuardDecision = {
  id: string
  routePattern: string
  outcome: GuardDecisionOutcome
  requiredClaims: string[]
  providedClaims: string[]
  missingClaims: string[]
  requiredPermissions: string[]
  explanation: string
  runtimeEnforced: false
}

export function buildGuardDecisions(): GuardDecision[] {
  return [
    {
      id: "decision-enterprise-beta-preview",
      routePattern: "/api/enterprise-beta/*",
      outcome: "ALLOW_PREVIEW",
      requiredClaims: ["actorId", "organizationId", "role"],
      providedClaims: ["actorId", "organizationId", "role"],
      missingClaims: [],
      requiredPermissions: ["view-enterprise-beta-readiness"],
      explanation: "Preview-only Enterprise Beta route can be viewed in report-only mode.",
      runtimeEnforced: false,
    },
    {
      id: "decision-operator-preview",
      routePattern: "/api/ev-kos/operator-*",
      outcome: "REQUIRES_REVIEW",
      requiredClaims: ["actorId", "organizationId", "workspaceIds", "approvalScopes"],
      providedClaims: ["actorId", "organizationId"],
      missingClaims: ["workspaceIds", "approvalScopes"],
      requiredPermissions: ["preview-operator-actions"],
      explanation: "Operator routes need workspace and approval scope before enforcement.",
      runtimeEnforced: false,
    },
    {
      id: "decision-publishing-runtime",
      routePattern: "/api/publishing/*",
      outcome: "BLOCK_RUNTIME",
      requiredClaims: ["actorId", "organizationId", "approvalScopes"],
      providedClaims: ["actorId"],
      missingClaims: ["organizationId", "approvalScopes"],
      requiredPermissions: ["prepare-publication"],
      explanation: "Publishing remains blocked until tenant scope and approvals are enforceable.",
      runtimeEnforced: false,
    },
    {
      id: "decision-graph-runtime",
      routePattern: "/api/knowledge-graph/*",
      outcome: "MISSING_CONTEXT",
      requiredClaims: ["actorId", "organizationId", "workspaceIds", "approvalScopes"],
      providedClaims: ["actorId", "organizationId"],
      missingClaims: ["workspaceIds", "approvalScopes"],
      requiredPermissions: ["preview-graph-readiness"],
      explanation: "Graph routes need tenant, workspace, and approval context before enforcement.",
      runtimeEnforced: false,
    },
  ]
}

export function evaluateDecisionCoverage(decisions: GuardDecision[] = buildGuardDecisions()) {
  const explained = decisions.filter((decision) => decision.explanation.length > 0).length
  const blockedRuntime = decisions.filter(
    (decision) => decision.outcome === "BLOCK_RUNTIME"
  ).length

  return {
    score: Math.round((explained / decisions.length) * 76 + blockedRuntime * 6),
    status: "DECISION_CONTRACTS_READY_REPORT_ONLY" as const,
    decisionCount: decisions.length,
    blockedRuntime,
    runtimeEnforced: false,
  }
}
