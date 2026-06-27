export type EnterpriseRouteRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export type EnterpriseRouteGuard = {
  id: string
  routePattern: string
  area:
    | "enterprise-beta"
    | "operator"
    | "ontology"
    | "content"
    | "research"
    | "publishing"
    | "graph"
  risk: EnterpriseRouteRisk
  requiredClaims: string[]
  requiredPermissions: string[]
  enforcementMode: "REPORT_ONLY"
  middlewareEnabled: false
}

export function buildEnterpriseRouteGuards(): EnterpriseRouteGuard[] {
  return [
    {
      id: "guard-enterprise-beta",
      routePattern: "/api/enterprise-beta/*",
      area: "enterprise-beta",
      risk: "MEDIUM",
      requiredClaims: ["actorId", "organizationId", "role"],
      requiredPermissions: ["view-enterprise-beta-readiness"],
      enforcementMode: "REPORT_ONLY",
      middlewareEnabled: false,
    },
    {
      id: "guard-operator",
      routePattern: "/api/ev-kos/operator-*",
      area: "operator",
      risk: "HIGH",
      requiredClaims: ["actorId", "organizationId", "workspaceIds", "approvalScopes"],
      requiredPermissions: ["preview-operator-actions"],
      enforcementMode: "REPORT_ONLY",
      middlewareEnabled: false,
    },
    {
      id: "guard-ontology",
      routePattern: "/api/ontology/*",
      area: "ontology",
      risk: "HIGH",
      requiredClaims: ["actorId", "organizationId", "workspaceIds"],
      requiredPermissions: ["preview-knowledge-ingestion"],
      enforcementMode: "REPORT_ONLY",
      middlewareEnabled: false,
    },
    {
      id: "guard-publishing",
      routePattern: "/api/publishing/*",
      area: "publishing",
      risk: "CRITICAL",
      requiredClaims: ["actorId", "organizationId", "approvalScopes"],
      requiredPermissions: ["prepare-publication"],
      enforcementMode: "REPORT_ONLY",
      middlewareEnabled: false,
    },
    {
      id: "guard-graph",
      routePattern: "/api/knowledge-graph/*",
      area: "graph",
      risk: "CRITICAL",
      requiredClaims: ["actorId", "organizationId", "workspaceIds", "approvalScopes"],
      requiredPermissions: ["preview-graph-readiness"],
      enforcementMode: "REPORT_ONLY",
      middlewareEnabled: false,
    },
  ]
}

export function evaluateRouteGuardReadiness(
  guards: EnterpriseRouteGuard[] = buildEnterpriseRouteGuards()
) {
  const reportOnly = guards.filter((guard) => guard.enforcementMode === "REPORT_ONLY").length
  const critical = guards.filter((guard) => guard.risk === "CRITICAL").length
  const score = Math.round((reportOnly / guards.length) * 70 + critical * 5)

  return {
    score,
    status: "GUARD_MODEL_READY_REPORT_ONLY" as const,
    guardCount: guards.length,
    criticalRouteGroups: critical,
    middlewareEnabled: false,
  }
}
