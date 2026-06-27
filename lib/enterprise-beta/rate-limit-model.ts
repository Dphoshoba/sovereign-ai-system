export type RateLimitRiskTier = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export type EnterpriseRateLimit = {
  id: string
  routeGroup: string
  riskTier: RateLimitRiskTier
  window: "minute" | "hour" | "day"
  recommendedLimit: number
  burstLimit: number
  enforcementMode: "PREVIEW_ONLY"
  runtimeActive: false
}

export function buildEnterpriseRateLimits(): EnterpriseRateLimit[] {
  return [
    {
      id: "rate-preview-routes",
      routeGroup: "preview-readiness",
      riskTier: "LOW",
      window: "minute",
      recommendedLimit: 120,
      burstLimit: 180,
      enforcementMode: "PREVIEW_ONLY",
      runtimeActive: false,
    },
    {
      id: "rate-intent-routes",
      routeGroup: "operator-intent",
      riskTier: "HIGH",
      window: "minute",
      recommendedLimit: 20,
      burstLimit: 30,
      enforcementMode: "PREVIEW_ONLY",
      runtimeActive: false,
    },
    {
      id: "rate-review-package-routes",
      routeGroup: "review-package-creation",
      riskTier: "HIGH",
      window: "hour",
      recommendedLimit: 40,
      burstLimit: 60,
      enforcementMode: "PREVIEW_ONLY",
      runtimeActive: false,
    },
    {
      id: "rate-future-execution-routes",
      routeGroup: "future-execution",
      riskTier: "CRITICAL",
      window: "hour",
      recommendedLimit: 5,
      burstLimit: 8,
      enforcementMode: "PREVIEW_ONLY",
      runtimeActive: false,
    },
  ]
}

export function evaluateRateLimitCoverage(
  limits: EnterpriseRateLimit[] = buildEnterpriseRateLimits()
) {
  const criticalCovered = limits.filter((limit) => limit.riskTier === "CRITICAL").length
  const previewOnly = limits.every((limit) => !limit.runtimeActive)

  return {
    score: Math.round((limits.length / 4) * 72 + criticalCovered * 8),
    status: "RATE_LIMITS_MODELED_NOT_ENFORCED" as const,
    limitCount: limits.length,
    previewOnly,
    runtimeActive: false,
  }
}
