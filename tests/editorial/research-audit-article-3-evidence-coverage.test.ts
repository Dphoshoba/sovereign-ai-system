import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { extractArticleClaims } from "../../lib/research/article-claim-extractor";
import {
  RESEARCH_AUDIT_FINGERPRINT_ACTION,
  partitionAssociatedArticleAudits,
  serializeArticleAuditAssociation,
} from "../../lib/research/article-audit-association";
import { computeArticleAuditFingerprint } from "../../lib/research/article-audit-fingerprint";
import { groundedFactVerification } from "../../lib/research/claim-evidence-matcher";
import { selectClaimAwareEvidence } from "../../lib/research/claim-evidence-selector";
import { resolveArticleAuditState } from "../../lib/research/current-article-audit";
import { evidenceChunker } from "../../lib/research/evidence-chunker";
import { evidenceRegistry } from "../../lib/research/evidence-registry";
import { extractHtmlDocument } from "../../lib/research/html-text-extractor";
import { isOutlineOrIndexPassage } from "../../lib/research/evidence-chrome";
import { prepareArticleForReview } from "../../lib/research/prepare-article-for-review";
import type {
  PrepareForReviewArticle,
  PrepareForReviewStore,
} from "../../lib/research/prepare-article-for-review";
import { publicationGuard } from "../../lib/publishing/publication-guard";
import { researchAuditCoverage } from "../../lib/research/research-audit-coverage";
import { CURRENT_RESEARCH_AUDIT_ENGINE_REVISION } from "../../lib/research/research-audit-engine-revision";
import { parseScriptureVerseRanges } from "../../lib/research/scripture-verse-locator";
import {
  RESEARCH_MAX_PASSAGES_PER_CLAIM,
  RESEARCH_MAX_UNIQUE_AUDIT_PASSAGES,
} from "../../lib/research/source-fetch-guard";
import {
  ARTICLE_3_BODY,
  ARTICLE_3_EXCERPT,
  ARTICLE_3_SOURCES,
  ARTICLE_3_TITLE,
  BIBLEGATEWAY_HTML,
  BIBLEGATEWAY_TITLE,
  BIBLEGATEWAY_URL,
  BIBLEGATEWAY_VICTORY_PASSAGE,
  BIBLEPROJECT_KING_DAVID_HTML,
  BIBLEPROJECT_KING_DAVID_TITLE,
  BIBLEPROJECT_KING_DAVID_URL,
  BIBLEPROJECT_SAUL_ARC_CLAIM,
  BIBLEPROJECT_SAMUEL_GUIDE_FAILURE_PASSAGE,
  BIBLEPROJECT_SAMUEL_GUIDE_HTML,
  BIBLEPROJECT_SAMUEL_GUIDE_TITLE,
  BIBLEPROJECT_SAMUEL_GUIDE_URL,
  KING_DAVID_ARMOUR_CLAIM,
  SAMUEL_GUIDE_FAILURE_CLAIM,
  SAMUEL_GUIDE_LEADERS_CLAIM,
  SAMUEL_GUIDE_OUTLINE_PASSAGE,
  SCRIPTURE_ARMIES_CLAIM,
  SCRIPTURE_ARMOUR_CLAIM,
  SCRIPTURE_CHALLENGE_CLAIM,
  SCRIPTURE_HEARS_CLAIM,
  SCRIPTURE_JESSE_CLAIM,
  SCRIPTURE_STONES_CLAIM,
  SCRIPTURE_VOLUNTEERS_CLAIM,
  SCRIPTURE_VICTORY_CLAIM,
} from "../fixtures/research-audit/article-3";

const LISTED_SOURCES = ARTICLE_3_SOURCES.map((source) => ({
  url: source.url,
  title: source.title,
  publisher: source.publisher,
}));

const PUBLIC_LOOKUP = async () => [{ address: "93.184.216.34", family: 4 }];

function mockFetch(responses: Record<string, Response>): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    const response = responses[url];
    if (!response) return new Response("", { status: 404 });
    return response.clone();
  }) as typeof fetch;
}

function article3Sources() {
  return ARTICLE_3_SOURCES.map((source) => ({
    title: source.title,
    url: source.url,
    sourceType: "research",
    relevanceScore: 80,
  }));
}

function article3Fetch() {
  return mockFetch({
    [BIBLEGATEWAY_URL]: new Response(BIBLEGATEWAY_HTML, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    }),
    [BIBLEPROJECT_SAMUEL_GUIDE_URL]: new Response(BIBLEPROJECT_SAMUEL_GUIDE_HTML, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    }),
    [BIBLEPROJECT_KING_DAVID_URL]: new Response(BIBLEPROJECT_KING_DAVID_HTML, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    }),
  });
}

