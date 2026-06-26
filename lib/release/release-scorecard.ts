import { buildGuardCoverageReport } from "./guard-coverage-report"
import { buildHttpNegativeTestSuite } from "./http-negative-tests"
import { buildProductionBlockerReport } from "./production-blockers"
import { buildStartupGate } from "./startup-gate"

export type ReleaseRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export type ReleaseCandidateStatus =
  | "BLOCKED"
  | "PARTIAL"
  | "READY_FOR_RC"
  | "READY_FOR_V1"

export type ReleaseScorecard = {
  ok: true
  readOnly: true
  writesToPrisma: false
  releaseScore: number
  guardCoverage: number
  negativeCoverage: number
  riskLevel: ReleaseRiskLevel
  candidateStatus: ReleaseCandidateStatus
  productionBlockers: string[]
  recommendation: string
}

export function buildReleaseScorecard(): ReleaseScorecard {
  const coverage = buildGuardCoverageReport()
  const negative = buildHttpNegativeTestSuite()
  const blockers = buildProductionBlockerReport()
  const startup = buildStartupGate()
  const blockerPenalty = blockers.critical * 7 + blockers.high * 4
  const releaseScore = Math.max(
    0,
    Math.round(
      [
        coverage.guardCoverage,
        negative.negativeCoverage,
        coverage.approvalCoverage,
        coverage.executionCoverage,
        startup.score,
      ].reduce((sum, score) => sum + score, 0) / 5
    ) - blockerPenalty
  )
  const riskLevel: ReleaseRiskLevel =
    blockers.critical > 0
      ? "CRITICAL"
      : blockers.high > 0
        ? "HIGH"
        : releaseScore >= 90
          ? "LOW"
          : "MEDIUM"
  const candidateStatus: ReleaseCandidateStatus =
    releaseScore >= 92 && blockers.requiredForV1 === 0
      ? "READY_FOR_V1"
      : releaseScore >= 82
        ? "READY_FOR_RC"
        : releaseScore >= 70
          ? "PARTIAL"
          : "BLOCKED"

  return {
    ok: true,
    readOnly: true,
    writesToPrisma: false,
    releaseScore,
    guardCoverage: coverage.guardCoverage,
    negativeCoverage: negative.negativeCoverage,
    riskLevel,
    candidateStatus,
    productionBlockers: blockers.blockers.map((blocker) => blocker.summary),
    recommendation:
      candidateStatus === "READY_FOR_V1"
        ? "Prepare final V1 release approval."
        : "RC-6 should add automated non-mutating guardrail checks and enforcement plans for auth, authorization, rate limits, and publishing/social route negative tests.",
  }
}
