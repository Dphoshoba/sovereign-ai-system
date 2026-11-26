import { evaluateOperatorBoundaryReadiness } from "./operator-boundary"
import { evaluateTenantEnforcement } from "./tenant-enforcement"

export function buildBoundaryCoverage() {
  const tenant = evaluateTenantEnforcement()
  const operator = evaluateOperatorBoundaryReadiness()
  const boundaryCoverage = Math.round((tenant.score + operator.score + 78) / 3)

  return {
    score: boundaryCoverage,
    status: "BOUNDARIES_PLANNED_REPORT_ONLY" as const,
    tenantBoundaryScore: tenant.score,
    operatorBoundaryScore: operator.score,
    sharedKnowledgeBoundaryScore: 78,
    runtimeEnforcement: false,
  }
}
