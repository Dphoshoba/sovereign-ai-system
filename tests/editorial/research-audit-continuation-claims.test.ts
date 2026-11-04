import { describe, expect, it } from "vitest";
import {
  extractArticleClaims,
  FACTUAL_CLAIM_CEILING,
  type ArticleClaim,
} from "../../lib/research/article-claim-extractor";
import { groundedFactVerification } from "../../lib/research/claim-evidence-matcher";
import { claimAllowsEvidence } from "../../lib/research/claim-source-attribution";
import { recommendationWithEvidenceCompleteness } from "../../lib/research/evidence-completeness";
import type { EvidenceRecord } from "../../lib/research/evidence-registry";
import { namedProductFeatures } from "../../lib/research/product-identity";
import { CURRENT_RESEARCH_AUDIT_ENGINE_REVISION } from "../../lib/research/research-audit-engine-revision";
import {
  AI_INBOX_CLAIM,
  HELP_ME_WRITE_CLAIM,
  HELP_ME_WRITE_PASSAGES,
  HELP_ME_WRITE_TITLE,
  HELP_ME_WRITE_URL,
} from "../fixtures/research-audit/article-2-gmail-ai-inbox";
import {
  AI_INBOX_SCOPE,
  ATTACHMENT_LIMIT,
  EXCEL_ANTECEDENT,
  FICTIONAL_ILLUSTRATION,
  GUEST_LIMIT,
  HYPOTHETICAL_EXAMPLE,
  INACCURATE_SUGGESTIONS,
  NAMED_PERSON_ADVICE,
  PRACTICAL_INSTRUCTION,
  SCHEDULE_ANTECEDENT,
  section,
  SMART_FEATURES,
  UNSTRUCTURED_DATA,
} from "../fixtures/research-audit/continuation-claims";

const MICROSOFT_URL =
  "https://support.microsoft.com/en-us/outlook/copilot-pages/draft-an-email-message-with-copilot-in-outlook";
const MICROSOFT_TITLE =
  "Draft an email message with Copilot in Outlook | Microsoft Support";

const NIST_COMPOUND =
  "NIST says this is a natural result of models that predict likely next words, and that people may act on false content because it sounds confident.";
const NIST_NEXT_WORDS =
  "NIST says this is a natural result of models that predict likely next words in generated text.";
const NIST_ACT_ON_FALSE =
  "NIST says that people may act on false content because it sounds confident to a reader.";
const NIST_PDF = "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf";

function extracted(content: string) {
  return extractArticleClaims({
    content,
    factualClaimLimit: FACTUAL_CLAIM_CEILING,
  });
}

function featuresFor(claims: readonly ArticleClaim[], snippet: string): string[] {
  const claim = claims.find((item) => item.claim.includes(snippet));
  return claim ? namedProductFeatures(claim.claim) : [];
}

function factualClaim(claim: string) {
  return {
    claim,
    articleExcerpt: claim,
    section: "body" as const,
    blockType: "paragraph" as const,
    kind: "factual" as const,
  };
}

function helpMeWriteEvidence(): EvidenceRecord[] {
  return HELP_ME_WRITE_PASSAGES.map((passage) => ({
    id: passage.id,
    sourceTitle: HELP_ME_WRITE_TITLE,
    sourceUrl: HELP_ME_WRITE_URL,
    sourceType: "html",
    extractedText: passage.extractedText,
    confidence: 80,
    requiresHumanReview: true,
  }));
}

