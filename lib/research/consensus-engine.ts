import type { VerifiedFact } from "./fact-verification-engine"

export type ConsensusResult = {
  totalFacts: number
  verifiedFacts: number
  partiallyVerifiedFacts: number
  unverifiedFacts: number
  consensusScore: number
  publicationRecommendation:
    | "publish-ready"
    | "review-required"
    | "blocked"
  summary: string
}

export function consensusEngine(
  facts: VerifiedFact[]
): ConsensusResult {
  const totalFacts = facts.length

  const verifiedFacts = facts.filter(
    (fact) => fact.verificationStatus === "verified"
  ).length

  const partiallyVerifiedFacts = facts.filter(
    (fact) =>
      fact.verificationStatus === "partially verified"
  ).length

  const unverifiedFacts = facts.filter(
    (fact) => fact.verificationStatus === "unverified"
  ).length

  const consensusScore =
    totalFacts === 0
      ? 0
      : Math.round(
          ((verifiedFacts * 100) +
            (partiallyVerifiedFacts * 60)) /
            totalFacts
        )

  const publicationRecommendation =
    unverifiedFacts > 0
      ? "blocked"
      : consensusScore >= 85
      ? "publish-ready"
      : "review-required"

  return {
    totalFacts,
    verifiedFacts,
    partiallyVerifiedFacts,
    unverifiedFacts,
    consensusScore,
    publicationRecommendation,
    summary:
      `Consensus score is ${consensusScore}. ` +
      `Verified: ${verifiedFacts}. ` +
      `Partially verified: ${partiallyVerifiedFacts}. ` +
      `Unverified: ${unverifiedFacts}.`,
  }
}
