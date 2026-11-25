import {
  buildEnterpriseGapAnalysis,
  evaluateEnterpriseGaps,
} from "./enterprise-gap-analysis"
import {
  buildEnterpriseRoadmapAudit,
  evaluateEnterpriseRoadmapCoverage,
} from "./enterprise-roadmap-audit"
import { buildEnterpriseRiskReview, evaluateEnterpriseRisk } from "./enterprise-risk-review"

export function buildEnterpriseBetaReadiness() {
  const gaps = evaluateEnterpriseGaps(buildEnterpriseGapAnalysis())
  const roadmap = evaluateEnterpriseRoadmapCoverage(buildEnterpriseRoadmapAudit())
  const risk = evaluateEnterpriseRisk(buildEnterpriseRiskReview())
  const betaReadinessScore = Math.round(
    [gaps.score, roadmap.score, 100 - risk.enterpriseRiskScore].reduce(
      (sum, score) => sum + score,
      0
    ) / 3
  )

  return {
    betaReadinessScore,
    status: "BETA_PLANNED_NOT_ENABLED" as const,
    blockers: [
      "Authentication provider must be selected and integrated.",
      "Tenant and workspace guards must become enforceable.",
      "Rate limits must move from policy to runtime enforcement.",
      "Audit evidence persistence must be approved and implemented.",
      "Execution, publishing, graph writes, and OpenAI remain unavailable.",
    ],
    recommendedBetaEntry:
      "Begin Enterprise Beta only after auth, route guards, audit persistence, and release gates are approved for implementation.",
  }
}
