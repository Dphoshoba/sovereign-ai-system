import { buildCrossTenantRiskFactors, evaluateCrossTenantLeakageRisk } from "./cross-tenant-risk"
import { buildOrganizationGuardRules, evaluateOrganizationBoundaries } from "./organization-guard"
import { buildPolicyIsolationRules, evaluatePolicySegregation } from "./policy-isolation"
import { buildTenantGuardRules, evaluateTenantIsolation } from "./tenant-guard"
import { buildWorkspaceGuardRules, evaluateWorkspaceContainment } from "./workspace-guard"
import {
  buildWorkspaceIsolationRules,
  evaluateTenantIsolationReadiness,
} from "./workspace-isolation"

export function buildEnterpriseIsolationAudit() {
  const tenantGuardRules = buildTenantGuardRules()
  const workspaceGuardRules = buildWorkspaceGuardRules()
  const organizationGuardRules = buildOrganizationGuardRules()
  const policyIsolationRules = buildPolicyIsolationRules()
  const workspaceIsolationRules = buildWorkspaceIsolationRules()
  const crossTenantRiskFactors = buildCrossTenantRiskFactors()

  const tenantIsolation = evaluateTenantIsolation(tenantGuardRules)
  const workspaceContainment = evaluateWorkspaceContainment(workspaceGuardRules)
  const organizationBoundaries = evaluateOrganizationBoundaries(organizationGuardRules)
  const policySegregation = evaluatePolicySegregation(policyIsolationRules)
  const workspaceIsolation = evaluateTenantIsolationReadiness(workspaceIsolationRules)
  const crossTenantRisk = evaluateCrossTenantLeakageRisk(crossTenantRiskFactors)

  return {
    tenantGuardRules,
    workspaceGuardRules,
    organizationGuardRules,
    policyIsolationRules,
    workspaceIsolationRules,
    crossTenantRiskFactors,
    evaluations: {
      tenantIsolation,
      workspaceContainment,
      organizationBoundaries,
      policySegregation,
      workspaceIsolation,
      crossTenantRisk,
    },
  }
}

