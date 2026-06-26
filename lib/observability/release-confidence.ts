import { buildProductionReadinessAudit } from "../production/readiness-audit"
import { validateEnvironment } from "../security/startup-validation"
import { buildObservabilityMetrics } from "./metrics"
import { buildRouteGuardAudit } from "./route-guard-audit"
import { buildSystemHealth } from "./system-health"

export type ReleaseStatus =
  | "BLOCKED"
  | "PARTIAL"
  | "READY_FOR_RC4"
  | "READY_FOR_RELEASE"

export type ReleaseConfidence = {
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
  architectureConfidence: number
  governanceConfidence: number
  securityConfidence: number
  observabilityConfidence: number
  operatorConfidence: number
  releaseConfidence: number
  releaseStatus: ReleaseStatus
  criticalFindings: string[]
  remainingBlockers: string[]
  recommendation: string
}

export function buildReleaseConfidence(): ReleaseConfidence {
  const production = buildProductionReadinessAudit()
  const startup = validateEnvironment()
  const routeGuard = buildRouteGuardAudit()
  const metrics = buildObservabilityMetrics()
  const health = buildSystemHealth()
  const architectureConfidence = 88
  const governanceConfidence = health.governanceIntegrity
  const securityConfidence = Math.round((startup.score + routeGuard.guardCoverage) / 2)
  const observabilityConfidence = 72
  const operatorConfidence = 68
  const releaseConfidence = Math.round(
    [
      architectureConfidence,
      governanceConfidence,
      securityConfidence,
      observabilityConfidence,
      operatorConfidence,
      metrics.releaseReadiness,
      production.productionReadinessScore,
    ].reduce((sum, score) => sum + score, 0) / 7
  )
  const remainingBlockers = [
    "Authentication provider integration is still absent.",
    "Authorization and role contracts are not enforced at route boundaries.",
    "Rate-limit policies are defined but not enforced.",
    "Observability contracts are not persisted to a log or metrics backend.",
    "Publishing route guard audit is incomplete.",
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
    architectureConfidence,
    governanceConfidence,
    securityConfidence,
    observabilityConfidence,
    operatorConfidence,
    releaseConfidence,
    releaseStatus:
      releaseConfidence >= 92 && remainingBlockers.length === 0
        ? "READY_FOR_RELEASE"
        : releaseConfidence >= 82
          ? "READY_FOR_RC4"
          : releaseConfidence >= 70
            ? "PARTIAL"
            : "BLOCKED",
    criticalFindings: health.criticalIssues,
    remainingBlockers,
    recommendation:
      "RC-4 should add guardrail tests and enforcement planning for auth, authorization, rate limits, startup validation, and observability transport while keeping execution blocked.",
  }
}
