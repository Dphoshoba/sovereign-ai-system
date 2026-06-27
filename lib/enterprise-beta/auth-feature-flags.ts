export type AuthFeatureFlagBoundary = {
  id: string
  flag:
    | "auth_dry_run_enabled"
    | "auth_claim_shadow_validation"
    | "auth_tenant_cutover_simulation"
    | "auth_rollback_simulation"
  defaultState: "disabled"
  required: boolean
  reportOnly: true
}

export function buildAuthFeatureFlagBoundaries(): AuthFeatureFlagBoundary[] {
  return [
    {
      id: "flag-auth-dry-run-enabled",
      flag: "auth_dry_run_enabled",
      defaultState: "disabled",
      required: true,
      reportOnly: true,
    },
    {
      id: "flag-auth-claim-shadow-validation",
      flag: "auth_claim_shadow_validation",
      defaultState: "disabled",
      required: true,
      reportOnly: true,
    },
    {
      id: "flag-auth-tenant-cutover-simulation",
      flag: "auth_tenant_cutover_simulation",
      defaultState: "disabled",
      required: true,
      reportOnly: true,
    },
    {
      id: "flag-auth-rollback-simulation",
      flag: "auth_rollback_simulation",
      defaultState: "disabled",
      required: true,
      reportOnly: true,
    },
  ]
}

export function evaluateFeatureFlagCoverage(
  boundaries: AuthFeatureFlagBoundary[] = buildAuthFeatureFlagBoundaries()
) {
  const required = boundaries.filter((boundary) => boundary.required).length
  const disabledByDefault = boundaries.filter(
    (boundary) => boundary.defaultState === "disabled"
  ).length

  return {
    score: Math.round(
      (required / boundaries.length) * 55 + (disabledByDefault / boundaries.length) * 35
    ),
    status: "AUTH_FEATURE_FLAGS_DEFINED_REPORT_ONLY" as const,
    flagCount: boundaries.length,
  }
}
