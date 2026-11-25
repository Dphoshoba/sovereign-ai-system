import { buildEnterpriseOrganizationHierarchy } from "./organization-hierarchy"

export type OrganizationGuardRule = {
  id: string
  organizationId: string
  boundary: "single-organization"
  departmentScopeRequired: boolean
  teamScopeRequired: boolean
  projectScopeRequired: boolean
  mode: "report-only"
  executionAllowed: false
}

export function buildOrganizationGuardRules(): OrganizationGuardRule[] {
  const organization = buildEnterpriseOrganizationHierarchy()

  return [
    {
      id: `${organization.id}-organization-boundary`,
      organizationId: organization.id,
      boundary: "single-organization",
      departmentScopeRequired: true,
      teamScopeRequired: true,
      projectScopeRequired: true,
      mode: "report-only",
      executionAllowed: false,
    },
  ]
}

export function evaluateOrganizationBoundaries(
  rules: OrganizationGuardRule[] = buildOrganizationGuardRules()
) {
  const allReportOnly = rules.every((rule) => rule.mode === "report-only")
  const allExecutionBlocked = rules.every((rule) => rule.executionAllowed === false)
  const scoped = rules.every(
    (rule) =>
      rule.departmentScopeRequired &&
      rule.teamScopeRequired &&
      rule.projectScopeRequired
  )
  const checks = [allReportOnly, allExecutionBlocked, scoped]

  return {
    score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
    status: "ORGANIZATION_BOUNDARIES_DEFINED" as const,
    ruleCount: rules.length,
    allExecutionBlocked,
    scoped,
  }
}

