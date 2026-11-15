import {
  articleContainsExcerpt,
  type ArticleClaim,
} from "./article-claim-extractor";
import { ADOPTED_AUDIT_SPECIFICATION_VERSION } from "./audit-specification-compatibility";
import type { AttributableSource } from "./claim-source-attribution";
import { matchEvidenceToClaim } from "./claim-evidence-matcher";
import type { EvidenceRecord } from "./evidence-registry";
import type { VerifiedFact } from "./fact-verification-engine";
import { RESEARCH_MAX_PASSAGES_PER_CLAIM } from "./source-fetch-guard";
import {
  evaluateVersionedClaim,
  versionedCanonicalIdentity,
  versionedPassageSubstantiates,
  type VersionedPassage,
} from "./versioned-evidence";
import { versionedAverageVerificationScore } from "./versioned-publication";

export type VersionedPrepareVerification = {
  facts: VerifiedFact[];
  verifiedCount: number;
  partiallyVerifiedCount: number;
  unverifiedCount: number;
  averageVerificationScore: number;
  acceptedEvidence: EvidenceRecord[];
  specificationVersion: typeof ADOPTED_AUDIT_SPECIFICATION_VERSION;
  disputes: [];
};

function listedSourcesFromEvidence(
  evidenceRecords: EvidenceRecord[],
): AttributableSource[] {
  const seen = new Set<string>();
  const sources: AttributableSource[] = [];
  for (const evidence of evidenceRecords) {
    if (seen.has(evidence.sourceUrl)) continue;
    seen.add(evidence.sourceUrl);
    sources.push({ url: evidence.sourceUrl, title: evidence.sourceTitle });
  }
  return sources;
}

export function versionedFactVerification(
  claims: ArticleClaim[],
  evidenceRecords: EvidenceRecord[],
  normalizedArticleText: string,
  listedSources: AttributableSource[] = [],
): VersionedPrepareVerification {
  const acceptedById = new Map<string, EvidenceRecord>();
  const facts: VerifiedFact[] = [];

  for (const claim of claims) {
    if (!articleContainsExcerpt(normalizedArticleText, claim.articleExcerpt)) {
      continue;
    }

    const sources =
      listedSources.length > 0
        ? listedSources
        : listedSourcesFromEvidence(evidenceRecords);
    const matches = matchEvidenceToClaim(claim, evidenceRecords, sources)
      .sort(
        (left, right) =>
          right.overlap - left.overlap ||
          left.evidence.id.localeCompare(right.evidence.id),
      )
      .slice(0, RESEARCH_MAX_PASSAGES_PER_CLAIM);

    const passages: VersionedPassage[] = [];
    for (const match of matches) {
      acceptedById.set(match.evidence.id, match.evidence);
      const host = (() => {
        try {
          return new URL(match.evidence.sourceUrl).hostname.toLowerCase();
        } catch {
          return "";
        }
      })();
      const passageText =
        /(^|\.)zapier\.com$|(^|\.)(?:developers\.)?openai\.com$/.test(host)
          ? [match.evidence.sourceTitle, match.evidence.extractedText]
              .filter(Boolean)
              .join("\n")
          : match.evidence.extractedText;
      const polarity = versionedPassageSubstantiates(claim.claim, passageText)
        ? "supports"
        : "does-not-address";
      passages.push({
        url: match.evidence.sourceUrl,
        passage: passageText,
        polarity,
        title: match.evidence.sourceTitle,
      });
    }

    const versioned = evaluateVersionedClaim({
      claim: claim.claim,
      passages,
      unresolvedDisputes: 0,
    });

    const identitySet = new Set(versioned.identities);
    const supporting = matches
      .map((match) => match.evidence)
      .filter((evidence) => {
        const identity = versionedCanonicalIdentity({
          url: evidence.sourceUrl,
          title: evidence.sourceTitle,
        });
        const host = (() => {
          try {
            return new URL(evidence.sourceUrl).hostname.toLowerCase();
          } catch {
            return "";
          }
        })();
        const passageText =
          /(^|\.)zapier\.com$|(^|\.)(?:developers\.)?openai\.com$/.test(host)
            ? [evidence.sourceTitle, evidence.extractedText].filter(Boolean).join("\n")
            : evidence.extractedText;
        return (
          Boolean(identity && identitySet.has(identity)) &&
          versionedPassageSubstantiates(claim.claim, passageText)
        );
      });

    const primary = supporting[0] ?? matches[0]?.evidence;
    const verificationMethod =
      versioned.verificationMethod === "disputed"
        ? "disputed"
        : versioned.verificationMethod === "exact"
          ? "exact"
          : "single-source-supported";

    facts.push({
      claim: claim.claim,
      evidenceId: primary?.id || "",
      sourceTitle: primary?.sourceTitle || "",
      sourceUrl: primary?.sourceUrl || "",
      sourceType: primary?.sourceType || "",
      evidenceText: primary?.extractedText || "",
      confidence:
        versioned.verificationStatus === "verified"
          ? "high"
          : versioned.verificationStatus === "partially verified"
            ? "medium"
            : "low",
      requiresHumanReview: versioned.verificationStatus !== "verified",
      articleExcerpt: claim.articleExcerpt,
      articleSection: claim.section,
      blockType: claim.blockType,
      verificationCount: versioned.verificationCount,
      verificationStatus: versioned.verificationStatus,
      verificationMethod,
      supportingSources: supporting.map((evidence) => ({
        sourceTitle: evidence.sourceTitle,
        sourceUrl: evidence.sourceUrl,
        evidenceId: evidence.id,
      })),
      similarityMatches: [],
      verificationScore: versioned.verificationScore,
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
  const scores = facts.map((fact) => fact.verificationScore);
  const average =
    versionedAverageVerificationScore(scores.length > 0 ? scores : [0]) ?? 0;

  return {
    facts,
    verifiedCount,
    partiallyVerifiedCount,
    unverifiedCount,
    averageVerificationScore: Math.round(average),
    acceptedEvidence: Array.from(acceptedById.values()),
    specificationVersion: ADOPTED_AUDIT_SPECIFICATION_VERSION,
    disputes: [],
  };
}
