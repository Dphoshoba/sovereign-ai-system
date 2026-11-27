export type ClaimValidationRule = {
  id: string
  claim:
    | "organizationId"
    | "workspaceId"
    | "actorId"
    | "membershipRole"
    | "entitlementTier"
    | "environment"
  validationMode: "required" | "enum" | "scope-bound"
  failureAction: "deny" | "defer-to-approval" | "report-only-alert"
  runtimeEnabled: false
}

export function buildClaimValidationRules(): ClaimValidationRule[] {
  return [
    {
      id: "claim-validation-organization",
      claim: "organizationId",
      validationMode: "required",
      failureAction: "deny",
      runtimeEnabled: false,
    },
    {
      id: "claim-validation-workspace",
      claim: "workspaceId",
      validationMode: "scope-bound",
      failureAction: "deny",
      runtimeEnabled: false,
    },
    {
      id: "claim-validation-actor",
      claim: "actorId",
      validationMode: "required",
      failureAction: "deny",
      runtimeEnabled: false,
    },
    {
      id: "claim-validation-role",
      claim: "membershipRole",
      validationMode: "enum",
      failureAction: "defer-to-approval",
      runtimeEnabled: false,
    },
    {
      id: "claim-validation-entitlement",
      claim: "entitlementTier",
      validationMode: "enum",
      failureAction: "report-only-alert",
      runtimeEnabled: false,
    },
    {
      id: "claim-validation-environment",
      claim: "environment",
      validationMode: "enum",
      failureAction: "deny",
      runtimeEnabled: false,
    },
  ]
}

export function evaluateClaimValidationCoverage(
  rules: ClaimValidationRule[] = buildClaimValidationRules()
) {
  const denyRules = rules.filter((rule) => rule.failureAction === "deny").length
  const scopeRules = rules.filter((rule) => rule.validationMode === "scope-bound").length

  return {
    score: Math.round((denyRules / rules.length) * 45 + (scopeRules > 0 ? 35 : 0) + 15),
    status: "CLAIM_VALIDATION_DEFINED_REPORT_ONLY" as const,
    ruleCount: rules.length,
    runtimeEnabled: false,
  }
}
