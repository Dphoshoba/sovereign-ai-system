import { describe, expect, it } from "vitest";
import {
  CREATOR_TEMPLATE_CLAIMS,
  extractArticleClaims,
  passageSupportsClaim,
} from "../../lib/research/article-claim-extractor";
import { groundedFactVerification } from "../../lib/research/claim-evidence-matcher";
import { contentFetcher } from "../../lib/research/content-fetcher";
import { evidenceRegistry } from "../../lib/research/evidence-registry";
import { extractHtmlDocument } from "../../lib/research/html-text-extractor";
import { extractPdfText } from "../../lib/research/pdf-text-extractor";
import { prepareArticleForReview } from "../../lib/research/prepare-article-for-review";
import type {
  PrepareForReviewArticle,
  PrepareForReviewStore,
} from "../../lib/research/prepare-article-for-review";
import { isChromePassage } from "../../lib/research/evidence-chrome";
import { CURRENT_RESEARCH_AUDIT_ENGINE_REVISION } from "../../lib/research/research-audit-engine-revision";
import { assertSafeResearchUrl } from "../../lib/research/source-fetch-guard";
import {
  ARTICLE_2_BODY,
  ARTICLE_2_EXCERPT,
  ARTICLE_2_TITLE,
  CDO_ARTICLE_HTML,
  CDO_DRUPAL_HTML,
  CDO_KNOWLEDGE_PASSAGE,
  CREATOR_TEMPLATE_STRINGS,
  DELOITTE_ARTICLE_HTML,
  DELOITTE_CHROME_HTML,
  NIST_PDF_PASSAGE,
  PWC_ARTICLE_HTML,
  PWC_HTML_PASSAGE,
  buildUncompressedPdf,
} from "../fixtures/research-audit/article-2";

const NIST_URL = "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf";
const PWC_URL = "https://www.pwc.com/ai-predictions";
const DELOITTE_URL = "https://www.deloitte.com/ai-survey";
const CDO_URL = "https://www.cdomagazine.tech/knowledge-layer";
const PUBLIC_LOOKUP = async () => [{ address: "93.184.216.34", family: 4 }];

function article2(): PrepareForReviewArticle {
  return {
    id: "article-2",
    title: ARTICLE_2_TITLE,
    slug: "ai-business-infrastructure-founders-ministries-teams",
    category: "ai-tools",
    status: "review-required",
    excerpt: ARTICLE_2_EXCERPT,
    content: ARTICLE_2_BODY,
    featuredImage: "/generated/article-2.png",
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
          createdAt: new Date("2026-09-16T13:00:00.000Z"),
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

function mockFetch(responses: Record<string, Response>): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    const response = responses[url];
    if (!response) {
      return new Response("", { status: 404 });
    }
    return response.clone();
  }) as typeof fetch;
}

