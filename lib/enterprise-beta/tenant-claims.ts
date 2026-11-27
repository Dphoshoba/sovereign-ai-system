export type TenantClaim = {
  key: string
  required: boolean
  source: "identity-provider" | "membership-store" | "policy-engine"
  purpose: string
}

export function buildTenantClaims(): TenantClaim[] {
  return [
    {
      key: "actorId",
      required: true,
      source: "identity-provider",
      purpose: "Identifies the human or service actor.",
    },
    {
      key: "organizationId",
      required: true,
      source: "membership-store",
      purpose: "Locks every request to one enterprise tenant.",
    },
    {
      key: "workspaceIds",
      required: true,
      source: "membership-store",
      purpose: "Constrains workspace-level access.",
    },
    {
      key: "role",
      required: true,
      source: "policy-engine",
      purpose: "Maps identity to enterprise role permissions.",
    },
    {
      key: "approvalScopes",
      required: true,
      source: "policy-engine",
      purpose: "Limits review and approval authority.",
    },
  ]
}

export function evaluateTenantClaimReadiness(
  claims: TenantClaim[] = buildTenantClaims()
) {
  const required = claims.filter((claim) => claim.required).length
  const sourceCoverage = new Set(claims.map((claim) => claim.source)).size
  const score = Math.round((required / claims.length) * 65 + sourceCoverage * 10)

  return {
    score,
    status: "TENANT_CLAIMS_DEFINED_NOT_ASSERTED" as const,
    claimCount: claims.length,
    required,
  }
}
