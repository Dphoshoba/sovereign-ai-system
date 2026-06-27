export type TenantQuota = {
  id: string
  tenantTier: "alpha" | "beta" | "enterprise" | "system"
  dailyPreviewRequests: number
  dailyIntentPackages: number
  dailyReviewPackages: number
  enforcementMode: "PLANNED"
  persisted: false
}

export function buildTenantQuotas(): TenantQuota[] {
  return [
    {
      id: "quota-alpha",
      tenantTier: "alpha",
      dailyPreviewRequests: 1000,
      dailyIntentPackages: 10,
      dailyReviewPackages: 5,
      enforcementMode: "PLANNED",
      persisted: false,
    },
    {
      id: "quota-beta",
      tenantTier: "beta",
      dailyPreviewRequests: 5000,
      dailyIntentPackages: 40,
      dailyReviewPackages: 25,
      enforcementMode: "PLANNED",
      persisted: false,
    },
    {
      id: "quota-enterprise",
      tenantTier: "enterprise",
      dailyPreviewRequests: 25000,
      dailyIntentPackages: 200,
      dailyReviewPackages: 100,
      enforcementMode: "PLANNED",
      persisted: false,
    },
  ]
}

export function evaluateTenantQuotaCoverage(quotas: TenantQuota[] = buildTenantQuotas()) {
  const complete = quotas.filter(
    (quota) =>
      quota.dailyPreviewRequests > 0 &&
      quota.dailyIntentPackages > 0 &&
      quota.dailyReviewPackages > 0
  ).length

  return {
    score: Math.round((complete / quotas.length) * 84),
    status: "TENANT_QUOTAS_DEFINED_NOT_ENFORCED" as const,
    quotaCount: quotas.length,
    persisted: false,
  }
}
