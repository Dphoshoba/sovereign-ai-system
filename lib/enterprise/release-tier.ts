export type EnterpriseReleaseTier = {
  id: string
  name: string
  requiredScore: number
  allowedEnvironmentKinds: string[]
  productionEligible: boolean
  executionAllowed: false
}

export function buildEnterpriseReleaseTiers(): EnterpriseReleaseTier[] {
  return [
    {
      id: "alpha-preview",
      name: "Alpha Preview",
      requiredScore: 80,
      allowedEnvironmentKinds: ["local", "preview"],
      productionEligible: false,
      executionAllowed: false,
    },
    {
      id: "enterprise-alpha",
      name: "Enterprise Alpha",
      requiredScore: 90,
      allowedEnvironmentKinds: ["preview", "staging"],
      productionEligible: false,
      executionAllowed: false,
    },
    {
      id: "production-candidate",
      name: "Production Candidate",
      requiredScore: 98,
      allowedEnvironmentKinds: ["staging"],
      productionEligible: false,
      executionAllowed: false,
    },
  ]
}

export function evaluateReleaseTierReadiness(
  tiers: EnterpriseReleaseTier[] = buildEnterpriseReleaseTiers()
) {
  const allNonExecuting = tiers.every((tier) => tier.executionAllowed === false)
  const productionBlocked = tiers.every((tier) => tier.productionEligible === false)
  const hasThresholds = tiers.every((tier) => tier.requiredScore > 0)
  const checks = [allNonExecuting, productionBlocked, hasThresholds]

  return {
    score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
    status: "RELEASE_TIERS_PREVIEW_READY" as const,
    tierCount: tiers.length,
    productionEligible: false,
  }
}

