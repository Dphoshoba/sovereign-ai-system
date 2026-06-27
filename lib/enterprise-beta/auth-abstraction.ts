export type AuthAbstractionFunction =
  | "resolveOperatorIdentity"
  | "requireEnterpriseRole"
  | "requireEnterprisePermission"
  | "resolveTenantClaims"
  | "buildPermissionContext"

export type AuthAbstractionContract = {
  name: AuthAbstractionFunction
  mode: "CONTRACT_ONLY"
  executesAuth: false
  requiredBeforeBetaExecution: boolean
}

export function buildAuthAbstractionContracts(): AuthAbstractionContract[] {
  return [
    "resolveOperatorIdentity",
    "requireEnterpriseRole",
    "requireEnterprisePermission",
    "resolveTenantClaims",
    "buildPermissionContext",
  ].map((name) => ({
    name: name as AuthAbstractionFunction,
    mode: "CONTRACT_ONLY" as const,
    executesAuth: false as const,
    requiredBeforeBetaExecution: true,
  }))
}

export function evaluateAuthAbstractionReadiness(
  contracts: AuthAbstractionContract[] = buildAuthAbstractionContracts()
) {
  const covered = contracts.filter(
    (contract) => contract.requiredBeforeBetaExecution && !contract.executesAuth
  ).length

  return {
    score: Math.round((covered / contracts.length) * 78),
    status: "AUTH_ABSTRACTION_DEFINED_NOT_ENFORCED" as const,
    contractCount: contracts.length,
  }
}
