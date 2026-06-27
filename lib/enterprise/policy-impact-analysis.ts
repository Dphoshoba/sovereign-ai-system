export type PolicyImpactAnalysis = {
  id: string
  policyId: string
  affectedAreas: string[]
  riskSummary: string
  requiresReview: true
  executionImpact: "none-preview-only"
  persistence: false
}

export function buildPolicyImpactAnalyses(): PolicyImpactAnalysis[] {
  return [
    {
      id: "tenant-scope-impact",
      policyId: "policy-tenant-scope-required",
      affectedAreas: ["operator actions", "graph writes", "publishing", "mission execution"],
      riskSummary: "Missing tenant scope could allow cross-tenant operations after future execution is enabled.",
      requiresReview: true,
      executionImpact: "none-preview-only",
      persistence: false,
    },
    {
      id: "workspace-isolation-impact",
      policyId: "policy-workspace-isolation",
      affectedAreas: ["shared knowledge", "workspace reads", "future writes"],
      riskSummary: "Workspace isolation must be enforced before shared knowledge write exceptions.",
      requiresReview: true,
      executionImpact: "none-preview-only",
      persistence: false,
    },
  ]
}

export function evaluateImpactReadiness(
  analyses: PolicyImpactAnalysis[] = buildPolicyImpactAnalyses()
) {
  const allReviewRequired = analyses.every((analysis) => analysis.requiresReview)
  const allPreviewOnly = analyses.every(
    (analysis) => analysis.executionImpact === "none-preview-only"
  )
  const noPersistence = analyses.every((analysis) => analysis.persistence === false)

  return {
    score: allReviewRequired && allPreviewOnly && noPersistence ? 100 : 50,
    status: "POLICY_IMPACT_PREVIEW_READY" as const,
    analysisCount: analyses.length,
    persistence: false,
    execution: false,
  }
}

