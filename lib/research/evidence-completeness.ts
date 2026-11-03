import {
  recommendationWithUnscoredClaims,
  type NotScoredClaim,
} from "./article-claim-extractor";

export type EvidenceCompletenessFact = {
  verificationStatus: "verified" | "partially verified" | "unverified";
  supportingSources: readonly { sourceUrl?: string | null }[];
};

function hasAcceptedSupportingUrl(fact: EvidenceCompletenessFact): boolean {
  return fact.supportingSources.some(
    (source) =>
      typeof source.sourceUrl === "string" && source.sourceUrl.trim().length > 0,
  );
}

function lacksAcceptedEvidence(fact: EvidenceCompletenessFact): boolean {
  return fact.verificationStatus === "unverified" || !hasAcceptedSupportingUrl(fact);
}

export function recommendationWithEvidenceCompleteness<T extends string>(
  recommendation: T,
  facts: readonly EvidenceCompletenessFact[],
  notScoredClaims: readonly NotScoredClaim[] = [],
): T {
  const withUnscored = recommendationWithUnscoredClaims(
    recommendation,
    notScoredClaims,
  );
  if (withUnscored !== "publish-ready") return withUnscored;
  if (facts.some(lacksAcceptedEvidence)) {
    return "review-required" as T;
  }
  return withUnscored;
}
