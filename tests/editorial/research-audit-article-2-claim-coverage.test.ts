import { describe, expect, it } from "vitest";
import {
  extractArticleClaims,
  FACTUAL_CLAIM_CEILING,
  FACTUAL_CLAIM_LIMIT,
  hasPublisherAttribution,
  isAuthorialFraming,
  recommendationWithUnscoredClaims,
} from "../../lib/research/article-claim-extractor";
import { groundedFactVerification } from "../../lib/research/claim-evidence-matcher";
import {
  claimAllowsEvidence,
  evidenceCorroborationKey,
  publishersNamedInClaim,
} from "../../lib/research/claim-source-attribution";
import {
  PUBLISH_READY_CONSENSUS_SCORE,
  PUBLISH_READY_SOURCE_QUALITY_SCORE,
} from "../../lib/research/consensus-engine";
import { prepareArticleForReview } from "../../lib/research/prepare-article-for-review";
import type {
  PrepareForReviewArticle,
  PrepareForReviewStore,
} from "../../lib/research/prepare-article-for-review";
import {
  CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
  isCurrentResearchAuditEngineRevision,
  isResearchAuditEngineRevision,
} from "../../lib/research/research-audit-engine-revision";
import type { EvidenceRecord } from "../../lib/research/evidence-registry";

const TASKS = [
  "Customer email",
  "Appointment scheduling",
  "Social media content",
  "Meeting summaries",
  "Customer enquiry triage",
  "Invoice and payment reminders",
  "Business reporting",
] as const;

const PRODUCT_CLAIMS = [
  "Microsoft's Outlook help says Copilot can draft a customer email that a person reviews before it is sent.",
  "Google's Gmail help says suggested appointment times come from calendars the user can access.",
  "Meta's labelling page says an AI label can be applied to content on Facebook and Instagram.",
  "Microsoft's Teams help says a meeting recap can include notes that a person still checks.",
  "Google's Gmail help says the inbox can suggest which customer enquiries need a reply first.",
  "Intuit's QuickBooks page says a payment reminder can be prepared for a person to review.",
  "Microsoft's Excel help says Copilot can answer a question about data in a workbook.",
] as const;

const NIST_LISTS_CLAIM =
  "NIST also lists data-privacy impacts that a small business should review before it adopts a new tool.";

const ADVICE_CLAIM =
  "A named person still checks the draft before the business sends it to a customer.";

const START_CLAIM =
  "Start with one inbox and review the draft before anything goes out to a customer.";

const FICTION_CLAIM =
  "Microsoft's Outlook help says this imagined customer received a perfect draft without any review at all.";

function productArticle(): string {
  return [
    NIST_LISTS_CLAIM,
    ...TASKS.map(
      (task, index) => `## ${task}\n\n${PRODUCT_CLAIMS[index]}\n\n${ADVICE_CLAIM}`,
    ),
    `## Fictional illustration\n\n${FICTION_CLAIM}`,
    START_CLAIM,
  ].join("\n\n");
}

function studyClaim(task: string, pass: number, percent: number): string {
  return `A controlled study found that content production time for ${task} pass ${pass} fell by ${percent} percent in the audited report.`;
}

