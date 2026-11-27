import { buildAbuseBoundaries, evaluateAbuseCoverage } from "./abuse-boundary"
import { buildBurstControlPolicies, evaluateBurstControlReadiness } from "./burst-control"
import { buildConsumptionMetrics, evaluateUsageCoverage } from "./consumption-accounting"
import { buildCooldownPolicies, evaluateCooldownReadiness } from "./cooldown-policy"
import { buildEscalationPolicies, evaluateEscalationReadiness } from "./escalation-policy"
import { buildOperatorQuotas } from "./operator-quota"
import { buildQuotaReadiness } from "./quota-readiness"
import { buildEnterpriseRateLimits } from "./rate-limit-model"
import { buildTenantQuotas } from "./tenant-quota"

export function buildEnterpriseBetaUsageGovernance() {
  const rateLimits = buildEnterpriseRateLimits()
  const tenantQuotas = buildTenantQuotas()
  const operatorQuotas = buildOperatorQuotas()
  const abuseBoundaries = buildAbuseBoundaries()
  const consumptionMetrics = buildConsumptionMetrics()
  const burstPolicies = buildBurstControlPolicies()
  const cooldownPolicies = buildCooldownPolicies()
  const escalationPolicies = buildEscalationPolicies()

  const quotaReadiness = buildQuotaReadiness()
  const abuseCoverage = evaluateAbuseCoverage(abuseBoundaries)
  const usageCoverage = evaluateUsageCoverage(consumptionMetrics)
  const burstReadiness = evaluateBurstControlReadiness(burstPolicies)
  const cooldownReadiness = evaluateCooldownReadiness(cooldownPolicies)
  const escalationReadiness = evaluateEscalationReadiness(escalationPolicies)

  const quotaScore = quotaReadiness.score
  const abuseScore = abuseCoverage.score
  const usageScore = usageCoverage.score
  const governanceScore = Math.round(
    [
      quotaScore,
      abuseScore,
      usageScore,
      burstReadiness.score,
      cooldownReadiness.score,
      escalationReadiness.score,
    ].reduce((sum, score) => sum + score, 0) / 6
  )
  const betaReadiness = Math.round(
    [quotaScore, abuseScore, usageScore, governanceScore].reduce(
      (sum, score) => sum + score,
      0
    ) / 4
  )

  return {
    ok: true,
    readOnly: true,
    previewOnly: true,
    reportOnly: true,
    middleware: false,
    persistence: false,
    writesToPrisma: false,
    databaseWrites: false,
    schemaChanges: false,
    migrations: false,
    execution: false,
    publishing: false,
    graphWrites: false,
    graphDeletes: false,
    openAiCalls: false,
    authIntegration: false,
    providerInstallation: false,
    sessionsEnabled: false,
    jwtIssued: false,
    quotaScore,
    abuseScore,
    usageScore,
    governanceScore,
    betaReadiness,
    quotaCoverage: quotaScore,
    abuseCoverage: abuseScore,
    usageCoverage: usageScore,
    cooldownReadiness: cooldownReadiness.score,
    escalationReadiness: escalationReadiness.score,
    governanceReadiness: governanceScore,
    recommendedEB5:
      "EB-5 should define report-only audit persistence mapping and retention planning before any database writes, middleware, provider integration, sessions, JWT, or enforcement.",
    rateLimits,
    tenantQuotas,
    operatorQuotas,
    abuseBoundaries,
    consumptionMetrics,
    burstPolicies,
    cooldownPolicies,
    escalationPolicies,
    evaluations: {
      quotaReadiness,
      abuseCoverage,
      usageCoverage,
      burstReadiness,
      cooldownReadiness,
      escalationReadiness,
    },
  }
}
