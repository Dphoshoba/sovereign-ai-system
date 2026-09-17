import type { EvidenceRecord } from "./evidence-registry";
import type { ExtractedFact } from "./fact-extractor";
import type { VerifiedFact } from "./fact-verification-engine";
import {
  type ArticleClaim,
  articleContainsExcerpt,
  passageSupportsClaim,
  significantTokens,
} from "./article-claim-extractor";
import { claimAllowsEvidence } from "./claim-source-attribution";

export type GroundedEvidenceMatch = {
  evidence: EvidenceRecord;
  overlap: number;
};

function authorityScoreForUrl(url: string): number {
  const lower = url.toLowerCase();
  if (lower.includes(".gov") || lower.includes("nist.gov")) return 100;
  if (lower.includes(".edu")) return 95;
  if (lower.includes("pwc.com") || lower.includes("deloitte.com")) return 80;
  return 50;
}

export function matchEvidenceToClaim(
  claim: ArticleClaim,
  evidenceRecords: EvidenceRecord[],
): GroundedEvidenceMatch[] {
  return evidenceRecords.flatMap((evidence) => {
    if (
      !claimAllowsEvidence(claim.claim, {
        url: evidence.sourceUrl,
        title: evidence.sourceTitle,
        publisher: evidence.sourceTitle,
      })
    ) {
      return [];
    }
    if (!passageSupportsClaim(claim.claim, evidence.extractedText)) return [];
    const overlap = significantTokens(claim.claim).filter((token) =>
      significantTokens(evidence.extractedText).includes(token),
    ).length;
    return [{ evidence, overlap }];
  });
}

export function groundedFactVerification(
  claims: ArticleClaim[],
  evidenceRecords: EvidenceRecord[],
  normalizedArticleText: string,
): {
  facts: VerifiedFact[];
  verifiedCount: number;
  partiallyVerifiedCount: number;
  unverifiedCount: number;
  averageVerificationScore: number;
  acceptedEvidence: EvidenceRecord[];
} {
  const acceptedById = new Map<string, EvidenceRecord>();
  const facts: VerifiedFact[] = [];

  for (const claim of claims) {
    if (!articleContainsExcerpt(normalizedArticleText, claim.articleExcerpt)) {
      continue;
    }

    const matches = matchEvidenceToClaim(claim, evidenceRecords).sort(
      (left, right) => right.overlap - left.overlap,
    );
    const uniqueSources = new Map<string, EvidenceRecord>();
    for (const match of matches) {
      uniqueSources.set(match.evidence.sourceUrl, match.evidence);
      acceptedById.set(match.evidence.id, match.evidence);
    }

    const supporting = Array.from(uniqueSources.values());
    const verificationCount = supporting.length;
    const sourceAuthorityAverage =
      supporting.length === 0
        ? 0
        : Math.round(
            supporting.reduce(
              (sum, evidence) => sum + authorityScoreForUrl(evidence.sourceUrl),
              0,
            ) / supporting.length,
          );
    const strongest = matches[0];
    const primary = strongest?.evidence;
    const hasGovernmentSource = supporting.some((evidence) =>
      /\.gov|nist\.gov/i.test(evidence.sourceUrl),
    );

    const verificationStatus =
      verificationCount >= 2 || (verificationCount >= 1 && hasGovernmentSource)
        ? "verified"
        : verificationCount === 1
          ? "partially verified"
          : "unverified";

    const verificationScore =
      verificationStatus === "verified"
        ? Math.min(100, 55 + verificationCount * 15 + Math.round(sourceAuthorityAverage * 0.2))
        : verificationStatus === "partially verified"
          ? Math.min(70, 40 + Math.round(sourceAuthorityAverage * 0.25))
          : 0;

    const base: ExtractedFact = {
      claim: claim.claim,
      evidenceId: primary?.id || "",
      sourceTitle: primary?.sourceTitle || "",
      sourceUrl: primary?.sourceUrl || "",
      sourceType: primary?.sourceType || "",
      evidenceText: primary?.extractedText || "",
      confidence:
        verificationStatus === "verified"
          ? "high"
          : verificationStatus === "partially verified"
            ? "medium"
            : "low",
      requiresHumanReview: verificationStatus !== "verified",
    };

    facts.push({
      ...base,
      articleExcerpt: claim.articleExcerpt,
      articleSection: claim.section,
      blockType: claim.blockType,
      verificationCount,
      verificationStatus,
      verificationMethod:
        verificationCount > 1 ? "exact" : "single-source-supported",
      supportingSources: supporting.map((evidence) => ({
        sourceTitle: evidence.sourceTitle,
        sourceUrl: evidence.sourceUrl,
        evidenceId: evidence.id,
      })),
      similarityMatches: [],
      verificationScore,
    });
  }

  const verifiedCount = facts.filter(
    (fact) => fact.verificationStatus === "verified",
  ).length;
  const partiallyVerifiedCount = facts.filter(
    (fact) => fact.verificationStatus === "partially verified",
  ).length;
  const unverifiedCount = facts.filter(
    (fact) => fact.verificationStatus === "unverified",
  ).length;
  const scored = facts.filter((fact) => fact.verificationScore > 0);
  const averageVerificationScore =
    scored.length === 0
      ? 0
      : Math.round(
          scored.reduce((sum, fact) => sum + fact.verificationScore, 0) /
            scored.length,
        );

  return {
    facts,
    verifiedCount,
    partiallyVerifiedCount,
    unverifiedCount,
    averageVerificationScore,
    acceptedEvidence: Array.from(acceptedById.values()),
  };
}