describe("current continuation exclusions", () => {
  it("excludes a continuation that has no explicit attribution", () => {
    const result = extracted(section("Scheduling", [GUEST_LIMIT]));
    expect(result.claims.map((claim) => claim.claim)).not.toContain(GUEST_LIMIT);
    expect(result.authorialAssertions.map((claim) => claim.claim)).toContain(GUEST_LIMIT);
  });

  it("keeps short product limits ineligible without an antecedent", () => {
    const result = extracted(
      section("Limits", [SMART_FEATURES, UNSTRUCTURED_DATA]),
    );
    expect(result.claims.map((claim) => claim.claim)).not.toEqual(
      expect.arrayContaining([SMART_FEATURES, UNSTRUCTURED_DATA]),
    );
    expect(result.claims).toHaveLength(0);
    expect(result.authorialAssertions).toHaveLength(0);
  });

  it("keeps advice, fiction, instructions, and hypotheticals unscored after an antecedent", () => {
    const result = extracted(
      section("Scheduling", [
        `${SCHEDULE_ANTECEDENT} ${NAMED_PERSON_ADVICE} ${PRACTICAL_INSTRUCTION} ${HYPOTHETICAL_EXAMPLE}`,
        FICTIONAL_ILLUSTRATION,
      ]),
    );
    const factual = result.claims.map((claim) => claim.claim);
    expect(factual).toContain(SCHEDULE_ANTECEDENT);
    expect(factual).not.toContain(NAMED_PERSON_ADVICE);
    expect(factual).not.toContain(PRACTICAL_INSTRUCTION);
    expect(factual).not.toContain(HYPOTHETICAL_EXAMPLE);
    expect(factual.some((claim) => claim.includes("amber slot"))).toBe(false);
  });
});

describe("intended continuation binding", () => {
  it("binds the guest-limit continuation to Help me schedule", () => {
    const result = extracted(
      section("Scheduling", [`${SCHEDULE_ANTECEDENT} ${GUEST_LIMIT}`]),
    );
    const continuation = result.claims.find((claim) => claim.claim.includes("20 guests"));
    const verification = continuation
      ? groundedFactVerification(
          [continuation],
          helpMeWriteEvidence(),
          continuation.claim,
          [{ url: HELP_ME_WRITE_URL, title: HELP_ME_WRITE_TITLE }],
        )
      : null;

    expect({
      extracted: Boolean(continuation),
      features: continuation ? namedProductFeatures(continuation.claim) : [],
      helpMeWriteStatus: verification?.facts[0]?.verificationStatus ?? "not-extracted",
      helpMeWriteUrls: verification?.facts[0]?.supportingSources.map(
        (source) => source.sourceUrl,
      ) ?? [],
    }).toEqual({
      extracted: true,
      features: ["Help me schedule"],
      helpMeWriteStatus: "unverified",
      helpMeWriteUrls: [],
    });
  });

  it("admits short limits only after a factual antecedent", () => {
    const inbox = extracted(
      section("Enquiry triage", [`${AI_INBOX_CLAIM} ${SMART_FEATURES}`]),
    );
    const excel = extracted(
      section("Reporting", [`${EXCEL_ANTECEDENT} ${UNSTRUCTURED_DATA}`]),
    );
    expect({
      smartExtracted: inbox.claims.some((claim) =>
        claim.claim.includes("Smart features must be on"),
      ),
      smartFeatures: featuresFor(inbox.claims, "Smart features must be on"),
      unstructuredExtracted: excel.claims.some((claim) =>
        claim.claim.includes("Unstructured data is not supported"),
      ),
    }).toEqual({
      smartExtracted: true,
      smartFeatures: ["Gmail AI Inbox"],
      unstructuredExtracted: true,
    });
  });

  it("treats the AI Inbox documentation-scope sentence as factual", () => {
    const result = extracted(
      section("Enquiry triage", [`${AI_INBOX_CLAIM} ${AI_INBOX_SCOPE}`]),
    );
    expect(featuresFor(result.claims, "classifies customer complaints")).toEqual([
      "Gmail AI Inbox",
    ]);
  });

  it("does not keep an earlier feature after a new named feature", () => {
    const result = extracted(
      section("Scheduling", [
        `${SCHEDULE_ANTECEDENT} ${GUEST_LIMIT} ${HELP_ME_WRITE_CLAIM} ${INACCURATE_SUGGESTIONS} ${ATTACHMENT_LIMIT}`,
      ]),
    );
    expect({
      guestLimit: featuresFor(result.claims, "20 guests"),
      suggestions: featuresFor(result.claims, "suggestions may be inaccurate"),
      attachments: featuresFor(result.claims, "delegated inboxes"),
    }).toEqual({
      guestLimit: ["Help me schedule"],
      suggestions: ["Help me write"],
      attachments: ["Help me write"],
    });
  });
});

