export type EnterprisePolicy = {
  id: string
  name: string
  domain: "tenant" | "workspace" | "membership" | "rbac" | "knowledge" | "publishing"
  enforcementMode: "contract-only"
  requiredBeforeExecution: boolean
  blockedCapabilities: string[]
  reviewRequired: boolean
}

export function buildEnterprisePolicies(): EnterprisePolicy[] {
  return [
    {
      id: "policy-tenant-scope-required",
      name: "Tenant scope required",
      domain: "tenant",
      enforcementMode: "contract-only",
      requiredBeforeExecution: true,
      blockedCapabilities: ["execution", "graph writes", "publishing"],
      reviewRequired: true,
    },
    {
      id: "policy-workspace-isolation",
      name: "Workspace isolation required",
      domain: "workspace",
      enforcementMode: "contract-only",
      requiredBeforeExecution: true,
      blockedCapabilities: ["cross-workspace writes", "shared knowledge writes"],
      reviewRequired: true,
    },
    {
      id: "policy-membership-provider-required",
      name: "Membership provider required",
      domain: "membership",
      enforcementMode: "contract-only",
      requiredBeforeExecution: true,
      blockedCapabilities: ["sessions", "JWT", "operator execution"],
      reviewRequired: true,
    },
    {
      id: "policy-knowledge-governance",
      name: "Knowledge governance required",
      domain: "knowledge",
      enforcementMode: "contract-only",
      requiredBeforeExecution: true,
      blockedCapabilities: ["graph writes", "knowledge merge", "entity upsert"],
      reviewRequired: true,
    },
    {
      id: "policy-publishing-blocked",
      name: "Publishing remains blocked",
      domain: "publishing",
      enforcementMode: "contract-only",
      requiredBeforeExecution: true,
      blockedCapabilities: ["publishing", "social posting", "email send"],
      reviewRequired: true,
    },
  ]
}

export function evaluatePolicyReadiness(
  policies: EnterprisePolicy[] = buildEnterprisePolicies()
) {
  const allContractOnly = policies.every(
    (policy) => policy.enforcementMode === "contract-only"
  )
  const allRequireReview = policies.every((policy) => policy.reviewRequired)

  return {
    score: allContractOnly && allRequireReview ? 78 : 45,
    status: "CONTRACT_READY_NOT_ENFORCED" as const,
    policyCount: policies.length,
    enforcementMode: "contract-only" as const,
  }
}

