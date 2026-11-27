/**
 * Called by app/api/ai/generate-article/route.ts after draft generation and by
 * tests/editorial/ground-generated-article.test.ts.
 * No existing module verifies generator drafts with the Prepare claim path;
 * prepare-article-for-review.ts only runs on editor Prepare.
 * Reads: article title/excerpt/content + EvidenceRecord[]; writes no DB.
 * User instruction (Mission 005R): "Improve autonomous content quality —
 * factual claims are grounded in collected evidence before the article is
 * presented for editorial review."
 */
import {
  extractArticleClaims,
  FACTUAL_CLAIM_CEILING,
  type ArticleClaimExtractionResult,
} from "./article-claim-extractor";
import { groundedFactVerification } from "./claim-evidence-matcher";
import type { EvidenceRecord } from "./evidence-registry";
import type { VerifiedFact } from "./fact-verification-engine";
import { consensusEngine } from "./consensus-engine";
import { recommendationWithEvidenceCompleteness } from "./evidence-completeness";
import { publicationGate } from "./publication-gate";
import { isVersionedEditorialVerifierEnabled } from "./versioned-publication";
import {
  versionedFactVerification,
  type VersionedPrepareVerification,
} from "./versioned-prepare-verification";

export type ListedAttribution = {
  url: string;
  title?: string | null;
};

export type GroundedArticleVerification = {
  extraction: ArticleClaimExtractionResult;
  facts: VerifiedFact[];
  verifiedCount: number;
  partiallyVerifiedCount: number;
  unverifiedCount: number;
  averageVerificationScore: number;
  acceptedEvidence: EvidenceRecord[];
  unsupportedFactualClaims: VerifiedFact[];
  publicationRecommendation: string;
  consensusScore: number;
  sourceQualityScore: number;
  specificationVersion?: string;
  disputes?: [];
};

type GroundedVerificationCore =
  | ReturnType<typeof groundedFactVerification>
  | VersionedPrepareVerification;

function runClaimVerification(
  extraction: ArticleClaimExtractionResult,
  evidence: EvidenceRecord[],
  listedSources: ListedAttribution[],
  versioned: boolean,
): GroundedVerificationCore {
  if (versioned) {
    return versionedFactVerification(
      extraction.claims,
      evidence,
      extraction.normalizedArticleText,
      listedSources,
    );
  }
  return groundedFactVerification(
    extraction.claims,
    evidence,
    extraction.normalizedArticleText,
    listedSources,
  );
}

/**
 * Verify a generated draft against collected evidence using the same
 * article-grounded claim path as Prepare for Review.
 */
export function verifyGeneratedArticleAgainstEvidence(input: {
  title: string;
  excerpt?: string | null;
  content: string;
  evidence: EvidenceRecord[];
  listedSources: ListedAttribution[];
  versioned?: boolean;
}): GroundedArticleVerification {
  const versioned =
    input.versioned ?? isVersionedEditorialVerifierEnabled();
  const extraction = extractArticleClaims({
    title: input.title,
    excerpt: input.excerpt,
    content: input.content,
    factualClaimLimit: FACTUAL_CLAIM_CEILING,
  });

  const verification = runClaimVerification(
    extraction,
    input.evidence,
    input.listedSources,
    versioned,
  );

  const consensus = consensusEngine(verification.facts);
  let publicationRecommendation = recommendationWithEvidenceCompleteness(
    consensus.publicationRecommendation,
    verification.facts,
    extraction.notScoredClaims,
  );
  // Drafts with no auditable factual claims, or any unverified claim, are not
  // publish-ready — keep them in human review.
  if (
    extraction.claimCount === 0 ||
    verification.unverifiedCount > 0
  ) {
    publicationRecommendation = "review-required";
  }
  publicationGate({
    ...consensus,
    publicationRecommendation,
  });

  const unsupportedFactualClaims = verification.facts.filter(
    (fact) => fact.verificationStatus === "unverified",
  );

  return {
    extraction,
    facts: verification.facts,
    verifiedCount: verification.verifiedCount,
    partiallyVerifiedCount: verification.partiallyVerifiedCount,
    unverifiedCount: verification.unverifiedCount,
    averageVerificationScore: verification.averageVerificationScore,
    acceptedEvidence: verification.acceptedEvidence,
    unsupportedFactualClaims,
    publicationRecommendation,
    consensusScore: consensus.consensusScore,
    sourceQualityScore: consensus.sourceQualityScore,
    ...("specificationVersion" in verification
      ? {
          specificationVersion: verification.specificationVersion,
          disputes: verification.disputes,
        }
      : {}),
  };
}

/** Prompt fragment listing unsupported claims for a grounded revision pass. */
export function unsupportedClaimsRevisionBrief(
  unsupported: VerifiedFact[],
): string {
  if (unsupported.length === 0) {
    return "No unsupported factual claims were detected.";
  }
  return unsupported
    .map((fact, index) => `${index + 1}. ${fact.claim}`)
    .join("\n");
}