function article3(): PrepareForReviewArticle {
  return {
    id: "article-3",
    title: ARTICLE_3_TITLE,
    slug: "david-and-goliath-a-careful-practical-reading",
    category: "faith",
    status: "review-required",
    excerpt: ARTICLE_3_EXCERPT,
    content: ARTICLE_3_BODY,
    featuredImage: null,
    seoTitle: ARTICLE_3_TITLE,
    seoDescription: ARTICLE_3_EXCERPT,
    seoKeywords: "1 Samuel 17, David, Goliath",
    researchSources: ARTICLE_3_SOURCES.map((source) => ({
      url: source.url,
      title: source.title,
    })),
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
          createdAt: new Date("2026-09-22T07:00:00.000Z"),
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

function factFor(verification: ReturnType<typeof groundedFactVerification>, claim: string) {
  return verification.facts.find((fact) => fact.claim === claim);
}

describe("article-grounded-v6 claim-aware evidence coverage", () => {
  it("keeps 1 Samuel 17 searchable beyond the first three chunks", () => {
    const extracted = extractHtmlDocument(BIBLEGATEWAY_HTML).extractedText;
    const chunks = evidenceChunker(extracted, 120);
    expect(chunks.length).toBeGreaterThan(3);
    const firstThree = chunks.slice(0, 3).map((chunk) => chunk.text).join(" ");
    expect(firstThree).not.toContain("prevailed over the Philistine");
    expect(extracted).toContain("prevailed over the Philistine");
    expect(parseScriptureVerseRanges(SCRIPTURE_JESSE_CLAIM)).toEqual([
      { start: 12, end: 15 },
    ]);
    expect(parseScriptureVerseRanges(SCRIPTURE_HEARS_CLAIM)).toEqual([
      { start: 23, end: 23 },
    ]);
    expect(parseScriptureVerseRanges(SCRIPTURE_STONES_CLAIM)).toEqual([
      { start: 40, end: 40 },
    ]);
    expect(parseScriptureVerseRanges(SCRIPTURE_CHALLENGE_CLAIM)).toEqual([
      { start: 11, end: 11 },
      { start: 16, end: 16 },
    ]);
  });

  it("maps each bound Article 3 claim to the correct later passage", async () => {
    const extracted = extractArticleClaims({
      title: ARTICLE_3_TITLE,
      excerpt: ARTICLE_3_EXCERPT,
      content: ARTICLE_3_BODY,
    });
    const registry = await evidenceRegistry(ARTICLE_3_TITLE, article3Sources(), {
      claimTexts: extracted.claims.map((claim) => claim.claim),
      listedSources: LISTED_SOURCES,
      lookup: PUBLIC_LOOKUP,
      fetch: article3Fetch(),
    });
    const verification = groundedFactVerification(
      extracted.claims,
      registry.evidence,
      extracted.normalizedArticleText,
      LISTED_SOURCES,
    );

    const armies = factFor(verification, SCRIPTURE_ARMIES_CLAIM);
    expect(armies?.sourceUrl).toBe(BIBLEGATEWAY_URL);
    expect(armies?.verificationStatus).not.toBe("unverified");
    expect(armies?.evidenceText).toMatch(/Philistine and Israelite forces faced one another/i);

    const challenge = factFor(verification, SCRIPTURE_CHALLENGE_CLAIM);
    expect(challenge?.sourceUrl).toBe(BIBLEGATEWAY_URL);
    expect(challenge?.verificationStatus).not.toBe("unverified");
    expect(challenge?.evidenceText).toMatch(/dismayed|forty days/i);

    const jesse = factFor(verification, SCRIPTURE_JESSE_CLAIM);
    expect(jesse?.sourceUrl).toBe(BIBLEGATEWAY_URL);
    expect(jesse?.verificationStatus).not.toBe("unverified");
    expect(jesse?.evidenceText).toMatch(/youngest|Bethlehem/i);

    const hears = factFor(verification, SCRIPTURE_HEARS_CLAIM);
    expect(hears?.sourceUrl).toBe(BIBLEGATEWAY_URL);
    expect(hears?.verificationStatus).not.toBe("unverified");
    expect(hears?.evidenceText).toMatch(/David heard/i);

    const volunteers = factFor(verification, SCRIPTURE_VOLUNTEERS_CLAIM);
    expect(volunteers?.sourceUrl).toBe(BIBLEGATEWAY_URL);
    expect(volunteers?.verificationStatus).not.toBe("unverified");
    expect(volunteers?.evidenceText).toMatch(/deliver me|volunteers/i);

    const armour = factFor(verification, SCRIPTURE_ARMOUR_CLAIM);
    expect(armour?.sourceUrl).toBe(BIBLEGATEWAY_URL);
    expect(armour?.verificationStatus).not.toBe("unverified");
    expect(armour?.evidenceText).toMatch(/not tested them|put them off him/i);

    const stones = factFor(verification, SCRIPTURE_STONES_CLAIM);
    expect(stones?.sourceUrl).toBe(BIBLEGATEWAY_URL);
    expect(stones?.verificationStatus).not.toBe("unverified");
    expect(stones?.evidenceText).toMatch(/five smooth stones|sling was in his hand/i);

    const victory = factFor(verification, SCRIPTURE_VICTORY_CLAIM);
    expect(victory?.sourceUrl).toBe(BIBLEGATEWAY_URL);
    expect(victory?.verificationStatus).not.toBe("unverified");
    expect(victory?.evidenceText).toMatch(/prevailed over the Philistine|took his sword/i);

    const guideLeaders = factFor(verification, SAMUEL_GUIDE_LEADERS_CLAIM);
    expect(guideLeaders?.sourceUrl).toBe(BIBLEPROJECT_SAMUEL_GUIDE_URL);
    expect(guideLeaders?.verificationStatus).not.toBe("unverified");
    expect(
      [guideLeaders?.evidenceText, ...(guideLeaders?.supportingSources ?? []).map(() => "")]
        .join(" "),
    );
    expect(
      registry.evidence.some(
        (record) =>
          record.sourceUrl === BIBLEPROJECT_SAMUEL_GUIDE_URL &&
          record.extractedText.includes("radical and humble trust"),
      ),
    ).toBe(true);

    const guideFailure = factFor(verification, SAMUEL_GUIDE_FAILURE_CLAIM);
    expect(guideFailure?.sourceUrl).toBe(BIBLEPROJECT_SAMUEL_GUIDE_URL);
    expect(guideFailure?.verificationStatus).not.toBe("unverified");
    expect(guideFailure?.evidenceText).toMatch(/later failure|permanent hero/i);

    const kingArmour = factFor(verification, KING_DAVID_ARMOUR_CLAIM);
    expect(kingArmour?.sourceUrl).toBe(BIBLEPROJECT_KING_DAVID_URL);
    expect(kingArmour?.verificationStatus).not.toBe("unverified");
    expect(kingArmour?.evidenceText).toMatch(/Saul’s tactics for armor and weaponry/i);

    expect(isOutlineOrIndexPassage(SAMUEL_GUIDE_OUTLINE_PASSAGE)).toBe(true);
    expect(
      registry.evidence.every(
        (record) => !isOutlineOrIndexPassage(record.extractedText),
      ),
    ).toBe(true);

    const saul = factFor(verification, BIBLEPROJECT_SAUL_ARC_CLAIM);
    expect(saul?.verificationCount ?? 0).toBeLessThan(2);
    if (saul?.supportingSources.length) {
      const urls = new Set(saul.supportingSources.map((source) => source.sourceUrl));
      expect(urls.size).toBe(1);
      expect([...urls][0]).not.toBe(BIBLEGATEWAY_URL);
    }
  });

  it("does not combine both BibleProject documents for publisher attribution", () => {
    const selection = selectClaimAwareEvidence({
      claims: [BIBLEPROJECT_SAUL_ARC_CLAIM],
      documents: [
        {
          url: BIBLEPROJECT_SAMUEL_GUIDE_URL,
          title: BIBLEPROJECT_SAMUEL_GUIDE_TITLE,
          sourceType: "theological-guide",
          extractedText: BIBLEPROJECT_SAMUEL_GUIDE_FAILURE_PASSAGE,
          chunks: [
            { id: "chunk-1", text: `${BIBLEPROJECT_SAUL_ARC_CLAIM} ${BIBLEPROJECT_SAMUEL_GUIDE_FAILURE_PASSAGE}`, wordCount: 40 },
          ],
        },
        {
          url: BIBLEPROJECT_KING_DAVID_URL,
          title: BIBLEPROJECT_KING_DAVID_TITLE,
          sourceType: "theological-interpretation",
          extractedText: BIBLEPROJECT_SAUL_ARC_CLAIM,
          chunks: [
            { id: "chunk-1", text: `${BIBLEPROJECT_SAUL_ARC_CLAIM} The narrator spends pages on this warning.`, wordCount: 40 },
          ],
        },
      ],
      listedSources: LISTED_SOURCES,
    });
    expect(selection.mappings[0]?.evidenceIds).toHaveLength(0);
  });

  it("enforces per-claim and per-audit caps and deduplicates identical passages", () => {
    const claims = Array.from({ length: 16 }, (_, index) => {
      return `According to 1 Samuel 17, markerwordalpha${index} confirms that markerwordbeta${index} retrieved markerwordgamma${index} from the brook.`;
    });
    const documents = [
      {
        url: BIBLEGATEWAY_URL,
        title: BIBLEGATEWAY_TITLE,
        sourceType: "scripture-reference",
        extractedText: claims.join(" "),
        chunks: claims.flatMap((claim, index) => [
          {
            id: `chunk-${index}-a`,
            text: `${claim} First window markerwordalpha${index} markerwordbeta${index} markerwordgamma${index} remains with this isolated brook scene only.`,
            wordCount: 24,
          },
          {
            id: `chunk-${index}-b`,
            text: `${claim} Second window markerwordalpha${index} markerwordbeta${index} markerwordgamma${index} continues the same isolated brook retrieval.`,
            wordCount: 24,
          },
          {
            id: `chunk-${index}-c`,
            text: `${claim} Third extra window markerwordalpha${index} markerwordbeta${index} markerwordgamma${index} must not be retained.`,
            wordCount: 24,
          },
        ]),
      },
    ];

    const selection = selectClaimAwareEvidence({
      claims,
      documents,
      listedSources: LISTED_SOURCES,
    });

    expect(RESEARCH_MAX_PASSAGES_PER_CLAIM).toBe(2);
    expect(RESEARCH_MAX_UNIQUE_AUDIT_PASSAGES).toBe(24);
    expect(selection.uniquePassageCount).toBeLessThanOrEqual(24);
    expect(selection.bounded).toBe(true);
    expect(
      selection.mappings.every((mapping) => mapping.evidenceIds.length <= 2),
    ).toBe(true);

    const sharedClaimA =
      "According to 1 Samuel 17, Jesse’s youngest son remains with the sheep at Bethlehem.";
    const sharedClaimB =
      "According to 1 Samuel 17, Jesse’s youngest son goes back and forth from Saul to Bethlehem.";
    const sharedText = `${BIBLEGATEWAY_VICTORY_PASSAGE} Jesse’s youngest son remains with the sheep at Bethlehem and goes back and forth from Saul.`;
    const shared = selectClaimAwareEvidence({
      claims: [sharedClaimA, sharedClaimB],
      documents: [
        {
          url: BIBLEGATEWAY_URL,
          title: BIBLEGATEWAY_TITLE,
          sourceType: "scripture-reference",
          extractedText: sharedText,
          chunks: [{ id: "chunk-shared", text: sharedText, wordCount: 40 }],
        },
      ],
      listedSources: LISTED_SOURCES,
    });
    expect(shared.uniquePassageCount).toBe(1);
    expect(shared.mappings[0]?.evidenceIds).toEqual(shared.mappings[1]?.evidenceIds);
  });

  it("calculates availability separately from claim-level coverage", () => {
    expect(
      researchAuditCoverage({
        listedSourceCount: 3,
        availableSourceCount: 3,
        acceptedSourceCount: 3,
        factualClaimCount: 12,
        mappedClaimCount: 4,
      }),
    ).toEqual({
      listedSourceAvailability: 100,
      sourceCoverage: 100,
      acceptedEvidenceCoverage: 33,
    });
  });

  it("writes nothing when bounded selection finds no claim-relevant evidence", async () => {
    const article = article3();
    const { store, createdAudits, articleUpdates } = createStore(article);
    const failed = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence: async () => ({
        topic: ARTICLE_3_TITLE,
        evidence: [],
        evidenceCount: 0,
        registryStatus: "No useful evidence available after filtering.",
        listedSourceCount: 3,
        acceptedSourceCount: 0,
        unavailableSourceCount: 0,
        sourceDiagnostics: [],
      }),
    });
    expect(failed).toMatchObject({
      ok: false,
      code: "missing_evidence",
      articleUnchanged: true,
    });
    expect(createdAudits).toHaveLength(0);
    expect(articleUpdates).toHaveLength(0);
  });
});

