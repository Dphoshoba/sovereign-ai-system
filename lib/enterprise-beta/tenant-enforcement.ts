export type TenantEnforcementRequirement = {
  id: string
  name: string
  requiredClaim: string
  appliesTo: string[]
  enforcementMode: "PLANNED"
  runtimeActive: false
}

export function buildTenantEnforcementRequirements(): TenantEnforcementRequirement[] {
  return [
    {
      id: "tenant-organization-required",
      name: "Organization scope required",
      requiredClaim: "organizationId",
      appliesTo: ["all enterprise routes", "operator routes", "graph routes"],
      enforcementMode: "PLANNED",
      runtimeActive: false,
    },
    {
      id: "tenant-workspace-required",
      name: "Workspace scope required",
      requiredClaim: "workspaceIds",
      appliesTo: ["ontology", "content", "research", "graph"],
      enforcementMode: "PLANNED",
      runtimeActive: false,
    },
    {
      id: "tenant-approval-scope",
      name: "Approval scope required for high-risk actions",
      requiredClaim: "approvalScopes",
      appliesTo: ["publishing", "graph writes", "operator actions"],
      enforcementMode: "PLANNED",
      runtimeActive: false,
    },
  ]
}

export function evaluateTenantEnforcement(
  requirements: TenantEnforcementRequirement[] = buildTenantEnforcementRequirements()
) {
  const coverage = requirements.filter((requirement) => requirement.requiredClaim).length

  return {
    score: Math.round((coverage / requirements.length) * 88),
    status: "TENANT_ENFORCEMENT_PLANNED_NOT_ACTIVE" as const,
    requirementCount: requirements.length,
    runtimeActive: false,
  }
}
