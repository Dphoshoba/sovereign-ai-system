import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  extractArticleClaims,
  isAuthorialFraming,
} from "../../lib/research/article-claim-extractor";
import { groundedFactVerification } from "../../lib/research/claim-evidence-matcher";
import {
  claimAllowsEvidence,
  publishersNamedInClaim,
} from "../../lib/research/claim-source-attribution";
import { contentFetcher } from "../../lib/research/content-fetcher";
import { evidenceRegistry } from "../../lib/research/evidence-registry";
import { extractHtmlDocument } from "../../lib/research/html-text-extractor";
import { prepareArticleForReview } from "../../lib/research/prepare-article-for-review";
import type {
  PrepareForReviewArticle,
  PrepareForReviewStore,
} from "../../lib/research/prepare-article-for-review";
import { CURRENT_RESEARCH_AUDIT_ENGINE_REVISION } from "../../lib/research/research-audit-engine-revision";
import {
  parseArticleAuditAssociation,
  partitionAssociatedArticleAudits,
  serializeArticleAuditAssociation,
} from "../../lib/research/article-audit-association";
import { publicationGuard } from "../../lib/publishing/publication-guard";
import { resolveArticleAuditState } from "../../lib/research/current-article-audit";
import { withResearchTimeout } from "../../lib/research/source-fetch-guard";
import {
  ARTICLE_2_BODY,
  ARTICLE_2_CLASSIFICATION_BODY,
  ARTICLE_2_CDO_AUTHORIAL,
  ARTICLE_2_EXCERPT,
  ARTICLE_2_FIVE_LAYER_MODEL,
  ARTICLE_2_RECOMMENDATION,
  ARTICLE_2_SYNTHESIS_DISCLAIMER,
  ARTICLE_2_TITLE,
  ARTICLE_2_WORKING_DEFINITION,
  CDO_DRUPAL_HTML,
  CDO_KNOWLEDGE_PASSAGE,
  DELOITTE_SURVEY_PASSAGE,
  NIST_PDF_PASSAGE,
  PWC_HTML_PASSAGE,
  buildLargeNistStylePdf,
} from "../fixtures/research-audit/article-2";

const NIST_URL = "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf";
const PWC_URL = "https://www.pwc.com/us/en/tech-effect/ai-analytics/ai-predictions.html";
const DELOITTE_URL =
  "https://www.deloitte.com/us/en/insights/topics/technology-management/ai-infrastructure-survey.html";
const PUBLIC_LOOKUP = async () => [{ address: "93.184.216.34", family: 4 }];

const NIST_CLAIM =
  "NIST’s AI Risk Management Framework says AI risk management should be integrated into broader enterprise risk processes.";
const PWC_CLAIM =
  "PwC notes that many organizations report modest efficiency or capacity gains while broader productivity claims can remain difficult to measure.";
const SYNTHESIS_CLAIM =
  "See NIST and PwC together: AI risk management should be integrated into broader enterprise risk processes, and leaders should treat AI as business infrastructure rather than a collection of isolated tools.";

function deloitteEvidence(text = DELOITTE_SURVEY_PASSAGE) {
  return {
    id: "deloitte-chunk-1",
    sourceTitle: "Deloitte AI infrastructure survey",
    sourceUrl: DELOITTE_URL,
    sourceType: "primary-survey",
    extractedText: text,
    confidence: 70,
    requiresHumanReview: true,
  };
}

function nistEvidence() {
  return {
    id: "nist-chunk-1",
    sourceTitle: "NIST AI RMF",
    sourceUrl: NIST_URL,
    sourceType: "government",
    extractedText: NIST_PDF_PASSAGE,
    confidence: 95,
    requiresHumanReview: true,
  };
}

