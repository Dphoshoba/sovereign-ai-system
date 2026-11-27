export type ProviderCandidate = {
  id: string
  name: "Auth0" | "Clerk" | "Supabase Auth" | "Custom OIDC"
  tenancySupport: "strong" | "medium" | "needs-customization"
  claimMapping: "strong" | "medium" | "weak"
  operationalComplexity: "low" | "medium" | "high"
  enterpriseFit: number
  installBlockedInEb6: true
}

export function buildProviderComparisons(): ProviderCandidate[] {
  return [
    {
      id: "provider-auth0",
      name: "Auth0",
      tenancySupport: "strong",
      claimMapping: "strong",
      operationalComplexity: "medium",
      enterpriseFit: 90,
      installBlockedInEb6: true,
    },
    {
      id: "provider-clerk",
      name: "Clerk",
      tenancySupport: "medium",
      claimMapping: "medium",
      operationalComplexity: "low",
      enterpriseFit: 78,
      installBlockedInEb6: true,
    },
    {
      id: "provider-supabase-auth",
      name: "Supabase Auth",
      tenancySupport: "medium",
      claimMapping: "medium",
      operationalComplexity: "low",
      enterpriseFit: 74,
      installBlockedInEb6: true,
    },
    {
      id: "provider-custom-oidc",
      name: "Custom OIDC",
      tenancySupport: "needs-customization",
      claimMapping: "weak",
      operationalComplexity: "high",
      enterpriseFit: 60,
      installBlockedInEb6: true,
    },
  ]
}

export function evaluateProviderCoverage(
  comparisons: ProviderCandidate[] = buildProviderComparisons()
) {
  const tenancyStrong = comparisons.filter(
    (provider) => provider.tenancySupport === "strong"
  ).length
  const claimReady = comparisons.filter(
    (provider) => provider.claimMapping !== "weak"
  ).length
  const blocked = comparisons.filter((provider) => provider.installBlockedInEb6).length
  const avgFit = Math.round(
    comparisons.reduce((sum, provider) => sum + provider.enterpriseFit, 0) /
      comparisons.length
  )

  return {
    score: Math.round(
      (tenancyStrong / comparisons.length) * 25 +
        (claimReady / comparisons.length) * 30 +
        (blocked / comparisons.length) * 20 +
        avgFit * 0.25
    ),
    status: "PROVIDER_COMPARISON_READY_REPORT_ONLY" as const,
    recommendation: "DEFER_INSTALLATION_SELECT_IN_EB7" as const,
    candidateCount: comparisons.length,
    installBlockedInEb6: true,
  }
}
