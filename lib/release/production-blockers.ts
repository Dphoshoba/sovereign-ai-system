import { buildProductionReadinessAudit } from "../production/readiness-audit"
import { buildReleaseConfidence } from "../observability/release-confidence"
import { buildGuardCoverageReport } from "./guard-coverage-report"

export type ProductionBlockerSeverity = "medium" | "high" | "critical"

export type ProductionBlocker = {
  id: string
  severity: ProductionBlockerSeverity
  area:
    | "auth"
    | "authorization"
    | "rate-limit"
    | "publishing"
    | "graph"
    | "observability"
    | "startup"
  summary: string
  requiredForV1: boolean
  recommendedAction: string
}

export type ProductionBlockerReport = {
  ok: true
  readOnly: true
  writesToPrisma: false
  blockers: ProductionBlocker[]
  critical: number
  high: number
  requiredForV1: number
}

export function buildProductionBlockerReport(): ProductionBlockerReport {
  const production = buildProductionReadinessAudit()
  const confidence = buildReleaseConfidence()
  const coverage = buildGuardCoverageReport()
  const blockers: ProductionBlocker[] = [
    blocker("PB-001", "critical", "auth", "Authentication provider integration is absent.", true, "Select and integrate the approved auth provider in a later RC."),
    blocker("PB-002", "critical", "authorization", "Role and permission contracts are not enforced at route boundaries.", true, "Bind authenticated identities to route guard checks."),
    blocker("PB-003", "high", "rate-limit", "Rate-limit policies are defined but not enforced.", true, "Implement approved rate-limit middleware or route guard layer."),
    blocker("PB-004", "high", "publishing", "Publishing and social posting routes need live negative tests.", true, "Add safe automated negative tests before exposing release controls."),
    blocker("PB-005", "high", "observability", "Audit and observability contracts are not persisted.", false, "Add telemetry transport and immutable audit snapshots."),
    blocker("PB-006", "medium", "startup", "Startup gate remains report-only.", false, "Enable boot enforcement after environment parity approval."),
  ]

  if (production.releaseBlockers.length === 0 && confidence.remainingBlockers.length === 0) {
    return {
      ok: true,
      readOnly: true,
      writesToPrisma: false,
      blockers: blockers.filter((item) => item.area === "observability" && coverage.guardCoverage < 90),
      critical: 0,
      high: 0,
      requiredForV1: 0,
    }
  }

  return {
    ok: true,
    readOnly: true,
    writesToPrisma: false,
    blockers,
    critical: blockers.filter((item) => item.severity === "critical").length,
    high: blockers.filter((item) => item.severity === "high").length,
    requiredForV1: blockers.filter((item) => item.requiredForV1).length,
  }
}

function blocker(
  id: string,
  severity: ProductionBlockerSeverity,
  area: ProductionBlocker["area"],
  summary: string,
  requiredForV1: boolean,
  recommendedAction: string
): ProductionBlocker {
  return {
    id,
    severity,
    area,
    summary,
    requiredForV1,
    recommendedAction,
  }
}
