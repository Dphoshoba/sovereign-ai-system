import { evaluateCrossTenantLeakageRisk } from "./cross-tenant-risk"
import { evaluateOrganizationBoundaries } from "./organization-guard"
import { evaluatePolicySegregation } from "./policy-isolation"
import { evaluateTenantIsolation } from "./tenant-guard"
import { evaluateWorkspaceContainment } from "./workspace-guard"
import { evaluateTenantIsolationReadiness } from "./workspace-isolation"

export type EnterpriseBoundaryValidation = {
  validForPlanning: true
  validForExecution: false
  warnings: string[]
  errors: string[]
  checks: {
    tenantIsolation: ReturnType<typeof evaluateTenantIsolation>
    workspaceContainment: ReturnType<typeof evaluateWorkspaceContainment>
    organizationBoundaries: ReturnType<typeof evaluateOrganizationBoundaries>
    policySegregation: ReturnType<typeof evaluatePolicySegregation>
    workspaceIsolation: ReturnType<typeof evaluateTenantIsolationReadiness>
    crossTenantRisk: ReturnType<typeof evaluateCrossTenantLeakageRisk>
  }
}

export function validateEnterpriseBoundaries(): EnterpriseBoundaryValidation {
  const checks = {
    tenantIsolation: evaluateTenantIsolation(),
    workspaceContainment: evaluateWorkspaceContainment(),
    organizationBoundaries: evaluateOrganizationBoundaries(),
    policySegregation: evaluatePolicySegregation(),
    workspaceIsolation: evaluateTenantIsolationReadiness(),
    crossTenantRisk: evaluateCrossTenantLeakageRisk(),
  }

  return {
    validForPlanning: true,
    validForExecution: false,
    warnings: [
      "Tenant guards are report-only contracts.",
      "Authentication and membership are not integrated.",
      "Shared knowledge reads require future route guard enforcement.",
      "Legacy enterprise governance write routes remain outside EA-3.",
    ],
    errors: [],
    checks,
  }
}

