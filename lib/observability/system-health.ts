import { summarizeErrorCatalog } from "./error-catalog"
import { buildObservabilityMetrics } from "./metrics"
import { buildRouteGuardAudit } from "./route-guard-audit"

export type SystemHealthStatus = "HEALTHY" | "DEGRADED" | "BLOCKED"

export type SystemHealth = {
  ok: true
  readOnly: true
  writesToPrisma: false
  execution: false
  openAiCalls: false
  graphWrites: false
  graphDeletes: false
  publishing: false
  socialPosting: false
  automaticApprovals: false
  healthScore: number
  serviceStatus: SystemHealthStatus
  dependencyStatus: SystemHealthStatus
  routeCoverage: number
  governanceIntegrity: number
  securityIntegrity: number
  executionStatus: "BLOCKED_BY_DESIGN"
  blockedCapabilities: string[]
  criticalIssues: string[]
  warnings: string[]
}

export function buildSystemHealth(): SystemHealth {
  const metrics = buildObservabilityMetrics()
  const routeGuard = buildRouteGuardAudit()
  const errors = summarizeErrorCatalog()
  const governanceIntegrity = 90
  const securityIntegrity = metrics.securityReadiness
  const routeCoverage = routeGuard.guardCoverage
  const healthScore = Math.round(
    [
      metrics.systemReadiness,
      metrics.productionReadiness,
      routeCoverage,
      governanceIntegrity,
      securityIntegrity,
    ].reduce((sum, score) => sum + score, 0) / 5
  )
  const criticalIssues = [
    "Authentication provider is not integrated.",
    "Authorization contracts are not yet enforced by route guards.",
    "Rate-limit policies are not yet enforced.",
    "Persistent observability transport is not implemented.",
  ]

  return {
    ok: true,
    readOnly: true,
    writesToPrisma: false,
    execution: false,
    openAiCalls: false,
    graphWrites: false,
    graphDeletes: false,
    publishing: false,
    socialPosting: false,
    automaticApprovals: false,
    healthScore,
    serviceStatus: criticalIssues.length > 0 ? "DEGRADED" : "HEALTHY",
    dependencyStatus: errors.blockers > 0 ? "BLOCKED" : "HEALTHY",
    routeCoverage,
    governanceIntegrity,
    securityIntegrity,
    executionStatus: "BLOCKED_BY_DESIGN",
    blockedCapabilities: [
      "Operator action execution",
      "OpenAI generation",
      "Automatic publishing",
      "Social posting",
      "Broad graph writes",
      "Automatic approvals",
    ],
    criticalIssues,
    warnings: [
      "Metrics are read-only readiness indicators and not persisted telemetry.",
      "Publishing routes require a separate guard audit before operator controls.",
      "Graph write expansion remains blocked by approval and audit requirements.",
    ],
  }
}
