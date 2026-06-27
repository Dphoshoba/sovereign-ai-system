import { evaluateOperatorQuotaCoverage } from "./operator-quota"
import { evaluateTenantQuotaCoverage } from "./tenant-quota"
import { evaluateRateLimitCoverage } from "./rate-limit-model"

export function buildQuotaReadiness() {
  const tenant = evaluateTenantQuotaCoverage()
  const operator = evaluateOperatorQuotaCoverage()
  const rateLimits = evaluateRateLimitCoverage()
  const quotaScore = Math.round(
    [tenant.score, operator.score, rateLimits.score].reduce((sum, score) => sum + score, 0) / 3
  )

  return {
    score: quotaScore,
    status: "QUOTAS_AND_LIMITS_DEFINED_NOT_ENFORCED" as const,
    tenantQuotaScore: tenant.score,
    operatorQuotaScore: operator.score,
    rateLimitScore: rateLimits.score,
  }
}