describe("continuation controls that already hold", () => {
  it("keeps the engine at article-grounded-v12", () => {
    expect(CURRENT_RESEARCH_AUDIT_ENGINE_REVISION).toBe("article-grounded-v12");
  });

  it("still verifies a NIST compound claim from one document", () => {
    const verification = groundedFactVerification(
      [factualClaim(NIST_COMPOUND)],
      [
        {
          id: "next-words",
          sourceTitle: "NIST",
          sourceUrl: NIST_PDF,
          sourceType: "government",
          extractedText: NIST_NEXT_WORDS,
          confidence: 90,
          requiresHumanReview: true,
        },
        {
          id: "act-on-false",
          sourceTitle: "NIST",
          sourceUrl: NIST_PDF,
          sourceType: "government",
          extractedText: NIST_ACT_ON_FALSE,
          confidence: 90,
          requiresHumanReview: true,
        },
      ],
      NIST_COMPOUND,
    );
    expect(verification.facts[0]?.verificationStatus).toBe("verified");
    expect(verification.facts[0]?.verificationCount).toBe(1);
    expect(
      new Set(verification.facts[0]?.supportingSources.map((source) => source.sourceUrl)),
    ).toEqual(new Set([NIST_PDF]));
    expect(verification.facts[0]?.matchDiagnostics).toBeUndefined();
  });

  it("still accepts the official Help me write passage for its own claim", () => {
    const verification = groundedFactVerification(
      [factualClaim(HELP_ME_WRITE_CLAIM)],
      helpMeWriteEvidence(),
      HELP_ME_WRITE_CLAIM,
      [{ url: HELP_ME_WRITE_URL, title: HELP_ME_WRITE_TITLE }],
    );
    expect(verification.facts[0]?.verificationStatus).toBe("partially verified");
    expect([
      ...new Set(
        verification.facts[0]?.supportingSources.map((source) => source.sourceUrl) ?? [],
      ),
    ]).toEqual([HELP_ME_WRITE_URL]);
  });

  it("still rejects a publisher mismatch", () => {
    expect(
      claimAllowsEvidence(
        AI_INBOX_CLAIM,
        { url: MICROSOFT_URL, title: MICROSOFT_TITLE },
        [],
      ),
    ).toBe(false);
    const verification = groundedFactVerification(
      [factualClaim(AI_INBOX_CLAIM)],
      [
        {
          id: "microsoft-copy",
          sourceTitle: MICROSOFT_TITLE,
          sourceUrl: MICROSOFT_URL,
          sourceType: "html",
          extractedText: AI_INBOX_CLAIM,
          confidence: 80,
          requiresHumanReview: true,
        },
      ],
      AI_INBOX_CLAIM,
    );
    expect(verification.facts[0]?.verificationStatus).toBe("unverified");
    expect(verification.facts[0]?.supportingSources).toEqual([]);
    expect(verification.facts[0]?.matchDiagnostics?.[0]?.failureReason).toBe(
      "publisher-mismatch",
    );
  });

  it("downgrades publish-ready when factual candidates exceed 36", () => {
    const sentences = Array.from({ length: 37 }, (_, index) => {
      return `Google says documented limit ${index + 1} applies to eligible workspace guests in this help article.`;
    });
    const result = extracted(section("Limits", sentences));
    expect(result.claims).toHaveLength(36);
    expect(result.notScoredClaims).toHaveLength(1);
    expect(
      recommendationWithEvidenceCompleteness(
        "publish-ready",
        [
          {
            verificationStatus: "verified",
            supportingSources: [{ sourceUrl: "https://support.google.com/mail/answer/1" }],
          },
        ],
        result.notScoredClaims,
      ),
    ).toBe("review-required");
  });
});
