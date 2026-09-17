import { describe, expect, it } from "vitest";
import {
  extractArticleClaims,
  isAuthorialFraming,
  passageSupportsClaim,
} from "../../lib/research/article-claim-extractor";
import { groundedFactVerification } from "../../lib/research/claim-evidence-matcher";
import { contentFetcher } from "../../lib/research/content-fetcher";
import { isChromePassage } from "../../lib/research/evidence-chrome";
import { evidenceRegistry } from "../../lib/research/evidence-registry";
import { collectPdfPassages, pdfPassageSupportsClaim } from "../../lib/research/pdf-evidence";
import {
  dehyphenatePdfLineBreaks,
  extractPdfDocument,
  extractPdfText,
  isPdfChromeOnly,
  normalizePdfPageText,
  PdfExtractionError,
  stripRepeatedPdfChrome,
} from "../../lib/research/pdf-text-extractor";
import { prepareArticleForReview } from "../../lib/research/prepare-article-for-review";
import type {
  PrepareForReviewArticle,
  PrepareForReviewStore,
} from "../../lib/research/prepare-article-for-review";
import { CURRENT_RESEARCH_AUDIT_ENGINE_REVISION } from "../../lib/research/research-audit-engine-revision";
import {
  isUnavailableAcquisitionCategory,
} from "../../lib/research/source-acquisition";
import {
  RESEARCH_PDF_HARD_PAGE_LIMIT,
  RESEARCH_PDF_MAX_SCAN_CHARS,
} from "../../lib/research/source-fetch-guard";
import {
  ARTICLE_2_BODY,
  ARTICLE_2_CDO_AUTHORIAL,
  ARTICLE_2_EXCERPT,
  ARTICLE_2_TITLE,
  CDO_ARTICLE_HTML,
  CDO_KNOWLEDGE_PASSAGE,
  DELOITTE_ARTICLE_HTML,
  DELOITTE_SURVEY_PASSAGE,
  NIST_MONITORING_PASSAGE,
  NIST_PDF_PASSAGE,
  NIST_UNRELATED_PASSAGE,
  buildEncryptedPdf,
  buildMalformedPdf,
  buildPagedPdf,
  buildUncompressedPdf,
  fillerPdfPage,
} from "../fixtures/research-audit/article-2";

const NIST_URL = "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf";
const DELOITTE_URL =
  "https://www.deloitte.com/us/en/insights/topics/technology-management/ai-infrastructure-survey.html";
const PWC_URL = "https://www.pwc.com/us/en/tech-effect/ai-analytics/ai-predictions.html";
const CDO_URL =
  "https://www.cdomagazine.tech/opinion-analysis/why-the-knowledge-layer-is-the-next-frontier-for-ai-driven-business-automation";
const PUBLIC_LOOKUP = async () => [{ address: "93.184.216.34", family: 4 }];

const NIST_INTEGRATION_CLAIM =
  "NIST’s AI Risk Management Framework says AI risk management should be integrated into broader enterprise risk processes, and that organizations need accountability mechanisms, defined roles, and responsibilities for risk management to be effective.";
const NIST_MONITORING_CLAIM =
  "NIST emphasizes ongoing testing and monitoring for deployed AI systems and notes that human intervention may be needed when a system cannot detect or correct errors.";

function mockFetch(responses: Record<string, Response>): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    const response = responses[url];
    if (!response) return new Response("", { status: 404 });
    return response.clone();
  }) as typeof fetch;
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
  const persistReviewNote = async (args: { data: Record<string, unknown> }) => {
    article.reviewNotes.push({
      action: String(args.data.action),
      note: typeof args.data.note === "string" ? args.data.note : null,
    });
    return { id: `note-${article.reviewNotes.length}` };
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
          id: `audit-${article.researchAudits.length + 1}`,
          articleId: String(args.data.articleId),
          createdAt: new Date("2026-09-18T00:00:00.000Z"),
        };
        article.researchAudits.push(audit);
        createdAudits.push(args);
        return audit;
      },
    },
    articleReviewNote: { create: persistReviewNote },
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
    $transaction: async (fn) => fn(tx),
  };
  return { store, createdAudits, articleUpdates };
}

