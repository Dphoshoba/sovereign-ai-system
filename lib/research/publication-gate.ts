import type { ConsensusResult } from "./consensus-engine"

export type PublicationDecision = {
  approved: boolean
  status:
    | "publish-ready"
    | "review-required"
    | "blocked"
  reason: string
}

export function publicationGate(
  consensus: ConsensusResult
): PublicationDecision {
  if (
    consensus.publicationRecommendation ===
    "publish-ready"
  ) {
    return {
      approved: true,
      status: "publish-ready",
      reason:
        "Consensus score meets publication threshold.",
    }
  }

  if (
    consensus.publicationRecommendation ===
    "review-required"
  ) {
    return {
      approved: false,
      status: "review-required",
      reason:
        "Human review required before publication.",
    }
  }

  return {
    approved: false,
    status: "blocked",
    reason:
      "Insufficient verification. Publication blocked.",
  }
}
