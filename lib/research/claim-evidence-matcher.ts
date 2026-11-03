import type { EvidenceRecord } from "./evidence-registry";
import type { ExtractedFact } from "./fact-extractor";
import type {
  ClaimMatchDiagnostic,
  VerifiedFact,
} from "./fact-verification-engine";
import {
  type ArticleClaim,
  articleContainsExcerpt,
  assessPassageSupport,
  passageSupportsClaim,
  uniqueContentOverlap,
  verifiableClauses,
} from "./article-claim-extractor";
import {
  canonicalSourceUrl,
  claimAllowsEvidence,
  evidenceCorroborationKey,
  isBibleProjectClaim,
  isBibleProjectSource,
  resolveClaimSourceBinding,
  type AttributableSource,
} from "./claim-source-attribution";
import { evidenceSatisfiesProductIdentity } from "./product-identity";
import { RESEARCH_MAX_PASSAGES_PER_CLAIM } from "./source-fetch-guard";

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

function listedSourcesFromEvidence(
  evidenceRecords: EvidenceRecord[],
): AttributableSource[] {
  const seen = new Map<string, AttributableSource>();
  for (const evidence of evidenceRecords) {
    if (!seen.has(evidence.sourceUrl)) {
      seen.set(evidence.sourceUrl, {
        url: evidence.sourceUrl,
        title: evidence.sourceTitle,
        publisher: evidence.sourceTitle,
      });
    }
  }
  return Array.from(seen.values());
}

function sourceFromEvidence(evidence: EvidenceRecord): AttributableSource {
  return {
    url: evidence.sourceUrl,
    title: evidence.sourceTitle,
    publisher: evidence.sourceTitle,
  };
}

function dropAmbiguousBibleProjectMatches(
  claim: string,
  matches: GroundedEvidenceMatch[],
  listedSources: AttributableSource[],
): GroundedEvidenceMatch[] {
  const binding = resolveClaimSourceBinding(claim, listedSources);
  if (binding.role !== "publisher" || !isBibleProjectClaim(claim)) {
    return matches;
  }
  const documentUrls = new Set<string>();
  for (const match of matches) {
    if (
      !isBibleProjectSource({
        url: match.evidence.sourceUrl,
        title: match.evidence.sourceTitle,
      })
    ) {
      continue;
    }
    documentUrls.add(canonicalSourceUrl(match.evidence.sourceUrl));
  }
  if (documentUrls.size > 1) return [];
  return matches;
}

