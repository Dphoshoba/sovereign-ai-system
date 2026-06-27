export type EnterpriseIdentityType =
  | "operator"
  | "reviewer"
  | "administrator"
  | "system"

export type EnterpriseIdentityStatus =
  | "CONTRACT_ONLY"
  | "PROVIDER_REQUIRED"
  | "BLOCKED_FOR_RUNTIME"

export type EnterpriseIdentityModel = {
  id: string
  type: EnterpriseIdentityType
  requiredClaims: string[]
  requiredTenantScope: boolean
  requiredWorkspaceScope: boolean
  status: EnterpriseIdentityStatus
}

export function buildEnterpriseIdentityModels(): EnterpriseIdentityModel[] {
  return [
    {
      id: "identity-operator",
      type: "operator",
      requiredClaims: ["actorId", "organizationId", "role", "permissions"],
      requiredTenantScope: true,
      requiredWorkspaceScope: true,
      status: "CONTRACT_ONLY",
    },
    {
      id: "identity-reviewer",
      type: "reviewer",
      requiredClaims: ["actorId", "organizationId", "reviewScopes", "role"],
      requiredTenantScope: true,
      requiredWorkspaceScope: true,
      status: "CONTRACT_ONLY",
    },
    {
      id: "identity-administrator",
      type: "administrator",
      requiredClaims: ["actorId", "organizationId", "adminScopes", "role"],
      requiredTenantScope: true,
      requiredWorkspaceScope: false,
      status: "PROVIDER_REQUIRED",
    },
    {
      id: "identity-system",
      type: "system",
      requiredClaims: ["serviceId", "organizationId", "executionBoundary"],
      requiredTenantScope: true,
      requiredWorkspaceScope: false,
      status: "BLOCKED_FOR_RUNTIME",
    },
  ]
}

export function evaluateIdentityReadiness(
  identities: EnterpriseIdentityModel[] = buildEnterpriseIdentityModels()
) {
  const scopedIdentities = identities.filter(
    (identity) => identity.requiredTenantScope
  ).length
  const contractReady = identities.filter(
    (identity) => identity.status === "CONTRACT_ONLY"
  ).length
  const score = Math.round(
    ((scopedIdentities / identities.length) * 55) +
      ((contractReady / identities.length) * 35)
  )

  return {
    score,
    status: "IDENTITY_CONTRACT_READY_NOT_ENFORCED" as const,
    identityCount: identities.length,
    scopedIdentities,
    providerRequired: true,
  }
}
