import { buildEnterpriseFoundationPlan } from "./enterprise-foundation"

export type EnterpriseAlphaReadinessStatus = "READY_FOR_EA2_PLANNING" | "BLOCKED_FOR_EXECUTION"

export type EnterpriseAlphaReadiness = ReturnType<typeof buildEnterpriseFoundationPlan> & {
  enterpriseReadinessScore: number
  productionConfidence: number
  executionReadiness: "BLOCKED"
  candidateStatus: EnterpriseAlphaReadinessStatus
  criticalBlockers: string[]
}

export function buildEnterpriseAlphaReadiness(): EnterpriseAlphaReadiness {
  const plan = buildEnterpriseFoundationPlan()

  return {
    ...plan,
    enterpriseReadinessScore: 68,
    productionConfidence: 58,
    executionReadiness: "BLOCKED",
    candidateStatus: "READY_FOR_EA2_PLANNING",
    criticalBlockers: [
      "Enterprise auth provider is not integrated.",
      "Tenant and workspace route guards are not enforced.",
      "Legacy enterprise-governance routes contain Prisma writes and need separate audit before reuse.",
      "Rate limits are defined elsewhere but not enforced.",
      "Enterprise audit persistence taxonomy is not approved.",
      "Graph, publishing, OpenAI, and operator execution remain intentionally blocked.",
    ],
  }
}

export function summarizeEnterpriseAlphaReadiness(
  readiness: EnterpriseAlphaReadiness = buildEnterpriseAlphaReadiness()
) {
  return {
    enterpriseReadinessScore: readiness.enterpriseReadinessScore,
    productionConfidence: readiness.productionConfidence,
    executionReadiness: readiness.executionReadiness,
    candidateStatus: readiness.candidateStatus,
    blockedCapabilityCount: readiness.blockedCapabilities.length,
    criticalBlockerCount: readiness.criticalBlockers.length,
    recommendedNextStep: readiness.recommendedNextSteps[0],
  }
}