describe("article-grounded-v6 lifecycle", () => {
  it("treats v5 as historical and allows exactly one v6 replacement", async () => {
    const article = article3();
    const fingerprint = computeArticleAuditFingerprint(
      article,
      ARTICLE_3_SOURCES.map((source) => source.url),
    );
    const v5 = {
      id: "cmucapfvx000004i4kx3xpc2v",
      articleId: article.id,
      createdAt: new Date("2026-09-22T06:30:57.453Z"),
    };
    article.researchAudits = [v5];
    article.reviewNotes = [
      {
        action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
        note: serializeArticleAuditAssociation({
          auditId: v5.id,
          contentFingerprint: fingerprint,
          createdAt: v5.createdAt,
          engineRevision: "article-grounded-v5",
        }),
      },
    ];
    const { store, createdAudits, articleUpdates } = createStore(article);
    const first = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence: async () => ({
        topic: ARTICLE_3_TITLE,
        evidenceCount: 1,
        registryStatus: "ok",
        listedSourceCount: 3,
        acceptedSourceCount: 1,
        unavailableSourceCount: 0,
        sourceDiagnostics: [],
        evidence: [
          {
            id: "bg-1",
            sourceTitle: BIBLEGATEWAY_TITLE,
            sourceUrl: BIBLEGATEWAY_URL,
            sourceType: "scripture-reference",
            extractedText: SCRIPTURE_ARMIES_CLAIM,
            confidence: 80,
            requiresHumanReview: true,
          },
        ],
      }),
    });
    const second = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence: async () => ({
        topic: ARTICLE_3_TITLE,
        evidenceCount: 1,
        registryStatus: "ok",
        listedSourceCount: 3,
        evidence: [
          {
            id: "bg-1",
            sourceTitle: BIBLEGATEWAY_TITLE,
            sourceUrl: BIBLEGATEWAY_URL,
            sourceType: "scripture-reference",
            extractedText: SCRIPTURE_ARMIES_CLAIM,
            confidence: 80,
            requiresHumanReview: true,
          },
        ],
      }),
    });

    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.audit.engineRevision).toBe("article-grounded-v6");
    }
    expect(second).toMatchObject({
      ok: false,
      code: "duplicate_audit",
      articleUnchanged: true,
    });
    expect(createdAudits).toHaveLength(1);
    expect(articleUpdates).toHaveLength(1);
    expect(article.researchAudits).toHaveLength(2);
  });

  it("requires v6 for current resolution and lifecycle gates", () => {
    const article = article3();
    const fingerprint = computeArticleAuditFingerprint(
      article,
      ARTICLE_3_SOURCES.map((source) => source.url),
    );
    const v5 = {
      id: "cmucapfvx000004i4kx3xpc2v",
      articleId: article.id,
      createdAt: new Date("2026-09-22T06:30:57.453Z"),
    };
    const v6 = {
      id: "audit-v6",
      articleId: article.id,
      createdAt: new Date("2026-09-22T07:00:00.000Z"),
    };
    const v5Only = partitionAssociatedArticleAudits(
      article,
      ARTICLE_3_SOURCES.map((source) => source.url),
      [v5],
      [
        {
          action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
          note: serializeArticleAuditAssociation({
            auditId: v5.id,
            contentFingerprint: fingerprint,
            createdAt: v5.createdAt,
            engineRevision: "article-grounded-v5",
          }),
        },
      ],
    );
    expect(v5Only.current).toBeNull();
    expect(v5Only.historical).toEqual([v5]);
    expect(publicationGuard("approved", { hasCurrentAudit: false }).allowed).toBe(false);
    expect(publicationGuard("scheduled", { hasCurrentAudit: false }).allowed).toBe(false);

    article.researchAudits = [v5, v6];
    article.reviewNotes = [
      {
        action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
        note: serializeArticleAuditAssociation({
          auditId: v5.id,
          contentFingerprint: fingerprint,
          createdAt: v5.createdAt,
          engineRevision: "article-grounded-v5",
        }),
      },
      {
        action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
        note: serializeArticleAuditAssociation({
          auditId: v6.id,
          contentFingerprint: fingerprint,
          createdAt: v6.createdAt,
          engineRevision: CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
        }),
      },
    ];
    const both = resolveArticleAuditState(article);
    expect(both.currentAudit).toEqual(v6);
    expect(both.historicalAudits).toEqual([v5]);
  });

  it("does not change Prisma schema or migrations relative to 3ee14b0", () => {
    const schema = execFileSync(
      "git",
      ["diff", "3ee14b08ece32fd848c173aa703b8f5cf44cef89", "--", "prisma/schema.prisma"],
      { encoding: "utf8" },
    );
    const migrations = execFileSync(
      "git",
      ["diff", "3ee14b08ece32fd848c173aa703b8f5cf44cef89", "--", "prisma/migrations"],
      { encoding: "utf8" },
    );
    expect(schema).toBe("");
    expect(migrations).toBe("");
  });
});