describe("research-audit extraction integrity", () => {
  it("extracts only claims that occur in the article and rejects creator templates", () => {
    const extracted = extractArticleClaims({
      title: ARTICLE_2_TITLE,
      excerpt: ARTICLE_2_EXCERPT,
      content: ARTICLE_2_BODY,
    });
    const normalized = [
      ARTICLE_2_TITLE,
      ARTICLE_2_EXCERPT,
      ARTICLE_2_BODY,
    ].join(" ");

    expect(extracted.claimCount).toBeGreaterThan(0);
    for (const claim of extracted.claims) {
      expect(claim.kind).toBe("factual");
      expect(normalized).toContain(claim.articleExcerpt);
      expect(normalized).toContain(claim.claim);
      expect(claim.section === "title" || claim.section === "excerpt" || claim.section === "body").toBe(
        true,
      );
    }
    expect(
      extracted.claims.some((claim) =>
        CREATOR_TEMPLATE_CLAIMS.includes(
          claim.claim as (typeof CREATOR_TEMPLATE_CLAIMS)[number],
        ),
      ),
    ).toBe(false);
    for (const template of CREATOR_TEMPLATE_STRINGS) {
      expect(
        extracted.claims.some((claim) =>
          claim.claim.toLowerCase().includes(template),
        ),
      ).toBe(false);
    }
  });

  it("excludes headings, rhetorical framing, and cross-block concatenation", () => {
    const extracted = extractArticleClaims({
      title: ARTICLE_2_TITLE,
      excerpt: ARTICLE_2_EXCERPT,
      content: ARTICLE_2_BODY,
    });
    const claims = extracted.claims.map((claim) => claim.claim);

    expect(claims.some((claim) => /from creator tools to organizational infrastructure/i.test(claim))).toBe(
      false,
    );
    expect(claims.some((claim) => /that can be useful/i.test(claim))).toBe(false);
    expect(claims.some((claim) => /this article takes the next step/i.test(claim))).toBe(false);
    expect(claims.some((claim) => /see nist ai rmf/i.test(claim))).toBe(false);
    expect(
      claims.some((claim) =>
        claim.includes("organizational infrastructure A one-off"),
      ),
    ).toBe(false);
    expect(
      extracted.claims.some((claim) =>
        claim.claim.includes("AI risk management should be integrated"),
      ),
    ).toBe(true);
    expect(
      extracted.claims.some((claim) =>
        claim.claim.includes("Deloitte reports that enterprise AI applications"),
      ),
    ).toBe(true);
  });

  it("rejects HTML boilerplate and retains relevant HTML passages", () => {
    const chrome = extractHtmlDocument(DELOITTE_CHROME_HTML);
    const relevant = extractHtmlDocument(PWC_ARTICLE_HTML);

    expect(chrome.extractedText).not.toMatch(/please enable javascript/i);
    expect(chrome.extractedText).not.toMatch(/register now/i);
    expect(isChromePassage(DELOITTE_CHROME_HTML)).toBe(true);
    expect(relevant.extractedText).toContain(PWC_HTML_PASSAGE);
    expect(relevant.extractedText).not.toMatch(/subscribe to our newsletter/i);

    const cdo = extractHtmlDocument(CDO_DRUPAL_HTML);
    expect(cdo.extractedText).toContain(CDO_KNOWLEDGE_PASSAGE);
    expect(cdo.extractedText).not.toMatch(/subscribe sign in|cookie policy/i);
    expect(extractHtmlDocument(CDO_ARTICLE_HTML).extractedText).toContain(
      CDO_KNOWLEDGE_PASSAGE,
    );
  });

  it("extracts PDF passages and maps them to the matching article claim", async () => {
    const pdfText = await extractPdfText(await buildUncompressedPdf(NIST_PDF_PASSAGE));
    expect(pdfText).toContain(
      "AI risk management should be integrated into broader enterprise risk processes",
    );

    const claims = extractArticleClaims({
      title: ARTICLE_2_TITLE,
      excerpt: ARTICLE_2_EXCERPT,
      content: ARTICLE_2_BODY,
    });
    const riskClaim = claims.claims.find((claim) =>
      claim.claim.includes("AI risk management should be integrated"),
    );
    expect(riskClaim).toBeDefined();
    expect(passageSupportsClaim(riskClaim!.claim, pdfText)).toBe(true);
  });

  it("fails closed for inaccessible or unextractable sources", async () => {
    await expect(
      assertSafeResearchUrl("http://www.nist.gov/artificial-intelligence"),
    ).rejects.toThrow(/https/);
    await expect(
      assertSafeResearchUrl("https://127.0.0.1/secret"),
    ).rejects.toThrow(/not allowed/);

    const fetched = await contentFetcher(
      "https://www.pwc.com/ai-predictions",
      "PwC",
      {
        lookup: PUBLIC_LOOKUP,
        fetch: mockFetch({
          "https://www.pwc.com/ai-predictions": new Response("not a document", {
            status: 200,
            headers: { "content-type": "application/octet-stream" },
          }),
        }),
      },
    );
    expect(fetched.fetchStatus).toBe("failed");
    expect(fetched.extractedText).toBe("");

    const htmlAsPdf = await contentFetcher(NIST_URL, "NIST", {
      lookup: PUBLIC_LOOKUP,
      fetch: mockFetch({
        [NIST_URL]: new Response(DELOITTE_CHROME_HTML, {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      }),
    });
    expect(htmlAsPdf.fetchStatus).toBe("failed");
  });

  it("does not let irrelevant chrome verify a claim", () => {
    const claims = extractArticleClaims({
      title: ARTICLE_2_TITLE,
      excerpt: ARTICLE_2_EXCERPT,
      content: ARTICLE_2_BODY,
    });
    const verification = groundedFactVerification(
      claims.claims,
      [
        {
          id: "chrome-1",
          sourceTitle: "Deloitte",
          sourceUrl: DELOITTE_URL,
          sourceType: "industry-research",
          extractedText:
            "Please enable JavaScript. Register now. Related content, audience engagement, and content performance insights.",
          confidence: 80,
          requiresHumanReview: true,
        },
      ],
      claims.normalizedArticleText,
    );

    expect(verification.verifiedCount).toBe(0);
    expect(verification.acceptedEvidence).toHaveLength(0);
    expect(
      verification.facts.every(
        (fact) => fact.verificationStatus === "unverified",
      ),
    ).toBe(true);
  });

  it("collects PDF and relevant HTML evidence while dropping chrome and recording a 403 as unavailable", async () => {
    const sources = [
      {
        title: "NIST AI RMF",
        url: NIST_URL,
        sourceType: "government",
        relevanceScore: 90,
      },
      {
        title: "PwC 2026",
        url: PWC_URL,
        sourceType: "industry-research",
        relevanceScore: 80,
      },
      {
        title: "Deloitte survey",
        url: DELOITTE_URL,
        sourceType: "industry-research",
        relevanceScore: 80,
      },
      {
        title: "CDO Magazine",
        url: CDO_URL,
        sourceType: "research-media",
        relevanceScore: 70,
      },
    ];
    const claims = extractArticleClaims({
      title: ARTICLE_2_TITLE,
      excerpt: ARTICLE_2_EXCERPT,
      content: ARTICLE_2_BODY,
    });
    const result = await evidenceRegistry(ARTICLE_2_TITLE, sources, {
      claimTexts: claims.claims.map((claim) => claim.claim),
      lookup: PUBLIC_LOOKUP,
      fetch: mockFetch({
        [NIST_URL]: new Response(Buffer.from(await buildUncompressedPdf(NIST_PDF_PASSAGE)), {
          status: 200,
          headers: { "content-type": "application/pdf" },
        }),
        [PWC_URL]: new Response(PWC_ARTICLE_HTML, {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
        [DELOITTE_URL]: new Response(DELOITTE_ARTICLE_HTML, {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
        [CDO_URL]: new Response(CDO_ARTICLE_HTML, {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      }),
    });

    expect(result.evidence.some((item) => item.sourceUrl === NIST_URL)).toBe(
      true,
    );
    expect(result.evidence.some((item) => item.sourceUrl === PWC_URL)).toBe(
      true,
    );
    expect(result.evidence.some((item) => item.sourceUrl === DELOITTE_URL)).toBe(
      true,
    );
    expect(result.evidence.some((item) => item.sourceUrl === CDO_URL)).toBe(
      true,
    );
    expect(
      result.evidence.some((item) =>
        /please enable javascript|register now|content performance insights/i.test(
          item.extractedText,
        ),
      ),
    ).toBe(false);

    const verification = groundedFactVerification(
      claims.claims,
      result.evidence,
      claims.normalizedArticleText,
    );
    const risk = verification.facts.find((fact) =>
      fact.claim.includes("AI risk management should be integrated"),
    );
    const infrastructure = verification.facts.find((fact) =>
      fact.claim.includes("business infrastructure"),
    );
    expect(risk?.verificationStatus).toBe("verified");
    expect(risk?.evidenceText).toContain("enterprise risk processes");
    expect(infrastructure?.verificationStatus).not.toBe("unverified");
    expect(infrastructure?.sourceUrl).toBe(PWC_URL);
  });

  it("writes nothing when preparation cannot extract claim-relevant evidence", async () => {
    const article = article2();
    const { store, createdAudits, articleUpdates } = createStore(article);
    const result = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence: async () => ({
        topic: article.title,
        evidence: [],
        evidenceCount: 0,
        registryStatus: "No useful evidence available after filtering.",
      }),
    });

    expect(result).toMatchObject({
      ok: false,
      code: "missing_evidence",
      articleUnchanged: true,
    });
    expect(createdAudits).toHaveLength(0);
    expect(articleUpdates).toHaveLength(0);
  });

  it("persists only accepted evidence and stamps the current engine revision", async () => {
    const article = article2();
    const { store, createdAudits } = createStore(article);
    const result = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence: async () => ({
        topic: article.title,
        evidenceCount: 2,
        registryStatus: "ok",
        evidence: [
          {
            id: "nist-chunk-1",
            sourceTitle: "NIST AI RMF",
            sourceUrl: NIST_URL,
            sourceType: "government",
            extractedText: NIST_PDF_PASSAGE,
            confidence: 95,
            requiresHumanReview: true,
          },
          {
            id: "pwc-chunk-1",
            sourceTitle: "PwC 2026 AI predictions",
            sourceUrl: PWC_URL,
            sourceType: "industry-research",
            extractedText: PWC_HTML_PASSAGE,
            confidence: 80,
            requiresHumanReview: true,
          },
        ],
      }),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.audit.engineRevision).toBe(
      CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
    );
    expect(result.audit.verifiedCount).toBeGreaterThan(0);
    const stored = createdAudits[0] as { data: { facts: Array<{ claim: string; articleExcerpt?: string }>; evidence: Array<{ extractedText: string }> } };
    for (const fact of stored.data.facts) {
      expect(ARTICLE_2_TITLE + " " + ARTICLE_2_EXCERPT + " " + ARTICLE_2_BODY).toContain(
        fact.articleExcerpt || fact.claim,
      );
    }
    expect(
      stored.data.evidence.some((item) =>
        /javascript|register now|cookie/i.test(item.extractedText),
      ),
    ).toBe(false);
  });

  it("keeps independent HTML/PDF evidence when one source is forbidden", async () => {
    const sources = [
      {
        title: "NIST AI RMF",
        url: NIST_URL,
        sourceType: "government",
        relevanceScore: 90,
      },
      {
        title: "PwC 2026",
        url: PWC_URL,
        sourceType: "industry-research",
        relevanceScore: 80,
      },
      {
        title: "Deloitte survey",
        url: DELOITTE_URL,
        sourceType: "industry-research",
        relevanceScore: 80,
      },
    ];
    const claims = extractArticleClaims({
      title: ARTICLE_2_TITLE,
      excerpt: ARTICLE_2_EXCERPT,
      content: ARTICLE_2_BODY,
    });
    const result = await evidenceRegistry(ARTICLE_2_TITLE, sources, {
      claimTexts: claims.claims.map((claim) => claim.claim),
      lookup: PUBLIC_LOOKUP,
      fetch: mockFetch({
        [NIST_URL]: new Response(Buffer.from(await buildUncompressedPdf(NIST_PDF_PASSAGE)), {
          status: 200,
          headers: { "content-type": "application/pdf" },
        }),
        [PWC_URL]: new Response("forbidden", {
          status: 403,
          headers: { "content-type": "text/html" },
        }),
        [DELOITTE_URL]: new Response(DELOITTE_ARTICLE_HTML, {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      }),
    });

    expect(result.evidence.some((item) => item.sourceUrl === NIST_URL)).toBe(true);
    expect(result.evidence.some((item) => item.sourceUrl === DELOITTE_URL)).toBe(true);
    expect(result.evidence.some((item) => item.sourceUrl === PWC_URL)).toBe(false);
    expect(
      result.sourceDiagnostics?.find((item) => item.hostname === "www.pwc.com")?.category,
    ).toBe("http_forbidden");
    expect(result.unavailableSourceCount).toBe(1);
    expect(JSON.stringify(result.sourceDiagnostics)).not.toMatch(
      /authorization|set-cookie|cookie=|192\.168|stack|ECONNREFUSED/i,
    );
  });

  it("returns structured diagnostics and writes nothing when every source is unusable", async () => {
    const article = article2();
    const { store, createdAudits, articleUpdates } = createStore(article);
    const result = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence: async () => ({
        topic: article.title,
        evidence: [],
        evidenceCount: 0,
        registryStatus: "No useful evidence available after filtering.",
        listedSourceCount: 2,
        acceptedSourceCount: 0,
        unavailableSourceCount: 2,
        sourceDiagnostics: [
          {
            sourceId: "pwc-2026",
            hostname: "www.pwc.com",
            documentType: "unknown",
            category: "http_forbidden",
            httpStatusCategory: "forbidden",
            bytesReceived: 0,
            extractedCharacterCount: 0,
            acceptedPassageCount: 0,
            rejectionReason: "Source refused the request.",
          },
        ],
      }),
    });

    expect(result).toMatchObject({
      ok: false,
      code: "missing_evidence",
      articleUnchanged: true,
    });
    if (!result.ok) {
      expect(result.sourceDiagnostics?.[0]?.category).toBe("http_forbidden");
      expect(JSON.stringify(result.sourceDiagnostics)).not.toMatch(
        /secret|authorization|set-cookie|stack/i,
      );
    }
    expect(createdAudits).toHaveLength(0);
    expect(articleUpdates).toHaveLength(0);
  });

  it("lowers coverage when a listed source is unavailable but others are accepted", async () => {
    const article = article2();
    const { store } = createStore(article);
    const result = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence: async () => ({
        topic: article.title,
        evidenceCount: 1,
        registryStatus: "ok",
        listedSourceCount: 4,
        acceptedSourceCount: 1,
        unavailableSourceCount: 3,
        evidence: [
          {
            id: "nist-chunk-1",
            sourceTitle: "NIST AI RMF",
            sourceUrl: NIST_URL,
            sourceType: "government",
            extractedText: NIST_PDF_PASSAGE,
            confidence: 95,
            requiresHumanReview: true,
          },
        ],
      }),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.audit.unavailableSourceCount).toBe(3);
    expect(result.audit.sourceCoverage).toBe(25);
  });
});
