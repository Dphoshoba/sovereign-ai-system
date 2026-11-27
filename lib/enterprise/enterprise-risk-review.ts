export type EnterpriseRisk = {
  id: string
  title: string
  likelihood: 1 | 2 | 3 | 4 | 5
  impact: 1 | 2 | 3 | 4 | 5
  mitigation: string
  acceptedForAlpha: boolean
}

export function buildEnterpriseRiskReview(): EnterpriseRisk[] {
  return [
    {
      id: "risk-contracts-not-enforced",
      title: "Enterprise contracts are not yet enforced at runtime.",
      likelihood: 4,
      impact: 4,
      mitigation: "Keep all enterprise execution unavailable until auth, tenant guards, and rate limits are enforced.",
      acceptedForAlpha: true,
    },
    {
      id: "risk-audit-not-persisted",
      title: "Audit evidence is explainable but not persisted.",
      likelihood: 3,
      impact: 3,
      mitigation: "Require persisted evidence before Enterprise Beta execution controls.",
      acceptedForAlpha: true,
    },
    {
      id: "risk-main-merge-surface",
      title: "Enterprise Alpha adds many read-only modules and docs to the main surface.",
      likelihood: 2,
      impact: 3,
      mitigation: "Merge only after build, smoke, endpoint, and safety flag verification.",
      acceptedForAlpha: true,
    },
    {
      id: "risk-provider-choice",
      title: "Auth provider choice could reshape operator and tenant contracts.",
      likelihood: 3,
      impact: 4,
      mitigation: "Use RC-6 provider evaluation before implementing provider-specific code.",
      acceptedForAlpha: true,
    },
  ]
}

export function evaluateEnterpriseRisk(risks: EnterpriseRisk[] = buildEnterpriseRiskReview()) {
  const rawRisk = risks.reduce((sum, risk) => sum + risk.likelihood * risk.impact, 0)
  const maxRisk = risks.length * 25
  const enterpriseRiskScore = Math.round((rawRisk / maxRisk) * 100)

  return {
    enterpriseRiskScore,
    status: enterpriseRiskScore <= 35 ? "MODERATE_CONTROLLED_RISK" as const : "ELEVATED_RISK" as const,
    riskCount: risks.length,
    acceptedForAlphaCount: risks.filter((risk) => risk.acceptedForAlpha).length,
    highestRisk: risks.reduce((highest, risk) =>
      risk.likelihood * risk.impact > highest.likelihood * highest.impact ? risk : highest
    ),
  }
}
