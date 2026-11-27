import { validateEnterpriseBoundaries } from "./enterprise-boundary-validator"
import { buildEnterpriseIsolationAudit } from "./enterprise-isolation-audit"

export function buildEnterpriseGuardReadinessAudit() {
  const isolationAudit = buildEnterpriseIsolationAudit()
  const boundaryValidation = validateEnterpriseBoundaries()
  const {
    tenantIsolation,
    workspaceContainment,
    organizationBoundaries,
    policySegregation,
    workspaceIsolation,
    crossTenantRisk,
  } = isolationAudit.evaluations

  const guardCoverage = Math.round(
    [
      tenantIsolation.score,
      workspaceContainment.score,
      organizationBoundaries.score,
      policySegregation.score,
      workspaceIsolation.score,
    ].reduce((sum, score) => sum + score, 0) / 5
  )
  const enterpriseSafetyScore = Math.round(
    (guardCoverage * 0.75 + (100 - crossTenantRisk.score) * 0.25)
  )

  return {
    ok: true,
    readOnly: true,
    planningOnly: true,
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
    providerIntegration: false,
    sessions: false,
    jwt: false,
    guardCoverage,
    tenantIsolationScore: tenantIsolation.score,
    workspaceBoundaryScore: workspaceContainment.score,
    organizationBoundaryScore: organizationBoundaries.score,
    policyCoverage: policySegregation.score,
    crossTenantRiskScore: crossTenantRisk.score,
    enterpriseSafetyScore,
    sharedKnowledgeConstraints: {
      status: "READ_ONLY_CONTRACT_WRITES_BLOCKED" as const,
      writesBlocked: true,
      crossWorkspaceWritesBlocked: true,
      requiresFutureApproval: true,
    },
    recommendedEA4:
      "EA-4 should define enterprise audit event taxonomy and report-only guard evidence capture without adding persistence or execution.",
    isolationAudit,
    boundaryValidation,
  }
}

