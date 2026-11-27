export type PromotionCriterion = {
  id: string
  name: string
  requiredScore: number
  source: string
  promotionStage: "preview-to-staging" | "staging-to-production"
  productionBlocking: boolean
}

export function buildPromotionCriteria(): PromotionCriterion[] {
  return [
    {
      id: "enterprise-safety-score",
      name: "Enterprise safety score",
      requiredScore: 95,
      source: "enterprise guards",
      promotionStage: "preview-to-staging",
      productionBlocking: true,
    },
    {
      id: "policy-control-score",
      name: "Policy control score",
      requiredScore: 95,
      source: "enterprise policies",
      promotionStage: "preview-to-staging",
      productionBlocking: true,
    },
    {
      id: "auth-enforcement",
      name: "Authentication enforcement",
      requiredScore: 100,
      source: "future security implementation",
      promotionStage: "staging-to-production",
      productionBlocking: true,
    },
    {
      id: "telemetry-readiness",
      name: "Telemetry readiness",
      requiredScore: 100,
      source: "future observability implementation",
      promotionStage: "staging-to-production",
      productionBlocking: true,
    },
  ]
}

export function evaluatePromotionReadiness(
  criteria: PromotionCriterion[] = buildPromotionCriteria()
) {
  const allHaveScores = criteria.every((criterion) => criterion.requiredScore > 0)
  const productionCriteriaBlocking = criteria
    .filter((criterion) => criterion.promotionStage === "staging-to-production")
    .every((criterion) => criterion.productionBlocking)
  const hasPreviewAndProduction = ["preview-to-staging", "staging-to-production"].every((stage) =>
    criteria.some((criterion) => criterion.promotionStage === stage)
  )
  const checks = [allHaveScores, productionCriteriaBlocking, hasPreviewAndProduction]

  return {
    score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
    status: "PROMOTION_CRITERIA_PREVIEW_READY" as const,
    criterionCount: criteria.length,
    productionPromotionBlocked: productionCriteriaBlocking,
  }
}