describe("article-grounded-v4 PDF evidence and coverage", () => {
  it("does not treat substantive PDF prose as HTML chrome", async () => {
    const pdf = await buildPagedPdf([
      "Table of Contents\nAll rights reserved\nPlease enable JavaScript\nSkip to main content",
      NIST_PDF_PASSAGE,
      NIST_MONITORING_PASSAGE,
    ]);
    const extracted = await extractPdfDocument(pdf);
    expect(extracted.pages.some((page) => page.text.includes("enterprise risk processes"))).toBe(
      true,
    );
    expect(isChromePassage(extracted.pages.map((page) => page.text).join(" "))).toBe(true);

    const result = await evidenceRegistry(
      ARTICLE_2_TITLE,
      [{ title: "NIST AI RMF", url: NIST_URL, sourceType: "government", relevanceScore: 90 }],
      {
        claimTexts: [NIST_INTEGRATION_CLAIM, NIST_MONITORING_CLAIM],
        lookup: PUBLIC_LOOKUP,
        fetch: mockFetch({
          [NIST_URL]: new Response(Buffer.from(pdf), {
            status: 200,
            headers: { "content-type": "application/pdf" },
          }),
        }),
      },
    );
    expect(result.sourceDiagnostics?.[0]?.category).toBe("accepted");
    expect(result.sourceDiagnostics?.[0]?.category).not.toBe("chrome_only");
    expect(result.evidence.some((item) => item.extractedText.includes("enterprise risk"))).toBe(
      true,
    );
  });

  it("removes repeated PDF headers and footers while keeping prose", () => {
    const pages = [
      "NIST AI RMF 1.0\nAccountability mechanisms require defined roles.\nPage 1",
      "NIST AI RMF 1.0\nOngoing testing and monitoring remain required.\nPage 2",
      "NIST AI RMF 1.0\nHuman intervention may be needed when a system cannot detect errors.\nPage 3",
    ];
    const stripped = stripRepeatedPdfChrome(pages);
    expect(stripped.every((page) => !/NIST AI RMF 1\.0/i.test(page))).toBe(true);
    expect(stripped.every((page) => !/^page \d+$/im.test(page))).toBe(true);
    expect(stripped[0]).toMatch(/Accountability mechanisms/);
    expect(isPdfChromeOnly("NIST AI RMF 1.0\n3\nPage 3")).toBe(true);
    expect(isPdfChromeOnly(NIST_PDF_PASSAGE)).toBe(false);
  });

  it("discovers relevant text after character 100000 on later pages", () => {
    const early = Array.from({ length: 50 }, (_, index) => ({
      pageNumber: index + 1,
      text: fillerPdfPage(index + 1, 2_200),
    }));
    const earlyChars = early.reduce((sum, page) => sum + page.text.length, 0);
    expect(earlyChars).toBeGreaterThan(100_000);

    const pages = [
      ...early,
      { pageNumber: 51, text: NIST_PDF_PASSAGE },
      { pageNumber: 52, text: NIST_MONITORING_PASSAGE },
    ];
    const scanned = collectPdfPassages({
      pages,
      claimTexts: [NIST_INTEGRATION_CLAIM, NIST_MONITORING_CLAIM],
      source: { url: NIST_URL, title: "NIST AI RMF" },
    });
    expect(scanned.passages.length).toBeGreaterThanOrEqual(2);
    expect(scanned.passages.some((passage) => passage.pageNumber > 50)).toBe(true);
    expect(
      scanned.passages.some((passage) =>
        passage.text.includes("accountability mechanisms"),
      ),
    ).toBe(true);
    expect(
      scanned.passages.some((passage) => passage.text.includes("ongoing testing")),
    ).toBe(true);
  });

  it("maps NIST evidence only to NIST claims and ignores unrelated NIST glossary text", () => {
    expect(
      pdfPassageSupportsClaim(NIST_INTEGRATION_CLAIM, NIST_PDF_PASSAGE),
    ).toBe(true);
    expect(
      pdfPassageSupportsClaim(NIST_MONITORING_CLAIM, NIST_MONITORING_PASSAGE),
    ).toBe(true);
    expect(pdfPassageSupportsClaim(NIST_INTEGRATION_CLAIM, NIST_UNRELATED_PASSAGE)).toBe(
      false,
    );
    expect(pdfPassageSupportsClaim(NIST_MONITORING_CLAIM, NIST_UNRELATED_PASSAGE)).toBe(
      false,
    );
    expect(
      passageSupportsClaim(DELOITTE_SURVEY_PASSAGE, NIST_PDF_PASSAGE, {
        documentKind: "pdf",
      }),
    ).toBe(false);

    const verification = groundedFactVerification(
      [
        {
          claim: NIST_INTEGRATION_CLAIM,
          articleExcerpt: NIST_INTEGRATION_CLAIM,
          section: "body",
          blockType: "paragraph",
          kind: "factual",
        },
        {
          claim: NIST_MONITORING_CLAIM,
          articleExcerpt: NIST_MONITORING_CLAIM,
          section: "body",
          blockType: "paragraph",
          kind: "factual",
        },
        {
          claim: DELOITTE_SURVEY_PASSAGE,
          articleExcerpt: DELOITTE_SURVEY_PASSAGE,
          section: "body",
          blockType: "paragraph",
          kind: "factual",
        },
      ],
      [
        {
          id: "nist-integration",
          sourceTitle: "NIST AI RMF",
          sourceUrl: NIST_URL,
          sourceType: "government",
          extractedText: NIST_PDF_PASSAGE,
          confidence: 95,
          requiresHumanReview: true,
        },
        {
          id: "nist-monitoring",
          sourceTitle: "NIST AI RMF",
          sourceUrl: NIST_URL,
          sourceType: "government",
          extractedText: NIST_MONITORING_PASSAGE,
          confidence: 95,
          requiresHumanReview: true,
        },
        {
          id: "nist-glossary",
          sourceTitle: "NIST AI RMF",
          sourceUrl: NIST_URL,
          sourceType: "government",
          extractedText: NIST_UNRELATED_PASSAGE,
          confidence: 95,
          requiresHumanReview: true,
        },
      ],
      `${NIST_INTEGRATION_CLAIM} ${NIST_MONITORING_CLAIM} ${DELOITTE_SURVEY_PASSAGE}`,
    );
    expect(
      verification.facts.find((fact) => fact.claim === NIST_INTEGRATION_CLAIM)
        ?.verificationStatus,
    ).toBe("verified");
    expect(
      verification.facts.find((fact) => fact.claim === NIST_MONITORING_CLAIM)
        ?.verificationStatus,
    ).toBe("verified");
    expect(
      verification.facts.find((fact) => fact.claim === DELOITTE_SURVEY_PASSAGE)
        ?.verificationStatus,
    ).toBe("unverified");
    expect(verification.acceptedEvidence.every((item) => item.sourceUrl === NIST_URL)).toBe(
      true,
    );
  });

  it("dehyphenates line breaks without joining unrelated text", () => {
    expect(dehyphenatePdfLineBreaks("manage-\nment of AI risk")).toBe(
      "management of AI risk",
    );
    expect(dehyphenatePdfLineBreaks("AI-\nRisk Management")).toBe("AI-\nRisk Management");
    expect(normalizePdfPageText("enter-\nprise risk\n\nNext section")).toContain(
      "enterprise risk",
    );
    expect(normalizePdfPageText("enter-\nprise risk\n\nNext section")).toContain(
      "Next section",
    );
  });

  it("fails closed for oversized, malformed, encrypted, slow, or excessive-page PDFs", async () => {
    await expect(extractPdfText(buildEncryptedPdf())).rejects.toMatchObject({
      category: "encrypted_pdf",
    });
    await expect(extractPdfText(buildMalformedPdf())).rejects.toMatchObject({
      category: "malformed_pdf",
    });

    const slow = await contentFetcher(NIST_URL, "NIST", {
      lookup: PUBLIC_LOOKUP,
      pdfParseTimeoutMs: 30,
      extractPdf: async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return NIST_PDF_PASSAGE;
      },
      fetch: mockFetch({
        [NIST_URL]: new Response(Buffer.from(await buildUncompressedPdf(NIST_PDF_PASSAGE)), {
          status: 200,
          headers: { "content-type": "application/pdf" },
        }),
      }),
    });
    expect(slow.diagnostic.category).toBe("pdf_parse_timeout");
    expect(slow.diagnostic.parseDurationCategory).toBe("timeout");

    const excessive = await contentFetcher(NIST_URL, "NIST", {
      lookup: PUBLIC_LOOKUP,
      extractPdf: async () => {
        throw new PdfExtractionError(
          "pdf_page_limit",
          "PDF page count exceeded the bounded scan limit before relevant passages were found.",
        );
      },
      fetch: mockFetch({
        [NIST_URL]: new Response(Buffer.from(await buildUncompressedPdf(NIST_PDF_PASSAGE)), {
          status: 200,
          headers: { "content-type": "application/pdf" },
        }),
      }),
    });
    expect(excessive.diagnostic.category).toBe("pdf_page_limit");

    const pageLimited = collectPdfPassages({
      pages: Array.from({ length: 5 }, (_, index) => ({
        pageNumber: index + 1,
        text: fillerPdfPage(index + 1),
      })),
      claimTexts: [NIST_INTEGRATION_CLAIM],
      source: { url: NIST_URL, title: "NIST AI RMF" },
      pageLimitReached: true,
    });
    expect(pageLimited.categoryIfEmpty).toBe("pdf_page_limit");
    expect(isUnavailableAcquisitionCategory("pdf_page_limit")).toBe(true);

    let chars = 0;
    const oversizedPages = [];
    while (chars <= RESEARCH_PDF_MAX_SCAN_CHARS) {
      const text = "a".repeat(20_000);
      oversizedPages.push({ pageNumber: oversizedPages.length + 1, text });
      chars += text.length;
    }
    const textLimited = collectPdfPassages({
      pages: oversizedPages,
      claimTexts: [NIST_INTEGRATION_CLAIM],
      source: { url: NIST_URL, title: "NIST AI RMF" },
    });
    expect(textLimited.textLimitReached).toBe(true);
    expect(textLimited.categoryIfEmpty).toBe("pdf_text_limit");
    expect(RESEARCH_PDF_HARD_PAGE_LIMIT).toBeGreaterThan(80);
  });

  it("does not count reachable CDO with no match as unavailable", async () => {
    const claims = extractArticleClaims({
      title: ARTICLE_2_TITLE,
      excerpt: ARTICLE_2_EXCERPT,
      content: ARTICLE_2_BODY,
    });
    expect(claims.claims.some((claim) => /CDO Magazine distinguishes/i.test(claim.claim))).toBe(
      true,
    );
    expect(isAuthorialFraming(ARTICLE_2_CDO_AUTHORIAL)).toBe(true);
    expect(
      claims.claims.some((claim) => /architectural interpretation/i.test(claim.claim)),
    ).toBe(false);

    const result = await evidenceRegistry(
      ARTICLE_2_TITLE,
      [
        { title: "NIST AI RMF", url: NIST_URL, sourceType: "government", relevanceScore: 90 },
        {
          title: "Deloitte survey",
          url: DELOITTE_URL,
          sourceType: "industry-research",
          relevanceScore: 80,
        },
        {
          title: "PwC 2026",
          url: PWC_URL,
          sourceType: "professional-services-analysis",
          relevanceScore: 80,
        },
        {
          title: "CDO Magazine",
          url: CDO_URL,
          sourceType: "secondary-industry-analysis",
          relevanceScore: 70,
        },
      ],
      {
        claimTexts: claims.claims
          .map((claim) => claim.claim)
          .filter((claim) => !/CDO Magazine/i.test(claim)),
        lookup: PUBLIC_LOOKUP,
        fetch: mockFetch({
          [NIST_URL]: new Response(Buffer.from(await buildUncompressedPdf(NIST_PDF_PASSAGE)), {
            status: 200,
            headers: { "content-type": "application/pdf" },
          }),
          [DELOITTE_URL]: new Response(DELOITTE_ARTICLE_HTML, {
            status: 200,
            headers: { "content-type": "text/html" },
          }),
          [PWC_URL]: new Response("forbidden", {
            status: 403,
            headers: { "content-type": "text/html" },
          }),
          [CDO_URL]: new Response(CDO_ARTICLE_HTML, {
            status: 200,
            headers: { "content-type": "text/html" },
          }),
        }),
      },
    );

    const cdo = result.sourceDiagnostics?.find((item) => item.hostname === "www.cdomagazine.tech");
    const pwc = result.sourceDiagnostics?.find((item) => item.hostname === "www.pwc.com");
    expect(cdo?.category).toBe("no_relevant_passage");
    expect(pwc?.category).toBe("http_forbidden");
    expect(result.unavailableSourceCount).toBe(1);
    expect(result.availableSourceCount).toBe(3);
    expect(result.noRelevantPassageCount).toBe(1);
    expect(isUnavailableAcquisitionCategory("no_relevant_passage")).toBe(false);
    expect(isUnavailableAcquisitionCategory("http_forbidden")).toBe(true);
  });

  it("includes factual CDO attribution when the Magazine sentence is present", async () => {
    const claims = extractArticleClaims({
      title: ARTICLE_2_TITLE,
      excerpt: ARTICLE_2_EXCERPT,
      content: ARTICLE_2_BODY,
    });
    const result = await evidenceRegistry(ARTICLE_2_TITLE, [
      {
        title: "CDO Magazine",
        url: CDO_URL,
        sourceType: "secondary-industry-analysis",
        relevanceScore: 70,
      },
    ], {
      claimTexts: claims.claims.map((claim) => claim.claim),
      lookup: PUBLIC_LOOKUP,
      fetch: mockFetch({
        [CDO_URL]: new Response(CDO_ARTICLE_HTML, {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      }),
    });
    expect(result.sourceDiagnostics?.[0]?.category).toBe("accepted");
    expect(result.evidence[0]?.extractedText).toContain("business-ready context");
    expect(result.evidence[0]?.extractedText).not.toMatch(/architectural interpretation/i);
    expect(CDO_KNOWLEDGE_PASSAGE).toMatch(/CDO Magazine distinguishes/);
  });

  it("labels availability, relevant coverage, and accepted coverage separately", async () => {
    const article = article2();
    const { store } = createStore(article);
    const result = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence: async () => ({
        topic: article.title,
        evidenceCount: 2,
        registryStatus: "ok",
        listedSourceCount: 4,
        acceptedSourceCount: 2,
        availableSourceCount: 3,
        unavailableSourceCount: 1,
        noRelevantPassageCount: 1,
        sourceDiagnostics: [
          {
            sourceId: "nist",
            hostname: "nvlpubs.nist.gov",
            documentType: "pdf",
            category: "accepted",
            httpStatusCategory: "ok",
            bytesReceived: 1946127,
            extractedCharacterCount: 120000,
            acceptedPassageCount: 2,
            rejectionReason: "",
            pagesParsed: 48,
            pagesScanned: 48,
            textLimitReached: false,
            parseDurationCategory: "fast",
          },
          {
            sourceId: "deloitte",
            hostname: "www.deloitte.com",
            documentType: "html",
            category: "accepted",
            httpStatusCategory: "ok",
            bytesReceived: 404120,
            extractedCharacterCount: 25085,
            acceptedPassageCount: 2,
            rejectionReason: "",
          },
          {
            sourceId: "pwc",
            hostname: "www.pwc.com",
            documentType: "unknown",
            category: "http_forbidden",
            httpStatusCategory: "forbidden",
            bytesReceived: 0,
            extractedCharacterCount: 0,
            acceptedPassageCount: 0,
            rejectionReason: "Source refused the request.",
          },
          {
            sourceId: "cdo",
            hostname: "www.cdomagazine.tech",
            documentType: "html",
            category: "no_relevant_passage",
            httpStatusCategory: "ok",
            bytesReceived: 235816,
            extractedCharacterCount: 8197,
            acceptedPassageCount: 0,
            rejectionReason: "Source text was reachable but not relevant to the audited claims.",
          },
        ],
        evidence: [
          {
            id: "nist-1",
            sourceTitle: "NIST AI RMF",
            sourceUrl: NIST_URL,
            sourceType: "government",
            extractedText: NIST_PDF_PASSAGE,
            confidence: 95,
            requiresHumanReview: true,
          },
          {
            id: "deloitte-1",
            sourceTitle: "Deloitte",
            sourceUrl: DELOITTE_URL,
            sourceType: "primary-survey",
            extractedText: DELOITTE_SURVEY_PASSAGE,
            confidence: 70,
            requiresHumanReview: true,
          },
        ],
      }),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.audit.engineRevision).toBe(CURRENT_RESEARCH_AUDIT_ENGINE_REVISION);
    expect(result.audit.unavailableSourceCount).toBe(1);
    expect(result.audit.listedSourceAvailability).toBe(75);
    expect(result.audit.sourceCoverage).toBe(50);
    expect(result.audit.acceptedEvidenceCoverage).toBe(50);
    expect(result.sourceDiagnostics.find((item) => item.hostname === "www.cdomagazine.tech")?.category).toBe(
      "no_relevant_passage",
    );
    expect(JSON.stringify(result.sourceDiagnostics)).not.toMatch(
      /cookie=|authorization|secret|192\.168|stack|ECONN/i,
    );
  });

  it("writes nothing when PDF acquisition fails before persistence", async () => {
    const article = article2();
    const { store, createdAudits, articleUpdates } = createStore(article);
    const result = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence: async () => ({
        topic: article.title,
        evidence: [],
        evidenceCount: 0,
        registryStatus: "No useful evidence available after filtering.",
        listedSourceCount: 1,
        acceptedSourceCount: 0,
        availableSourceCount: 0,
        unavailableSourceCount: 1,
        sourceDiagnostics: [
          {
            sourceId: "nist",
            hostname: "nvlpubs.nist.gov",
            documentType: "pdf",
            category: "pdf_parse_timeout",
            httpStatusCategory: "ok",
            bytesReceived: 1946127,
            extractedCharacterCount: 0,
            acceptedPassageCount: 0,
            rejectionReason: "PDF parsing exceeded the bounded time budget.",
            parseDurationCategory: "timeout",
          },
        ],
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

  it("does not leak PDF bodies through diagnostics", async () => {
    const fetched = await contentFetcher(NIST_URL, "NIST AI RMF", {
      lookup: PUBLIC_LOOKUP,
      fetch: mockFetch({
        [NIST_URL]: new Response(
          Buffer.from(await buildPagedPdf([fillerPdfPage(1), NIST_PDF_PASSAGE])),
          { status: 200, headers: { "content-type": "application/pdf" } },
        ),
      }),
    });
    expect(fetched.diagnostic.documentType).toBe("pdf");
    expect(fetched.extractedText).toContain("enterprise risk processes");
    expect(JSON.stringify(fetched.diagnostic)).not.toContain("enterprise risk processes");
    expect(fetched.diagnostic.pagesParsed).toBeGreaterThan(0);
  });
});
