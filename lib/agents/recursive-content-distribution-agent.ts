type IntegrityAudit = {
  agent: string
  contentType: string
  topic: string
  truthfulnessScore: number
  wisdomAlignment: number
  manipulationRisk: number
  integrityScore: number
}

type ContentDistributionInput = {
  recursiveContentIntegrityScore: number
  integrityStatus: string
  integrityAudits: IntegrityAudit[]
}

export function recursiveContentDistributionAgent(
  input: ContentDistributionInput
) {
  const distributionPlan = input.integrityAudits.map((audit) => ({
    agent: audit.agent,
    contentType: audit.contentType,
    topic: audit.topic,
    platform:
      audit.contentType === "longform video essay"
        ? "YouTube Longform"
        : audit.contentType === "shortform clips"
        ? "YouTube Shorts, TikTok, Instagram Reels"
        : audit.contentType === "integrity review brief"
        ? "Internal Governance Review"
        : "LinkedIn, X, Blog",
    distributionReadiness:
      audit.integrityScore >= 95 ? "ready" : "hold",
    distributionScore: Math.round(
      (audit.integrityScore +
        input.recursiveContentIntegrityScore) /
        2
    ),
  }))

  const recursiveContentDistributionScore = Math.round(
    distributionPlan.reduce(
      (sum, item) => sum + item.distributionScore,
      0
    ) / distributionPlan.length
  )

  const primaryDistribution = distributionPlan[0]

  return {
    autonomousRecursiveContentDistribution: true,
    integrityStatus: input.integrityStatus,
    recursiveContentIntegrityScore:
      input.recursiveContentIntegrityScore,
    recursiveContentDistributionScore,
    distributionPlan,
    primaryDistribution,
    distributionStatus:
      recursiveContentDistributionScore >= 95
        ? "Content distribution approved."
        : "Content distribution requires review.",
    distributionDirective:
      `Distribute primary content through: "${primaryDistribution.platform}"`,
    distributionConstraint:
      "Distribution must preserve integrity, trust, wisdom and civilization-positive influence across all platforms.",
    nextStage:
      "Ready for recursive audience resonance intelligence.",
  }
}
