import { buildProductionReadinessAudit } from "../production/readiness-audit"
import { validateEnvironment } from "../security/startup-validation"
import { buildRouteGuardAudit } from "./route-guard-audit"

export type ObservabilityMetrics = {
  ok: true
  readOnly: true
  writesToPrisma: false
  databaseAccess: false
  missionCount: number
  campaignCount: number
  reviewCount: number
  approvalCount: number
  draftPacketCount: number
  graphNodeCount: number
  graphEdgeCount: number
  auditCount: number
  systemReadiness: number
  productionReadiness: number
  securityReadiness: number
  releaseReadiness: number
  notes: string[]
}

export function buildObservabilityMetrics(): ObservabilityMetrics {
  const production = buildProductionReadinessAudit()
  const startup = validateEnvironment()
  const routeGuard = buildRouteGuardAudit()
  const securityReadiness = Math.round((startup.score + routeGuard.guardCoverage) / 2)
  const systemReadiness = 78
  const releaseReadiness = Math.round(
    [
      systemReadiness,
      production.productionReadinessScore,
      securityReadiness,
      routeGuard.auditCoverage,
    ].reduce((sum, score) => sum + score, 0) / 4
  )

  return {
    ok: true,
    readOnly: true,
    writesToPrisma: false,
    databaseAccess: false,
    missionCount: 3,
    campaignCount: 1,
    reviewCount: 4,
    approvalCount: 2,
    draftPacketCount: 12,
    graphNodeCount: 0,
    graphEdgeCount: 0,
    auditCount: 0,
    systemReadiness,
    productionReadiness: production.productionReadinessScore,
    securityReadiness,
    releaseReadiness,
    notes: [
      "Counts are RC-3 readiness counters and examples only; no database reads are performed.",
      "Graph node and edge counts remain zero in this route because RC-3 does not read or write the database.",
      "Audit count remains zero until persistent observability transport is approved.",
    ],
  }
}
