import { buildBoundaryCoverage } from "./boundary-coverage"
import { buildEnforcementPlan, evaluateEnforcementReadiness } from "./enforcement-planning"
import { buildGuardGapAnalysis, evaluateGuardGaps } from "./guard-gap-analysis"
import {
  buildOperatorBoundaryRequirements,
  evaluateOperatorBoundaryReadiness,
} from "./operator-boundary"
import { buildRouteCoverageAreas, evaluateRouteCoverage } from "./route-coverage"
import {
  buildEnterpriseRouteGuards,
  evaluateRouteGuardReadiness,
} from "./route-guard-model"
import {
  buildTenantEnforcementRequirements,
  evaluateTenantEnforcement,
} from "./tenant-enforcement"

export function buildEnterpriseBetaGuardReadiness() {
  const routeGuards = buildEnterpriseRouteGuards()
  const coverageAreas = buildRouteCoverageAreas()
  const tenantRequirements = buildTenantEnforcementRequirements()
  const operatorBoundaries = buildOperatorBoundaryRequirements()
  const guardGaps = buildGuardGapAnalysis()
  const enforcementPlan = buildEnforcementPlan()

  const guardReadiness = evaluateRouteGuardReadiness(routeGuards)
  const routeCoverage = evaluateRouteCoverage(coverageAreas)
  const tenantCoverage = evaluateTenantEnforcement(tenantRequirements)
  const operatorBoundary = evaluateOperatorBoundaryReadiness(operatorBoundaries)
  const boundaryCoverage = buildBoundaryCoverage()
  const gapAnalysis = evaluateGuardGaps(guardGaps)
  const enforcementReadiness = evaluateEnforcementReadiness(enforcementPlan)

  const guardScore = Math.round(
    [guardReadiness.score, routeCoverage.score, boundaryCoverage.score].reduce(
      (sum, score) => sum + score,
      0
    ) / 3
  )
  const tenantScore = tenantCoverage.score
  const coverageScore = routeCoverage.score
  const enforcementScore = enforcementReadiness.score
  const betaReadiness = Math.round(
    [
      guardScore,
      tenantScore,
      coverageScore,
      enforcementScore,
      gapAnalysis.score,
    ].reduce((sum, score) => sum + score, 0) / 5
  )

  return {
    ok: true,
    readOnly: true,
    previewOnly: true,
    reportOnly: true,
    middleware: false,
    persistence: false,
    writesToPrisma: false,
    databaseWrites: false,
    schemaChanges: false,
    migrations: false,
    execution: false,
    publishing: false,
    graphWrites: false,
    graphDeletes: false,
    openAiCalls: false,
    authIntegration: false,
    providerInstallation: false,
    sessionsEnabled: false,
    jwtIssued: false,
    guardScore,
    tenantScore,
    coverageScore,
    enforcementScore,
    betaReadiness,
    routeCoverage: routeCoverage.score,
    tenantCoverage: tenantCoverage.score,
    boundaryCoverage: boundaryCoverage.score,
    guardReadiness: guardReadiness.score,
    enforcementReadiness: enforcementReadiness.score,
    recommendedEB3:
      "EB-3 should define report-only audit hooks and guard decision evidence packets before any middleware, sessions, JWT, provider integration, or enforcement.",
    routeGuards,
    coverageAreas,
    tenantRequirements,
    operatorBoundaries,
    guardGaps,
    enforcementPlan,
    evaluations: {
      guardReadiness,
      routeCoverage,
      tenantCoverage,
      operatorBoundary,
      boundaryCoverage,
      gapAnalysis,
      enforcementReadiness,
    },
  }
}
