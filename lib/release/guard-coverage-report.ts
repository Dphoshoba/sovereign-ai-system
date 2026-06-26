import { buildRouteGuardAudit } from "../observability/route-guard-audit"
import { buildApprovalBoundaryAudit } from "./approval-boundary-audit"
import { buildExecutionBarrierAudit } from "./execution-barrier-audit"
import { buildHttpNegativeTestSuite } from "./http-negative-tests"

export type GuardCoverageArea = {
  area: string
  routeFamilies: string[]
  guardCoverage: number
  negativeCoverage: number
  status: "PASS" | "PARTIAL" | "NEEDS_TEST"
  gaps: string[]
}

export type GuardCoverageReport = {
  ok: true
  readOnly: true
  writesToPrisma: false
  guardCoverage: number
  negativeCoverage: number
  approvalCoverage: number
  executionCoverage: number
  areas: GuardCoverageArea[]
  gaps: string[]
}

export function buildGuardCoverageReport(): GuardCoverageReport {
  const routeGuard = buildRouteGuardAudit()
  const execution = buildExecutionBarrierAudit()
  const approvals = buildApprovalBoundaryAudit()
  const negative = buildHttpNegativeTestSuite()
  const areas: GuardCoverageArea[] = routeGuard.areas.map((area) => {
    const negativeMatches = negative.tests.filter((test) =>
      area.routes.some((route) => test.route.startsWith(route.replace("*", "")))
    )
    const negativeCoverage =
      negativeMatches.length > 0
        ? Math.round(
            negativeMatches.reduce((sum, test) => sum + test.coverage, 0) /
              negativeMatches.length
          )
        : 70

    return {
      area: area.area,
      routeFamilies: area.routes,
      guardCoverage: area.guardCoverage,
      negativeCoverage,
      status:
        area.guardCoverage >= 85 && negativeCoverage >= 85
          ? "PASS"
          : negativeCoverage < 75
            ? "NEEDS_TEST"
            : "PARTIAL",
      gaps: area.missingGuards,
    }
  })
  const guardCoverage = Math.round(
    [
      routeGuard.guardCoverage,
      execution.guardCoverage,
      approvals.approvalCoverage,
    ].reduce((sum, score) => sum + score, 0) / 3
  )

  return {
    ok: true,
    readOnly: true,
    writesToPrisma: false,
    guardCoverage,
    negativeCoverage: negative.negativeCoverage,
    approvalCoverage: approvals.approvalCoverage,
    executionCoverage: execution.guardCoverage,
    areas,
    gaps: [
      ...routeGuard.missingGuards,
      ...execution.blockers,
      ...approvals.criticalGaps,
      ...negative.gaps,
    ],
  }
}