function overflowArticle(): string {
  const sections = TASKS.map((task, index) => {
    const first = studyClaim(task, 1, 41 + index);
    const second = studyClaim(task, 2, 48 + index);
    return `## ${task}\n\n${first}\n\n${second}`;
  });
  return [NIST_LISTS_CLAIM, ...sections, `## Fictional illustration\n\n${FICTION_CLAIM}`].join(
    "\n\n",
  );
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

function evidence(id: string, url: string, text: string): EvidenceRecord {
  return {
    id,
    sourceTitle: url,
    sourceUrl: url,
    sourceType: "documented-source",
    extractedText: text,
    confidence: 80,
    requiresHumanReview: true,
  };
}

const LEARN = "https://learn.microsoft.com/copilot-privacy";
const SUPPORT = "https://support.microsoft.com/outlook/copilot";
const GMAIL = "https://support.google.com/mail/answer/13955415";
const WORKSPACE = "https://knowledge.workspace.google.com/privacy";
const META = "https://about.fb.com/news/2024/02/labeling-ai-generated-images";
const FACEBOOK = "https://www.facebook.com/help/ai-labels";
const QUICKBOOKS = "https://quickbooks.intuit.com/learn-support/payments-ai";
const XERO = "https://central.xero.com/s/article/About-Just-Ask-Xero-JAX";
const NIST = "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf";
const NIST_HTML = "https://www.nist.gov/publications/ai-rmf";

describe("article 2 claim coverage", () => {
  it("scores one attributed claim from each task section and keeps the lists sentence", () => {
    const extracted = extractArticleClaims({
      title: "7 Small Business Tasks You Can Automate With AI",
      excerpt: "A person still checks the draft before it is sent.",
      content: productArticle(),
    });

    expect(extracted.claimCount).toBeLessThanOrEqual(FACTUAL_CLAIM_LIMIT);
    expect(extracted.notScoredClaims).toEqual([]);
    for (const task of TASKS) {
      expect(extracted.claims.some((claim) => claim.heading === task)).toBe(true);
    }
    expect(extracted.claims.map((claim) => claim.claim)).toContain(NIST_LISTS_CLAIM);
    expect(extracted.claims.map((claim) => claim.claim)).toEqual(
      expect.arrayContaining([...PRODUCT_CLAIMS]),
    );
    expect(hasPublisherAttribution(NIST_LISTS_CLAIM)).toBe(true);
    expect(isAuthorialFraming(ADVICE_CLAIM)).toBe(true);
    expect(isAuthorialFraming(START_CLAIM)).toBe(true);
    expect(extracted.claims.some((claim) => claim.claim === ADVICE_CLAIM)).toBe(false);
    expect(extracted.claims.some((claim) => claim.claim === START_CLAIM)).toBe(false);
    expect(extracted.claims.some((claim) => claim.claim === FICTION_CLAIM)).toBe(false);
    expect(
      extracted.authorialAssertions.some((claim) => claim.claim === FICTION_CLAIM),
    ).toBe(true);
  });

  it("keeps every task section inside the 12-fact cap and records the overflow", () => {
    const extracted = extractArticleClaims({ content: overflowArticle() });
    const scoredHeadings = new Set(
      extracted.claims.map((claim) => claim.heading).filter(Boolean),
    );

    expect(extracted.claimCount).toBe(FACTUAL_CLAIM_LIMIT);
    expect(extracted.notScoredClaims.length).toBeGreaterThan(0);
    for (const task of TASKS) {
      expect(scoredHeadings.has(task)).toBe(true);
    }
    expect(extracted.claims.some((claim) => claim.claim === NIST_LISTS_CLAIM)).toBe(true);
    expect(extracted.claims.some((claim) => claim.claim === FICTION_CLAIM)).toBe(false);
    for (const omitted of extracted.notScoredClaims) {
      expect(omitted.text.length).toBeGreaterThan(40);
      expect(TASKS).toContain(omitted.section);
      expect(extracted.claims.some((claim) => claim.claim === omitted.text)).toBe(false);
    }
    expect(extracted.notScoredClaims.map((claim) => claim.section)).toEqual([
      "Customer enquiry triage",
      "Invoice and payment reminders",
      "Business reporting",
    ]);
  });
});

describe("publisher corroboration", () => {
  const microsoftClaim =
    "Microsoft's Outlook help says Copilot can draft a customer email that a person reviews before it is sent.";

  it("treats Microsoft hosts as one publisher and rejects a Google page", () => {
    expect(publishersNamedInClaim(microsoftClaim)).toEqual(["microsoft"]);
    expect(evidenceCorroborationKey(microsoftClaim, { url: LEARN })).toBe(
      "publisher:microsoft",
    );
    expect(evidenceCorroborationKey(microsoftClaim, { url: SUPPORT })).toBe(
      "publisher:microsoft",
    );
    const verification = groundedFactVerification(
      [factualClaim(microsoftClaim)],
      [
        evidence("learn", LEARN, microsoftClaim),
        evidence("support", SUPPORT, microsoftClaim),
        evidence("gmail", GMAIL, microsoftClaim),
      ],
      microsoftClaim,
    );
    expect(verification.facts[0]?.verificationCount).toBe(1);
    expect(verification.facts[0]?.verificationStatus).toBe("partially verified");
    expect(verification.facts[0]?.supportingSources.map((source) => source.sourceUrl)).toEqual([
      LEARN,
    ]);
    expect(claimAllowsEvidence(microsoftClaim, { url: GMAIL })).toBe(false);
  });

  it("binds Google, Meta, Intuit, Xero and NIST only to their host families", () => {
    const googleClaim =
      "Google's Gmail help says suggested appointment times come from calendars the user can access.";
    const metaClaim =
      "Meta's labelling page says an AI label can be applied to content on Facebook and Instagram.";
    const intuitClaim =
      "Intuit's QuickBooks page says a payment reminder can be prepared for a person to review.";
    const xeroClaim =
      "Xero's JAX page says no data is used unless the user sends a message to the assistant.";
    const nistClaim =
      "NIST says generative models can present false content with confident wording in a profile.";

    expect(claimAllowsEvidence(googleClaim, { url: GMAIL })).toBe(true);
    expect(claimAllowsEvidence(googleClaim, { url: WORKSPACE })).toBe(true);
    expect(claimAllowsEvidence(googleClaim, { url: LEARN })).toBe(false);
    expect(evidenceCorroborationKey(googleClaim, { url: GMAIL })).toBe("publisher:google");
    expect(evidenceCorroborationKey(googleClaim, { url: WORKSPACE })).toBe("publisher:google");

    expect(claimAllowsEvidence(metaClaim, { url: META })).toBe(true);
    expect(claimAllowsEvidence(metaClaim, { url: FACEBOOK })).toBe(true);
    expect(claimAllowsEvidence(metaClaim, { url: GMAIL })).toBe(false);
    expect(evidenceCorroborationKey(metaClaim, { url: META })).toBe("publisher:meta");
    expect(evidenceCorroborationKey(metaClaim, { url: FACEBOOK })).toBe("publisher:meta");

    expect(claimAllowsEvidence(intuitClaim, { url: QUICKBOOKS })).toBe(true);
    expect(claimAllowsEvidence(intuitClaim, { url: XERO })).toBe(false);
    expect(claimAllowsEvidence(xeroClaim, { url: XERO })).toBe(true);
    expect(claimAllowsEvidence(xeroClaim, { url: QUICKBOOKS })).toBe(false);
    expect(claimAllowsEvidence(nistClaim, { url: NIST })).toBe(true);
    expect(claimAllowsEvidence(nistClaim, { url: NIST_HTML })).toBe(true);
    expect(claimAllowsEvidence(nistClaim, { url: LEARN })).toBe(false);
    expect(evidenceCorroborationKey(nistClaim, { url: NIST })).toBe("publisher:nist");
    expect(evidenceCorroborationKey(nistClaim, { url: NIST_HTML })).toBe("publisher:nist");
  });

  it("counts two publishers as corroboration and keeps one publisher partial", () => {
    const combined =
      "Microsoft's help says drafts need a person to review them, and Google's help says Gmail suggestions also need a person to check them before sending.";
    const verification = groundedFactVerification(
      [factualClaim(combined)],
      [
        evidence("learn", LEARN, combined),
        evidence("support", SUPPORT, combined),
        evidence("gmail", GMAIL, combined),
      ],
      combined,
    );
    expect(verification.facts[0]?.verificationCount).toBe(2);
    expect(verification.facts[0]?.verificationStatus).toBe("verified");
    expect(new Set(verification.facts[0]?.supportingSources.map((source) => source.sourceUrl))).toEqual(
      new Set([LEARN, GMAIL]),
    );
  });
});

describe("unscored claims and audit revision", () => {
  it("keeps the publication thresholds and blocks publish-ready when claims are unscored", () => {
    expect(PUBLISH_READY_CONSENSUS_SCORE).toBe(80);
    expect(PUBLISH_READY_SOURCE_QUALITY_SCORE).toBe(70);
    expect(recommendationWithUnscoredClaims("publish-ready", [])).toBe("publish-ready");
    expect(recommendationWithUnscoredClaims("review-required", [])).toBe("review-required");
    expect(
      recommendationWithUnscoredClaims("blocked", [
        { text: "x", section: "Customer email" },
      ]),
    ).toBe("blocked");
    expect(
      recommendationWithUnscoredClaims("publish-ready", [
        { text: "A later claim", section: "Business reporting" },
      ]),
    ).toBe("review-required");
  });

  it("stores review-required when the cap leaves eligible claims unscored", async () => {
    const extra = Array.from({ length: 30 }, (_, index) => {
      return `## Extra ${index}\n\nA controlled study found that content production time for extra section ${index} pass 3 fell by ${60 + index} percent in the audited report.`;
    });
    const content = [overflowArticle(), ...extra].join("\n\n");
    const extracted = extractArticleClaims({
      content,
      factualClaimLimit: FACTUAL_CLAIM_CEILING,
    });
    const urls = ["https://www.nist.gov/one", "https://www.nih.gov/two"];
    const passage = extracted.claims.map((claim) => claim.claim).join(" ");
    const evidenceRecords = urls.map((url, index) => evidence(`gov-${index}`, url, passage));
    const article: PrepareForReviewArticle = {
      id: "article-coverage",
      title: "Seven tasks",
      slug: "seven-tasks",
      category: "ai-automation",
      status: "draft",
      excerpt: "A person still checks the work.",
      content,
      featuredImage: null,
      seoTitle: "Seven tasks",
      seoDescription: "A person still checks the work before it is sent.",
      seoKeywords: "ai",
      researchSources: [
        {
          title: "NIST",
          url: NIST,
          sourceType: "government",
          authorityScore: 100,
          trustScore: 100,
        },
      ],
      researchAudits: [],
      reviewNotes: [],
    };
    const store: PrepareForReviewStore = {
      article: {
        findUnique: async () => article,
        update: async () => article,
      },
      articleResearchAudit: {
        create: async () => ({
          id: "audit-coverage",
          createdAt: new Date("2026-11-04T00:00:00.000Z"),
        }),
      },
      articleReviewNote: {
        create: async () => ({ id: "note-coverage" }),
      },
      $queryRaw: async () => [{ id: article.id }],
      $transaction: async (fn) =>
        fn({
          article: store.article,
          articleResearchAudit: store.articleResearchAudit,
          articleReviewNote: store.articleReviewNote,
          $queryRaw: store.$queryRaw,
        }),
    };

    const result = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence: async () => ({
        topic: article.title,
        evidence: evidenceRecords,
        evidenceCount: evidenceRecords.length,
        registryStatus: "ok",
        listedSourceCount: 1,
        acceptedSourceCount: evidenceRecords.length,
      }),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.audit.consensusScore).toBeGreaterThanOrEqual(PUBLISH_READY_CONSENSUS_SCORE);
    expect(result.audit.notScoredClaims.length).toBeGreaterThan(0);
    expect(result.audit.publicationRecommendation).toBe("review-required");
    expect(result.audit.engineRevision).toBe("article-grounded-v11");
  });

  it("keeps v9 and v10 readable and makes v11 the current revision", () => {
    expect(CURRENT_RESEARCH_AUDIT_ENGINE_REVISION).toBe("article-grounded-v11");
    expect(isResearchAuditEngineRevision("article-grounded-v9")).toBe(true);
    expect(isResearchAuditEngineRevision("article-grounded-v10")).toBe(true);
    expect(isCurrentResearchAuditEngineRevision("article-grounded-v9")).toBe(false);
    expect(isCurrentResearchAuditEngineRevision("article-grounded-v10")).toBe(false);
    expect(isCurrentResearchAuditEngineRevision("article-grounded-v11")).toBe(true);
  });
});