function pwcEvidence() {
  return {
    id: "pwc-chunk-1",
    sourceTitle: "PwC 2026 AI predictions",
    sourceUrl: PWC_URL,
    sourceType: "professional-services-analysis",
    extractedText: PWC_HTML_PASSAGE,
    confidence: 80,
    requiresHumanReview: true,
  };
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

function article2(): PrepareForReviewArticle {
  return {
    id: "article-2",
    title: ARTICLE_2_TITLE,
    slug: "ai-business-infrastructure-founders-ministries-teams",
    category: "ai-tools",
    status: "review-required",
    excerpt: ARTICLE_2_EXCERPT,
    content: ARTICLE_2_BODY,
    featuredImage: null,
    seoTitle: ARTICLE_2_TITLE,
    seoDescription: ARTICLE_2_EXCERPT,
    seoKeywords: "AI infrastructure, governance",
    researchSources: [],
    researchAudits: [],
    reviewNotes: [],
  };
}

function createStore(article: PrepareForReviewArticle) {
  const createdAudits: unknown[] = [];
  const articleUpdates: unknown[] = [];
  const reviewNotes: unknown[] = [];
  const audits = [...article.researchAudits];
  let transactionQueue = Promise.resolve();
  const persistReviewNote = async (args: { data: Record<string, unknown> }) => {
    reviewNotes.push(args);
    article.reviewNotes.push({
      action: String(args.data.action),
      note: typeof args.data.note === "string" ? args.data.note : null,
    });
    return { id: `note-${reviewNotes.length}` };
  };
  const tx = {
    article: {
      findUnique: async () => article,
      update: async (args: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        articleUpdates.push(args);
        return { id: article.id, ...args.data };
      },
    },
    articleResearchAudit: {
      create: async (args: { data: Record<string, unknown> }) => {
        const audit = {
          id: `audit-${audits.length + 1}`,
          articleId: String(args.data.articleId),
          createdAt: new Date("2026-09-17T10:00:00.000Z"),
        };
        audits.push(audit);
        article.researchAudits.push(audit);
        createdAudits.push(args);
        return audit;
      },
    },
    articleReviewNote: {
      create: persistReviewNote,
    },
    $queryRaw: async () => [{ id: article.id }],
  };
  const store: PrepareForReviewStore = {
    article: {
      findUnique: async () => article,
      update: tx.article.update,
    },
    articleResearchAudit: tx.articleResearchAudit,
    articleReviewNote: tx.articleReviewNote,
    $queryRaw: tx.$queryRaw,
    $transaction: async (fn) => {
      const run = transactionQueue.then(async () => {
        const snapshots = {
          createdAudits: createdAudits.length,
          articleUpdates: articleUpdates.length,
          reviewNotes: reviewNotes.length,
          audits: audits.length,
          articleAudits: article.researchAudits.length,
          articleNotes: article.reviewNotes.length,
        };
        try {
          return await fn(tx);
        } catch (error) {
          createdAudits.splice(snapshots.createdAudits);
          articleUpdates.splice(snapshots.articleUpdates);
          reviewNotes.splice(snapshots.reviewNotes);
          audits.splice(snapshots.audits);
          article.researchAudits.splice(snapshots.articleAudits);
          article.reviewNotes.splice(snapshots.articleNotes);
          throw error;
        }
      });
      transactionQueue = run.then(
        () => undefined,
        () => undefined,
      );
      return run;
    },
  };
  return { store, createdAudits, articleUpdates };
}

describe("article-grounded-v4 attribution, PDF evidence, and classification", () => {
  it("does not let Deloitte evidence verify an explicit NIST claim", () => {
    expect(publishersNamedInClaim(NIST_CLAIM)).toEqual(["nist"]);
    expect(
      claimAllowsEvidence(NIST_CLAIM, {
        url: DELOITTE_URL,
        title: "Deloitte AI infrastructure survey",
      }),
    ).toBe(false);

    const verification = groundedFactVerification(
      [factualClaim(NIST_CLAIM)],
      [
        deloitteEvidence(
          "NIST-style risk management (64%) and enterprise risk processes at Deloitte.",
        ),
      ],
      NIST_CLAIM,
    );
    expect(verification.facts[0]?.verificationStatus).toBe("unverified");
    expect(verification.facts[0]?.sourceUrl).toBe("");
    expect(verification.acceptedEvidence).toHaveLength(0);
  });

  it("does not let Deloitte evidence verify an explicit PwC claim", () => {
    const verification = groundedFactVerification(
      [factualClaim(PWC_CLAIM)],
      [deloitteEvidence(`${PWC_CLAIM} ${PWC_HTML_PASSAGE}`)],
      PWC_CLAIM,
    );
    expect(verification.facts[0]?.verificationStatus).toBe("unverified");
    expect(verification.acceptedEvidence).toHaveLength(0);
  });

  it("does not let NIST evidence verify a Deloitte survey claim", () => {
    const verification = groundedFactVerification(
      [factualClaim(DELOITTE_SURVEY_PASSAGE)],
      [nistEvidence()],
      DELOITTE_SURVEY_PASSAGE,
    );
    expect(verification.facts[0]?.verificationStatus).toBe("unverified");
  });

  it("lets the named publisher verify its attributed claim", () => {
    const nist = groundedFactVerification(
      [factualClaim(NIST_CLAIM)],
      [nistEvidence(), deloitteEvidence()],
      NIST_CLAIM,
    );
    expect(nist.facts[0]?.verificationStatus).toBe("verified");
    expect(nist.facts[0]?.sourceUrl).toBe(NIST_URL);

    const deloitte = groundedFactVerification(
      [factualClaim(DELOITTE_SURVEY_PASSAGE)],
      [nistEvidence(), deloitteEvidence()],
      DELOITTE_SURVEY_PASSAGE,
    );
    expect(deloitte.facts[0]?.sourceUrl).toBe(DELOITTE_URL);
    expect(deloitte.facts[0]?.verificationStatus).not.toBe("unverified");
  });

  it("leaves an attributed claim unverified when its named source is unavailable", () => {
    const verification = groundedFactVerification(
      [factualClaim(PWC_CLAIM)],
      [nistEvidence(), deloitteEvidence()],
      PWC_CLAIM,
    );
    expect(verification.facts[0]?.verificationStatus).toBe("unverified");
    expect(verification.unverifiedCount).toBe(1);
  });

  it("keeps multi-source synthesis mappings attributable to each publisher", () => {
    expect(publishersNamedInClaim(SYNTHESIS_CLAIM).sort()).toEqual(["nist", "pwc"]);
    const verification = groundedFactVerification(
      [factualClaim(SYNTHESIS_CLAIM)],
      [nistEvidence(), pwcEvidence(), deloitteEvidence()],
      SYNTHESIS_CLAIM,
    );
    const urls = verification.facts[0]?.supportingSources.map((source) => source.sourceUrl) ?? [];
    expect(urls).toContain(NIST_URL);
    expect(urls).toContain(PWC_URL);
    expect(urls).not.toContain(DELOITTE_URL);
  });

  it("excludes the Article 2 five-layer model, disclaimer, definition, and recommendations from factual scoring", () => {
    expect(isAuthorialFraming(ARTICLE_2_FIVE_LAYER_MODEL)).toBe(true);
    expect(isAuthorialFraming(ARTICLE_2_SYNTHESIS_DISCLAIMER)).toBe(true);
    expect(isAuthorialFraming(ARTICLE_2_WORKING_DEFINITION)).toBe(true);
    expect(isAuthorialFraming(ARTICLE_2_RECOMMENDATION)).toBe(true);
    expect(isAuthorialFraming(ARTICLE_2_CDO_AUTHORIAL)).toBe(true);

    const extracted = extractArticleClaims({
      title: ARTICLE_2_TITLE,
      excerpt: ARTICLE_2_EXCERPT,
      content: ARTICLE_2_CLASSIFICATION_BODY,
    });
    const claims = extracted.claims.map((claim) => claim.claim);
    expect(claims.some((claim) => /five parts—context and memory/i.test(claim))).toBe(false);
    expect(claims.some((claim) => /our synthesis/i.test(claim))).toBe(false);
    expect(claims.some((claim) => /for this article/i.test(claim))).toBe(false);
    expect(claims.some((claim) => /start with one recurring/i.test(claim))).toBe(false);
    expect(claims.some((claim) => /CDO Magazine distinguishes/i.test(claim))).toBe(true);
    expect(claims.some((claim) => /architectural interpretation/i.test(claim))).toBe(false);
    expect(
      extracted.authorialAssertions.some((claim) =>
        claim.claim.includes("five parts"),
      ),
    ).toBe(true);

    const verification = groundedFactVerification(
      extracted.claims,
      [nistEvidence(), deloitteEvidence()],
      extracted.normalizedArticleText,
    );
    expect(
      verification.facts.some((fact) => /our synthesis|five-layer model/i.test(fact.claim)),
    ).toBe(false);
    expect(verification.facts.some((fact) => /NIST/.test(fact.claim))).toBe(true);
  });

  it("returns sanitized diagnostics on successful and failed Prepare for Review", async () => {
    const diagnostics = [
      {
        sourceId: "nist-ai-rmf",
        hostname: "nvlpubs.nist.gov",
        documentType: "pdf" as const,
        category: "accepted" as const,
        httpStatusCategory: "ok" as const,
        bytesReceived: 1946127,
        extractedCharacterCount: 1200,
        acceptedPassageCount: 1,
        rejectionReason: "",
      },
      {
        sourceId: "pwc-2026",
        hostname: "www.pwc.com",
        documentType: "unknown" as const,
        category: "http_forbidden" as const,
        httpStatusCategory: "forbidden" as const,
        bytesReceived: 0,
        extractedCharacterCount: 0,
        acceptedPassageCount: 0,
        rejectionReason: "Source refused the request.",
      },
    ];

    const successArticle = article2();
    const successStore = createStore(successArticle);
    const success = await prepareArticleForReview(successArticle.id, {
      prisma: successStore.store,
      collectEvidence: async () => ({
        topic: successArticle.title,
        evidenceCount: 1,
        registryStatus: "ok",
        listedSourceCount: 2,
        acceptedSourceCount: 1,
        unavailableSourceCount: 1,
        sourceDiagnostics: diagnostics,
        evidence: [nistEvidence()],
      }),
    });
    expect(success.ok).toBe(true);
    if (!success.ok) return;
    expect(success.sourceDiagnostics).toEqual(diagnostics);
    expect(success.audit.engineRevision).toBe("article-grounded-v4");
    expect(JSON.stringify(success.sourceDiagnostics)).not.toMatch(
      /cookie|authorization|secret|192\.168|stack|ECONN/i,
    );

    const failedArticle = article2();
    const failedStore = createStore(failedArticle);
    const failed = await prepareArticleForReview(failedArticle.id, {
      prisma: failedStore.store,
      collectEvidence: async () => ({
        topic: failedArticle.title,
        evidence: [],
        evidenceCount: 0,
        registryStatus: "No useful evidence available after filtering.",
        listedSourceCount: 1,
        acceptedSourceCount: 0,
        unavailableSourceCount: 1,
        sourceDiagnostics: [diagnostics[1]],
      }),
    });
    expect(failed).toMatchObject({
      ok: false,
      code: "missing_evidence",
      articleUnchanged: true,
    });
    if (failed.ok) return;
    expect(failed.sourceDiagnostics?.[0]?.category).toBe("http_forbidden");
    expect(failedStore.createdAudits).toHaveLength(0);
    expect(failedStore.articleUpdates).toHaveLength(0);
  });

  it("extracts CDO-style CMS HTML and keeps NIST-sized PDFs within bounded limits", async () => {
    const html = extractHtmlDocument(CDO_DRUPAL_HTML);
    expect(html.extractedText).toContain(CDO_KNOWLEDGE_PASSAGE);
    expect(html.extractedText).not.toMatch(/subscribe sign in|cookie policy/i);

    const large = await buildLargeNistStylePdf(NIST_PDF_PASSAGE);
    const result = await evidenceRegistry(
      ARTICLE_2_TITLE,
      [{ title: "NIST AI RMF", url: NIST_URL, sourceType: "government", relevanceScore: 90 }],
      {
        claimTexts: [NIST_CLAIM],
        lookup: PUBLIC_LOOKUP,
        fetch: (async () =>
          new Response(Buffer.from(large), {
            status: 200,
            headers: { "content-type": "application/pdf" },
          })) as typeof fetch,
      },
    );
    expect(result.sourceDiagnostics?.[0]?.category).toBe("accepted");
    expect(result.evidence[0]?.extractedText).toContain("enterprise risk processes");
  });

  it("bounds slow fetch and slow parsing without leaking internals", async () => {
    const fetched = await contentFetcher("https://example.com/slow", "Slow", {
      lookup: PUBLIC_LOOKUP,
      fetchTimeoutMs: 40,
      fetch: (async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return new Response("late", { status: 200, headers: { "content-type": "text/html" } });
      }) as typeof fetch,
    });
    expect(fetched.diagnostic.category).toBe("timeout");
    expect(JSON.stringify(fetched.diagnostic)).not.toMatch(/stack|ECONN|192\.168/i);

    await expect(
      withResearchTimeout(30, "pdf_parse_timeout", "PDF parsing exceeded the bounded time budget.", async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return "done";
      }),
    ).rejects.toMatchObject({ category: "pdf_parse_timeout" });
  });

  it("makes a v3 audit historical under v4 and rejects it for approval and scheduling", () => {
    const article = {
      id: "article-2",
      title: ARTICLE_2_TITLE,
      excerpt: ARTICLE_2_EXCERPT,
      content: ARTICLE_2_BODY,
      category: "ai-tools",
      seoTitle: ARTICLE_2_TITLE,
      seoDescription: ARTICLE_2_EXCERPT,
      seoKeywords: "AI",
      featuredImage: null,
      researchSources: [{ url: NIST_URL, title: "NIST" }],
      researchAudits: [
        {
          id: "cmu5wqygk000004l99516re6e",
          articleId: "article-2",
          createdAt: new Date("2026-09-17T19:13:36.500Z"),
        },
      ],
      reviewNotes: [
        {
          action: "research-audit-fingerprint",
          note: serializeArticleAuditAssociation({
            auditId: "cmu5wqygk000004l99516re6e",
            contentFingerprint: "70d82efb37eeb458ed23403376bbb578d1bc0d54eb1927189397a1f82a04f0a9",
            createdAt: new Date("2026-09-17T19:13:36.500Z"),
            engineRevision: "article-grounded-v3",
          }),
        },
      ],
    };

    const parsed = parseArticleAuditAssociation(article.reviewNotes[0]);
    expect(parsed?.engineRevision).toBe("article-grounded-v3");
    expect(parsed?.engineRevision).not.toBe(CURRENT_RESEARCH_AUDIT_ENGINE_REVISION);

    const partitioned = partitionAssociatedArticleAudits(
      article,
      [NIST_URL],
      article.researchAudits,
      article.reviewNotes,
    );
    expect(partitioned.current).toBeNull();
    expect(partitioned.historical).toHaveLength(1);

    const resolved = resolveArticleAuditState(article);
    expect(resolved.currentAudit).toBeNull();
    expect(publicationGuard("approved", { hasCurrentAudit: Boolean(resolved.currentAudit) }).allowed).toBe(
      false,
    );
    expect(publicationGuard("scheduled", { hasCurrentAudit: false }).allowed).toBe(false);
  });

  it("permits exactly one v4 replacement and rejects a concurrent duplicate", async () => {
    const article = article2();
    const { store, createdAudits } = createStore(article);
    const collectEvidence = async () => ({
      topic: article.title,
      evidenceCount: 1,
      registryStatus: "ok",
      sourceDiagnostics: [
        {
          sourceId: "nist-ai-rmf",
          hostname: "nvlpubs.nist.gov",
          documentType: "pdf" as const,
          category: "accepted" as const,
          httpStatusCategory: "ok" as const,
          bytesReceived: 100,
          extractedCharacterCount: 80,
          acceptedPassageCount: 1,
          rejectionReason: "",
        },
      ],
      evidence: [nistEvidence()],
    });

    const first = await prepareArticleForReview(article.id, { prisma: store, collectEvidence });
    const second = await prepareArticleForReview(article.id, { prisma: store, collectEvidence });
    expect(first.ok).toBe(true);
    expect(second).toMatchObject({
      ok: false,
      code: "duplicate_audit",
      articleUnchanged: true,
    });
    expect(createdAudits).toHaveLength(1);
    if (first.ok) {
      expect(first.audit.engineRevision).toBe("article-grounded-v4");
    }
  });

  it("includes unpdf in the server runtime package list", () => {
    const config = readFileSync(resolve("next.config.ts"), "utf8");
    expect(config).toMatch(/serverExternalPackages:[\s\S]*"unpdf"/);
    expect(config).toMatch(
      /outputFileTracingIncludes:[\s\S]*"\/api\/articles\/prepare-for-review"[\s\S]*unpdf/,
    );
  });
});
