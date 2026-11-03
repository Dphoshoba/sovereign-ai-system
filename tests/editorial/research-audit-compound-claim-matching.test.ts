import { describe, expect, it } from "vitest";
import {
  parseArticleAuditAssociation,
  RESEARCH_AUDIT_FINGERPRINT_ACTION,
  serializeArticleAuditAssociation,
} from "../../lib/research/article-audit-association";
import {
  assessPassageSupport,
  extractArticleClaims,
  FACTUAL_CLAIM_LIMIT,
  passageSupportsClaim,
  verifiableClauses,
} from "../../lib/research/article-claim-extractor";
import { groundedFactVerification } from "../../lib/research/claim-evidence-matcher";
import { consensusEngine } from "../../lib/research/consensus-engine";
import type { EvidenceRecord } from "../../lib/research/evidence-registry";
import type { VerifiedFact } from "../../lib/research/fact-verification-engine";
import {
  CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
  isCurrentResearchAuditEngineRevision,
  isResearchAuditEngineRevision,
} from "../../lib/research/research-audit-engine-revision";

const COMPOUND =
  "NIST says this is a natural result of models that predict likely next words, and that people may act on false content because it sounds confident.";
const NEXT_WORDS =
  "NIST says this is a natural result of models that predict likely next words in generated text.";
const ACT_ON_FALSE =
  "NIST says that people may act on false content because it sounds confident to a reader.";
const GLOSS =
  "That is the confabulation risk NIST describes: confident wording that is wrong.";
const GLOSS_NEAR_MISS =
  "The profile discusses model errors in generated text.";
const CITATIONS =
  "NIST’s confabulation section also warns that a model may supply false reasoning or citations that make a wrong answer look explained.";
const CITATION_NEAR_MISS =
  "The document mentions references in an appendix.";
const LISTED_NIST =
  "NIST’s AI Risk Management Framework says AI risk management should be integrated into broader enterprise risk processes, and that organizations need accountability mechanisms, defined roles, and responsibilities for risk management to be effective.";

const NIST_PDF = "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf";
const NIST_HTML =
  "https://www.nist.gov/publications/artificial-intelligence-risk-management-framework";

function claim(text: string) {
  return {
    claim: text,
    articleExcerpt: text,
    section: "body" as const,
    blockType: "paragraph" as const,
    kind: "factual" as const,
  };
}

function evidence(id: string, url: string, text: string): EvidenceRecord {
  return {
    id,
    sourceTitle: "NIST",
    sourceUrl: url,
    sourceType: "government",
    extractedText: text,
    confidence: 90,
    requiresHumanReview: true,
  };
}

describe("compound claim matching", () => {
  it("does not split a list that is not two verifiable clauses", () => {
    expect(verifiableClauses(LISTED_NIST)).toEqual([LISTED_NIST]);
    expect(verifiableClauses(COMPOUND)).toHaveLength(2);
  });

  it("supports a compound claim from two passages in the same document", () => {
    const [firstClause, secondClause] = verifiableClauses(COMPOUND);
    expect(passageSupportsClaim(secondClause, NEXT_WORDS, { documentKind: "pdf" })).toBe(
      false,
    );
    expect(passageSupportsClaim(firstClause, ACT_ON_FALSE, { documentKind: "pdf" })).toBe(
      false,
    );
    const onePassage = groundedFactVerification(
      [claim(COMPOUND)],
      [evidence("next-words-only", NIST_PDF, NEXT_WORDS)],
      COMPOUND,
    );
    expect(onePassage.facts[0]?.verificationStatus).toBe("unverified");
    const verification = groundedFactVerification(
      [claim(COMPOUND)],
      [
        evidence("next-words", NIST_PDF, NEXT_WORDS),
        evidence("act-on-false", NIST_PDF, ACT_ON_FALSE),
      ],
      COMPOUND,
    );
    expect(verification.facts[0]?.verificationStatus).toBe("verified");
    expect(verification.facts[0]?.verificationCount).toBe(1);
    expect(
      new Set(verification.facts[0]?.supportingSources.map((source) => source.sourceUrl)),
    ).toEqual(new Set([NIST_PDF]));
    expect(verification.facts[0]?.matchDiagnostics).toBeUndefined();
  });

  it("rejects a compound claim when one clause is unsupported", () => {
    const verification = groundedFactVerification(
      [claim(COMPOUND)],
      [
        evidence("next-words", NIST_PDF, NEXT_WORDS),
        evidence("unrelated", NIST_PDF, "The glossary defines unrelated framework terms."),
      ],
      COMPOUND,
    );
    expect(verification.facts[0]?.verificationStatus).toBe("unverified");
    expect(verification.facts[0]?.verificationCount).toBe(0);
    const failed = verification.facts[0]?.matchDiagnostics?.find(
      (item) => item.failureReason === "insufficient-overlap",
    );
    expect(failed?.sourceUrl).toBe(NIST_PDF);
    expect(failed?.overlap).toBeLessThan(failed?.requiredOverlap ?? 0);
    expect(failed?.missingActionTokens.length).toBeGreaterThan(0);
  });

  it("does not combine clauses from different documents", () => {
    const verification = groundedFactVerification(
      [claim(COMPOUND)],
      [
        evidence("next-words", NIST_PDF, NEXT_WORDS),
        evidence("act-on-false", NIST_HTML, ACT_ON_FALSE),
      ],
      COMPOUND,
    );
    expect(verification.facts[0]?.verificationStatus).toBe("unverified");
    expect(verification.facts[0]?.supportingSources).toEqual([]);
    expect(
      verification.facts[0]?.matchDiagnostics?.some(
        (item) => item.failureReason === "cross-document",
      ),
    ).toBe(true);
    const cross = verification.facts[0]?.matchDiagnostics?.find(
      (item) => item.failureReason === "cross-document",
    );
    expect(cross?.sourceUrl).toBeTruthy();
    expect(cross?.evidenceId).toBeTruthy();
  });
});