function documentKindForUrl(url: string): "html" | "pdf" {
  return /\.pdf(?:$|[?#])/i.test(url) ? "pdf" : "html";
}

function passageMatch(
  clause: string,
  evidence: EvidenceRecord,
  claimText: string,
): GroundedEvidenceMatch | null {
  const documentKind = documentKindForUrl(evidence.sourceUrl);
  if (!passageSupportsClaim(clause, evidence.extractedText, { documentKind })) {
    return null;
  }
  if (
    !evidenceSatisfiesProductIdentity(
      claimText,
      evidence.sourceTitle,
      evidence.extractedText,
    )
  ) {
    return null;
  }
  return {
    evidence,
    overlap: uniqueContentOverlap(clause, evidence.extractedText).overlap.length,
  };
}

function compoundMatchesForDocument(
  claimText: string,
  clauses: string[],
  passages: EvidenceRecord[],
): GroundedEvidenceMatch[] {
  const clauseMatches: GroundedEvidenceMatch[] = [];
  for (const clause of clauses) {
    const supporting = passages
      .flatMap((evidence) => {
        const match = passageMatch(clause, evidence, claimText);
        return match ? [match] : [];
      })
      .sort(
        (left, right) =>
          right.overlap - left.overlap ||
          left.evidence.id.localeCompare(right.evidence.id),
      );
    if (supporting.length === 0) return [];
    clauseMatches.push(supporting[0]);
  }
  const unique = new Map<string, GroundedEvidenceMatch>();
  for (const match of clauseMatches) {
    const existing = unique.get(match.evidence.id);
    if (!existing || match.overlap < existing.overlap) {
      unique.set(match.evidence.id, match);
    }
  }
  return Array.from(unique.values());
}

export function matchEvidenceToClaim(
  claim: ArticleClaim,
  evidenceRecords: EvidenceRecord[],
  listedSources: AttributableSource[] = [],
): GroundedEvidenceMatch[] {
  const allowed = evidenceRecords.filter((evidence) =>
    claimAllowsEvidence(claim.claim, sourceFromEvidence(evidence), listedSources),
  );
  const clauses = verifiableClauses(claim.claim);
  const matches =
    clauses.length === 1
      ? allowed.flatMap((evidence) => {
          const match = passageMatch(clauses[0], evidence, claim.claim);
          return match ? [match] : [];
        })
      : Array.from(
          allowed.reduce((groups, evidence) => {
            const key = canonicalSourceUrl(evidence.sourceUrl);
            const group = groups.get(key) ?? [];
            group.push(evidence);
            groups.set(key, group);
            return groups;
          }, new Map<string, EvidenceRecord[]>()),
        ).flatMap(([, passages]) =>
          compoundMatchesForDocument(claim.claim, clauses, passages),
        );
  return dropAmbiguousBibleProjectMatches(claim.claim, matches, listedSources);
}

export function claimMatchDiagnostics(
  claim: ArticleClaim,
  evidenceRecords: EvidenceRecord[],
  listedSources: AttributableSource[] = [],
): ClaimMatchDiagnostic[] {
  const clauses = verifiableClauses(claim.claim);
  const diagnostics: ClaimMatchDiagnostic[] = [];
  const clauseSupport = new Map<string, Set<number>>();

  for (const evidence of evidenceRecords) {
    if (
      !claimAllowsEvidence(
        claim.claim,
        sourceFromEvidence(evidence),
        listedSources,
      )
    ) {
      diagnostics.push({
        clause: claim.claim,
        sourceUrl: evidence.sourceUrl,
        sourceTitle: evidence.sourceTitle,
        evidenceId: evidence.id,
        overlap: 0,
        requiredOverlap: 0,
        actionTokenMatches: [],
        missingActionTokens: [],
        failureReason: "publisher-mismatch",
      });
      continue;
    }

    const documentKind = documentKindForUrl(evidence.sourceUrl);
    const supportedClauses = new Set<number>();
    clauses.forEach((clause, index) => {
      const assessment = assessPassageSupport(clause, evidence.extractedText, {
        documentKind,
      });
      if (
        assessment.supported &&
        !evidenceSatisfiesProductIdentity(
          claim.claim,
          evidence.sourceTitle,
          evidence.extractedText,
        )
      ) {
        diagnostics.push({
          clause,
          sourceUrl: evidence.sourceUrl,
          sourceTitle: evidence.sourceTitle,
          evidenceId: evidence.id,
          overlap: assessment.overlapCount,
          requiredOverlap: assessment.requiredOverlap,
          actionTokenMatches: assessment.actionTokenMatches,
          missingActionTokens: assessment.missingActionTokens,
          failureReason: "product-identity",
        });
        return;
      }
      if (assessment.supported) {
        supportedClauses.add(index);
        return;
      }
      diagnostics.push({
        clause,
        sourceUrl: evidence.sourceUrl,
        sourceTitle: evidence.sourceTitle,
        evidenceId: evidence.id,
        overlap: assessment.overlapCount,
        requiredOverlap: assessment.requiredOverlap,
        actionTokenMatches: assessment.actionTokenMatches,
        missingActionTokens: assessment.missingActionTokens,
        failureReason: assessment.failureReason,
      });
    });
    if (supportedClauses.size > 0) {
      const key = canonicalSourceUrl(evidence.sourceUrl);
      const existing = clauseSupport.get(key) ?? new Set<number>();
      for (const index of supportedClauses) existing.add(index);
      clauseSupport.set(key, existing);
    }
  }

  const documentCoversClaim = Array.from(clauseSupport.values()).some(
    (supported) => supported.size === clauses.length,
  );
  const partialDocuments = Array.from(clauseSupport.values()).filter(
    (supported) => supported.size > 0 && supported.size < clauses.length,
  );
  if (clauses.length > 1 && !documentCoversClaim && partialDocuments.length > 1) {
    const partial = evidenceRecords.find((evidence) =>
      clauseSupport.has(canonicalSourceUrl(evidence.sourceUrl)),
    );
    diagnostics.push({
      clause: claim.claim,
      sourceUrl: partial?.sourceUrl || "",
      sourceTitle: partial?.sourceTitle || "",
      evidenceId: partial?.id || "",
      overlap: 0,
      requiredOverlap: 0,
      actionTokenMatches: [],
      missingActionTokens: [],
      failureReason: "cross-document",
    });
  }

  return diagnostics;
}

export function groundedFactVerification(
  claims: ArticleClaim[],
  evidenceRecords: EvidenceRecord[],
  normalizedArticleText: string,
  listedSources: AttributableSource[] = [],
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

    const sources =
      listedSources.length > 0
        ? listedSources
        : listedSourcesFromEvidence(evidenceRecords);
    const matches = matchEvidenceToClaim(claim, evidenceRecords, sources)
      .sort((left, right) => right.overlap - left.overlap || left.evidence.id.localeCompare(right.evidence.id))
      .slice(0, RESEARCH_MAX_PASSAGES_PER_CLAIM);
    const uniqueSources = new Map<string, EvidenceRecord>();
    const mappedPassages: EvidenceRecord[] = [];
    for (const match of matches) {
      const key = evidenceCorroborationKey(
        claim.claim,
        sourceFromEvidence(match.evidence),
        sources,
      );
      if (!uniqueSources.has(key)) {
        uniqueSources.set(key, match.evidence);
      }
      if (!mappedPassages.some((record) => record.id === match.evidence.id)) {
        mappedPassages.push(match.evidence);
      }
      acceptedById.set(match.evidence.id, match.evidence);
    }

    const supporting = Array.from(uniqueSources.values());
    const allowedUrls = new Set(supporting.map((evidence) => evidence.sourceUrl));
    const listedPassages = mappedPassages.filter((evidence) =>
      allowedUrls.has(evidence.sourceUrl),
    );
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

    const matchDiagnostics = claimMatchDiagnostics(claim, evidenceRecords, sources);
    facts.push({
      ...base,
      articleExcerpt: claim.articleExcerpt,
      articleSection: claim.section,
      blockType: claim.blockType,
      verificationCount,
      verificationStatus,
      verificationMethod:
        verificationCount > 1 ? "exact" : "single-source-supported",
      supportingSources: (listedPassages.length > 0 ? listedPassages : supporting).map((evidence) => ({
        sourceTitle: evidence.sourceTitle,
        sourceUrl: evidence.sourceUrl,
        evidenceId: evidence.id,
      })),
      similarityMatches: [],
      verificationScore,
      ...(verificationStatus === "unverified" && matchDiagnostics.length > 0
        ? { matchDiagnostics }
        : {}),
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