describe("NIST confabulation diagnostics", () => {
  it("records the overlap gap for the confabulation gloss and citation sentence", () => {
    expect(verifiableClauses(GLOSS)).toEqual([GLOSS]);
    expect(verifiableClauses(CITATIONS)).toEqual([CITATIONS]);
    const gloss = groundedFactVerification(
      [claim(GLOSS)],
      [evidence("gloss", NIST_PDF, GLOSS_NEAR_MISS)],
      GLOSS,
    );
    const citations = groundedFactVerification(
      [claim(CITATIONS)],
      [evidence("citations", NIST_PDF, CITATION_NEAR_MISS)],
      CITATIONS,
    );
    for (const verification of [gloss, citations]) {
      expect(verification.facts[0]?.verificationStatus).toBe("unverified");
      expect(verification.verifiedCount).toBe(0);
      const diagnostic = verification.facts[0]?.matchDiagnostics?.[0];
      expect(diagnostic?.failureReason).toBe("insufficient-overlap");
      expect(diagnostic?.sourceUrl).toBe(NIST_PDF);
      expect(diagnostic?.overlap).toBeLessThan(diagnostic?.requiredOverlap ?? 0);
      expect(diagnostic?.requiredOverlap).toBeGreaterThanOrEqual(3);
      expect(diagnostic?.actionTokenMatches).toBeInstanceOf(Array);
      expect(diagnostic?.missingActionTokens.length).toBeGreaterThan(0);
    }
    const assessed = assessPassageSupport(GLOSS, GLOSS_NEAR_MISS, {
      documentKind: "pdf",
    });
    expect(assessed.supported).toBe(false);
    expect(assessed.requiredOverlap).toBeGreaterThanOrEqual(3);
    expect(assessed.overlapCount).toBeLessThan(assessed.requiredOverlap);
  });
});

describe("diagnostics and historical compatibility", () => {
  it("keeps match diagnostics out of consensus and publication scoring", () => {
    const base = {
      claim: "NIST says models can present false content in a generated answer.",
      evidenceId: "nist-1",
      sourceTitle: "NIST",
      sourceUrl: NIST_PDF,
      sourceType: "government",
      evidenceText: "NIST says models can present false content.",
      confidence: "high" as const,
      requiresHumanReview: false,
      articleExcerpt: "NIST says models can present false content in a generated answer.",
      articleSection: "body" as const,
      blockType: "paragraph" as const,
      verificationCount: 1,
      verificationStatus: "verified" as const,
      verificationMethod: "single-source-supported" as const,
      supportingSources: [
        {
          sourceTitle: "NIST",
          sourceUrl: NIST_PDF,
          evidenceId: "nist-1",
        },
      ],
      similarityMatches: [],
      verificationScore: 80,
    };
    const withDiagnostics: VerifiedFact = {
      ...base,
      matchDiagnostics: [
        {
          clause: base.claim,
          sourceUrl: "https://support.google.com/mail",
          sourceTitle: "Google",
          evidenceId: "google-1",
          overlap: 1,
          requiredOverlap: 4,
          actionTokenMatches: ["nist"],
          missingActionTokens: ["models", "present", "false"],
          failureReason: "publisher-mismatch",
        },
      ],
    };
    const plain = consensusEngine([base]);
    const diagnosed = consensusEngine([withDiagnostics]);
    expect(diagnosed.consensusScore).toBe(plain.consensusScore);
    expect(diagnosed.sourceQualityScore).toBe(plain.sourceQualityScore);
    expect(diagnosed.publicationRecommendation).toBe(plain.publicationRecommendation);
  });

  it("keeps v9 historical and v10 current without changing the claim cap", () => {
    expect(CURRENT_RESEARCH_AUDIT_ENGINE_REVISION).toBe("article-grounded-v10");
    expect(isResearchAuditEngineRevision("article-grounded-v9")).toBe(true);
    expect(isCurrentResearchAuditEngineRevision("article-grounded-v9")).toBe(false);
    expect(isCurrentResearchAuditEngineRevision("article-grounded-v10")).toBe(true);
    const fingerprint = "a".repeat(64);
    const parsed = parseArticleAuditAssociation({
      action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
      note: serializeArticleAuditAssociation({
        auditId: "audit-v9",
        contentFingerprint: fingerprint,
        createdAt: new Date("2026-11-03T15:24:11.326Z"),
        engineRevision: "article-grounded-v9",
      }),
    });
    expect(parsed?.engineRevision).toBe("article-grounded-v9");
    const extracted = extractArticleClaims({
      content: [
        "## Customer email",
        "Microsoft's Outlook help says Copilot can draft a customer email that a person reviews before it is sent.",
        "## Fictional illustration",
        "Microsoft's Outlook help says this imagined customer received a perfect draft without any review at all.",
      ].join("\n\n"),
    });
    expect(FACTUAL_CLAIM_LIMIT).toBe(12);
    expect(extracted.claims).toHaveLength(1);
    expect(extracted.claims[0]?.heading).toBe("Customer email");
    expect(extracted.notScoredClaims).toEqual([]);
  });
});
