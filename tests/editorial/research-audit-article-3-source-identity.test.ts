import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  extractArticleClaims,
  isAuthorialFraming,
  passageSupportsClaim,
  splitBlockSentences,
  splitMarkdownBlocks,
} from "../../lib/research/article-claim-extractor";
import { groundedFactVerification } from "../../lib/research/claim-evidence-matcher";
import {
  claimAllowsEvidence,
  isPrimaryScriptureClaim,
  isPrimaryScriptureSource,
  namedSecondaryDocuments,
  resolveClaimSourceBinding,
  sameDocumentIdentity,
  sourceMatchesNamedDocument,
} from "../../lib/research/claim-source-attribution";
import { isOutlineOrIndexPassage } from "../../lib/research/evidence-chrome";
import { prepareArticleForReview } from "../../lib/research/prepare-article-for-review";
import type {
  PrepareForReviewArticle,
  PrepareForReviewStore,
} from "../../lib/research/prepare-article-for-review";
import { CURRENT_RESEARCH_AUDIT_ENGINE_REVISION } from "../../lib/research/research-audit-engine-revision";
import {
  RESEARCH_AUDIT_FINGERPRINT_ACTION,
  serializeArticleAuditAssociation,
  partitionAssociatedArticleAudits,
} from "../../lib/research/article-audit-association";
import { computeArticleAuditFingerprint } from "../../lib/research/article-audit-fingerprint";
import { resolveArticleAuditState } from "../../lib/research/current-article-audit";
import { publicationGuard } from "../../lib/publishing/publication-guard";
import type { EvidenceRecord } from "../../lib/research/evidence-registry";
import {
  ARTICLE_3_BODY,
  ARTICLE_3_EXCERPT,
  ARTICLE_3_SOURCES,
  ARTICLE_3_TITLE,
  BIBLEGATEWAY_CHAPTER_PASSAGE,
  BIBLEGATEWAY_TITLE,
  BIBLEGATEWAY_URL,
  BIBLEPROJECT_KING_DAVID_PASSAGE,
  BIBLEPROJECT_KING_DAVID_TITLE,
  BIBLEPROJECT_KING_DAVID_URL,
  BIBLEPROJECT_SAMUEL_GUIDE_PASSAGE,
  BIBLEPROJECT_SAMUEL_GUIDE_TITLE,
  BIBLEPROJECT_SAMUEL_GUIDE_URL,
  BIBLEPROJECT_SAUL_ARC_CLAIM,
  KING_DAVID_ARMOUR_CLAIM,
  KING_DAVID_QUOTE_BLOCK,
  LITERARY_READING_LABEL,
  NAMED_SOURCE_READING_LABEL,
  SAMUEL_GUIDE_LEADERS_CLAIM,
  SAMUEL_GUIDE_OUTLINE_PASSAGE,
  SAMUEL_GUIDE_QUOTE_BLOCK,
  SCRIPTURE_ARMIES_CLAIM,
  SCRIPTURE_HEARS_CLAIM,
} from "../fixtures/research-audit/article-3";

const LISTED_SOURCES = ARTICLE_3_SOURCES.map((source) => ({
  url: source.url,
  title: source.title,
  publisher: source.publisher,
}));

function factualClaim(claim: string) {
  return {
    claim,
    articleExcerpt: claim,
    section: "body" as const,
    blockType: "paragraph" as const,
    kind: "factual" as const,
  };
}

function evidence(
  id: string,
  url: string,
  title: string,
  text: string,
): EvidenceRecord {
  return {
    id,
    sourceTitle: title,
    sourceUrl: url,
    sourceType: "research",
    extractedText: text,
    confidence: 80,
    requiresHumanReview: true,
  };
}

const bibleGatewayEvidence = evidence(
  "bg-1",
  BIBLEGATEWAY_URL,
  BIBLEGATEWAY_TITLE,
  BIBLEGATEWAY_CHAPTER_PASSAGE,
);
const samuelGuideEvidence = evidence(
  "guide-1",
  BIBLEPROJECT_SAMUEL_GUIDE_URL,
  BIBLEPROJECT_SAMUEL_GUIDE_TITLE,
  BIBLEPROJECT_SAMUEL_GUIDE_PASSAGE,
);
const kingDavidEvidence = evidence(
  "kd-1",
  BIBLEPROJECT_KING_DAVID_URL,
  BIBLEPROJECT_KING_DAVID_TITLE,
  BIBLEPROJECT_KING_DAVID_PASSAGE,
);
const outlineEvidence = evidence(
  "guide-outline",
  BIBLEPROJECT_SAMUEL_GUIDE_URL,
  BIBLEPROJECT_SAMUEL_GUIDE_TITLE,
  SAMUEL_GUIDE_OUTLINE_PASSAGE,
);

const ALL_EVIDENCE = [
  bibleGatewayEvidence,
  samuelGuideEvidence,
  kingDavidEvidence,
  outlineEvidence,
];

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
          createdAt: new Date("2026-09-22T05:00:00.000Z"),
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

function usefulArticle3Evidence() {
  return {
    topic: ARTICLE_3_TITLE,
    evidenceCount: 3,
    registryStatus: "ok",
    listedSourceCount: 3,
    acceptedSourceCount: 3,
    unavailableSourceCount: 0,
    sourceDiagnostics: [],
    evidence: [bibleGatewayEvidence, samuelGuideEvidence, kingDavidEvidence],
  };
}

function expectedDocumentForClaim(claim: string): string | "bibleproject" {
  if (isPrimaryScriptureClaim(claim)) return BIBLEGATEWAY_URL;
  const named = namedSecondaryDocuments(claim);
  if (named.includes("samuel-guide")) return BIBLEPROJECT_SAMUEL_GUIDE_URL;
  if (named.includes("king-david-article")) return BIBLEPROJECT_KING_DAVID_URL;
  return "bibleproject";
}

describe("article-grounded-v5 sentence boundaries", () => {
  it("splits labelled authorial sentences after closing quotation marks", () => {
    const guideSentences = splitBlockSentences(SAMUEL_GUIDE_QUOTE_BLOCK);
    expect(guideSentences).toContain(SAMUEL_GUIDE_LEADERS_CLAIM);
    expect(guideSentences).toContain(NAMED_SOURCE_READING_LABEL);
    expect(guideSentences.some((sentence) => sentence.includes(NAMED_SOURCE_READING_LABEL) && sentence.includes("radical and humble trust"))).toBe(false);

    const kingSentences = splitBlockSentences(KING_DAVID_QUOTE_BLOCK);
    expect(kingSentences).toContain(KING_DAVID_ARMOUR_CLAIM);
    expect(kingSentences).toContain(LITERARY_READING_LABEL);
    expect(kingSentences.some((sentence) => sentence.includes(LITERARY_READING_LABEL) && sentence.includes("slingshot"))).toBe(false);
  });

  it("excludes the labelled authorial clauses from factual claims", () => {
    expect(isAuthorialFraming(NAMED_SOURCE_READING_LABEL)).toBe(true);
    expect(isAuthorialFraming(LITERARY_READING_LABEL)).toBe(true);
    const extracted = extractArticleClaims({
      title: ARTICLE_3_TITLE,
      excerpt: ARTICLE_3_EXCERPT,
      content: ARTICLE_3_BODY,
    });
    const claims = extracted.claims.map((claim) => claim.claim);
    expect(claims.some((claim) => /named-source reading/i.test(claim))).toBe(false);
    expect(claims.some((claim) => /literary reading/i.test(claim))).toBe(false);
    expect(claims).toContain(SAMUEL_GUIDE_LEADERS_CLAIM);
    expect(claims).toContain(KING_DAVID_ARMOUR_CLAIM);
  });

  it("keeps Markdown block boundaries intact and does not split verse citations", () => {
    const blocks = splitMarkdownBlocks(ARTICLE_3_BODY, "body");
    expect(blocks.some((block) => block.blockType === "heading")).toBe(true);
    expect(blocks.some((block) => block.blockType === "paragraph")).toBe(true);
    const armiesBlock = blocks.find((block) => block.text.includes(SCRIPTURE_ARMIES_CLAIM));
    expect(armiesBlock?.blockType).toBe("paragraph");
    const cited = splitBlockSentences(SCRIPTURE_HEARS_CLAIM);
    expect(cited).toEqual([SCRIPTURE_HEARS_CLAIM]);
    expect(splitBlockSentences("Dr. Smith records the chapter.")).toEqual([
      "Dr. Smith records the chapter.",
    ]);
  });
});

describe("article-grounded-v6 source identity", () => {
  it("binds According to 1 Samuel 17 only to the BibleGateway chapter source", () => {
    const binding = resolveClaimSourceBinding(SCRIPTURE_ARMIES_CLAIM, LISTED_SOURCES);
    expect(binding.role).toBe("primary-scripture");
    expect(binding.exclusiveUrl).toBeTruthy();
    expect(sameDocumentIdentity(binding.exclusiveUrl ?? "", BIBLEGATEWAY_URL)).toBe(true);
    expect(claimAllowsEvidence(SCRIPTURE_ARMIES_CLAIM, LISTED_SOURCES[0], LISTED_SOURCES)).toBe(true);
    expect(claimAllowsEvidence(SCRIPTURE_ARMIES_CLAIM, LISTED_SOURCES[1], LISTED_SOURCES)).toBe(false);
    expect(claimAllowsEvidence(SCRIPTURE_ARMIES_CLAIM, LISTED_SOURCES[2], LISTED_SOURCES)).toBe(false);
  });

  it("does not let BibleProject verify or corroborate a primary-scripture claim", () => {
    const verification = groundedFactVerification(
      [factualClaim(SCRIPTURE_ARMIES_CLAIM)],
      [
        samuelGuideEvidence,
        kingDavidEvidence,
        evidence(
          "guide-overlap",
          BIBLEPROJECT_SAMUEL_GUIDE_URL,
          BIBLEPROJECT_SAMUEL_GUIDE_TITLE,
          `${SCRIPTURE_ARMIES_CLAIM} ${BIBLEPROJECT_SAMUEL_GUIDE_PASSAGE}`,
        ),
      ],
      SCRIPTURE_ARMIES_CLAIM,
      LISTED_SOURCES,
    );
    expect(verification.facts[0]?.verificationStatus).toBe("unverified");
    expect(verification.facts[0]?.supportingSources).toHaveLength(0);
    expect(verification.acceptedEvidence).toHaveLength(0);
  });

  it("lets a BibleGateway passage support the corresponding narrative claim", () => {
    expect(
      passageSupportsClaim(SCRIPTURE_ARMIES_CLAIM, BIBLEGATEWAY_CHAPTER_PASSAGE, {
        documentKind: "html",
      }),
    ).toBe(true);
    const verification = groundedFactVerification(
      [factualClaim(SCRIPTURE_ARMIES_CLAIM)],
      ALL_EVIDENCE,
      SCRIPTURE_ARMIES_CLAIM,
      LISTED_SOURCES,
    );
    expect(verification.facts[0]?.verificationStatus).not.toBe("unverified");
    expect(verification.facts[0]?.sourceUrl).toBe(BIBLEGATEWAY_URL);
    expect(
      verification.facts[0]?.supportingSources.every((source) =>
        sameDocumentIdentity(source.sourceUrl, BIBLEGATEWAY_URL),
      ),
    ).toBe(true);
  });

  it("does not let the Samuel guide substitute for the King David article", () => {
    expect(
      claimAllowsEvidence(KING_DAVID_ARMOUR_CLAIM, LISTED_SOURCES[1], LISTED_SOURCES),
    ).toBe(false);
    const verification = groundedFactVerification(
      [factualClaim(KING_DAVID_ARMOUR_CLAIM)],
      [
        samuelGuideEvidence,
        evidence(
          "guide-as-king",
          BIBLEPROJECT_SAMUEL_GUIDE_URL,
          BIBLEPROJECT_SAMUEL_GUIDE_TITLE,
          BIBLEPROJECT_KING_DAVID_PASSAGE,
        ),
      ],
      KING_DAVID_ARMOUR_CLAIM,
      LISTED_SOURCES,
    );
    expect(verification.facts[0]?.verificationStatus).toBe("unverified");
  });

  it("does not let the King David article substitute for the Samuel guide", () => {
    expect(
      claimAllowsEvidence(SAMUEL_GUIDE_LEADERS_CLAIM, LISTED_SOURCES[2], LISTED_SOURCES),
    ).toBe(false);
    const verification = groundedFactVerification(
      [factualClaim(SAMUEL_GUIDE_LEADERS_CLAIM)],
      [
        kingDavidEvidence,
        evidence(
          "king-as-guide",
          BIBLEPROJECT_KING_DAVID_URL,
          BIBLEPROJECT_KING_DAVID_TITLE,
          BIBLEPROJECT_SAMUEL_GUIDE_PASSAGE,
        ),
      ],
      SAMUEL_GUIDE_LEADERS_CLAIM,
      LISTED_SOURCES,
    );
    expect(verification.facts[0]?.verificationStatus).toBe("unverified");
  });

  it("keeps two bibleproject.com documents as distinct identities", () => {
    expect(sameDocumentIdentity(BIBLEPROJECT_SAMUEL_GUIDE_URL, BIBLEPROJECT_KING_DAVID_URL)).toBe(
      false,
    );
    expect(
      sourceMatchesNamedDocument(LISTED_SOURCES[1], "samuel-guide"),
    ).toBe(true);
    expect(
      sourceMatchesNamedDocument(LISTED_SOURCES[1], "king-david-article"),
    ).toBe(false);
    expect(
      sourceMatchesNamedDocument(LISTED_SOURCES[2], "king-david-article"),
    ).toBe(true);
    expect(
      sourceMatchesNamedDocument(LISTED_SOURCES[2], "samuel-guide"),
    ).toBe(false);
    expect(isPrimaryScriptureSource(LISTED_SOURCES[0])).toBe(true);
    expect(isPrimaryScriptureSource(LISTED_SOURCES[1])).toBe(false);
  });

  it("does not treat a shared hostname as independent corroboration", () => {
    const verification = groundedFactVerification(
      [factualClaim(BIBLEPROJECT_SAUL_ARC_CLAIM)],
      [
        evidence(
          "guide-saul",
          BIBLEPROJECT_SAMUEL_GUIDE_URL,
          BIBLEPROJECT_SAMUEL_GUIDE_TITLE,
          BIBLEPROJECT_KING_DAVID_PASSAGE,
        ),
        evidence(
          "king-saul",
          BIBLEPROJECT_KING_DAVID_URL,
          BIBLEPROJECT_KING_DAVID_TITLE,
          BIBLEPROJECT_KING_DAVID_PASSAGE,
        ),
      ],
      BIBLEPROJECT_SAUL_ARC_CLAIM,
      LISTED_SOURCES,
    );
    expect(verification.facts[0]?.verificationCount).toBeLessThan(2);
    expect(verification.facts[0]?.verificationStatus).not.toBe("verified");
    expect(
      new Set(
        (verification.facts[0]?.supportingSources ?? []).map((source) =>
          new URL(source.sourceUrl).hostname,
        ),
      ).size,
    ).toBeLessThanOrEqual(1);
  });

  it("rejects irrelevant guide outline or navigation for a narrative claim", () => {
    expect(isOutlineOrIndexPassage(SAMUEL_GUIDE_OUTLINE_PASSAGE)).toBe(true);
    expect(
      passageSupportsClaim(SCRIPTURE_ARMIES_CLAIM, SAMUEL_GUIDE_OUTLINE_PASSAGE, {
        documentKind: "html",
      }),
    ).toBe(false);
    expect(
      passageSupportsClaim(SCRIPTURE_HEARS_CLAIM, SAMUEL_GUIDE_OUTLINE_PASSAGE, {
        documentKind: "html",
      }),
    ).toBe(false);
    const verification = groundedFactVerification(
      [factualClaim(SCRIPTURE_ARMIES_CLAIM), factualClaim(SCRIPTURE_HEARS_CLAIM)],
      [outlineEvidence],
      `${SCRIPTURE_ARMIES_CLAIM} ${SCRIPTURE_HEARS_CLAIM}`,
      LISTED_SOURCES,
    );
    expect(verification.facts.every((fact) => fact.verificationStatus === "unverified")).toBe(
      true,
    );
  });

  it("requires event or action support, not merely shared names", () => {
    const namesOnly =
      "Samuel, David, Israel, Saul, and Goliath appear throughout the books of Samuel.";
    expect(
      passageSupportsClaim(SCRIPTURE_HEARS_CLAIM, namesOnly, { documentKind: "html" }),
    ).toBe(false);
    expect(
      passageSupportsClaim(
        SCRIPTURE_HEARS_CLAIM,
        "While he is speaking with his brothers, Goliath repeats his challenge, and David hears it.",
        { documentKind: "html" },
      ),
    ).toBe(true);
  });
});

describe("article-grounded-v6 Article 3 integrity", () => {
  it("assigns every extracted factual claim only to the correctly attributed document", () => {
    const extracted = extractArticleClaims({
      title: ARTICLE_3_TITLE,
      excerpt: ARTICLE_3_EXCERPT,
      content: ARTICLE_3_BODY,
    });
    expect(extracted.claimCount).toBe(12);
    expect(extracted.claims.some((claim) => /named-source reading|literary reading/i.test(claim.claim))).toBe(
      false,
    );

    const verification = groundedFactVerification(
      extracted.claims,
      ALL_EVIDENCE,
      extracted.normalizedArticleText,
      LISTED_SOURCES,
    );
    expect(verification.facts).toHaveLength(12);

    for (const fact of verification.facts) {
      const expected = expectedDocumentForClaim(fact.claim);
      for (const source of fact.supportingSources) {
        if (expected === "bibleproject") {
          expect(new URL(source.sourceUrl).hostname).toBe("bibleproject.com");
          expect(source.sourceUrl).not.toBe(BIBLEGATEWAY_URL);
        } else {
          expect(sameDocumentIdentity(source.sourceUrl, expected)).toBe(true);
        }
      }
      if (fact.sourceUrl) {
        if (expected === "bibleproject") {
          expect(new URL(fact.sourceUrl).hostname).toBe("bibleproject.com");
        } else {
          expect(sameDocumentIdentity(fact.sourceUrl, expected)).toBe(true);
        }
      }
    }

    const scriptureFacts = verification.facts.filter((fact) =>
      isPrimaryScriptureClaim(fact.claim),
    );
    expect(scriptureFacts.length).toBeGreaterThan(0);
    expect(
      scriptureFacts.every((fact) =>
        fact.supportingSources.every((source) =>
          sameDocumentIdentity(source.sourceUrl, BIBLEGATEWAY_URL),
        ),
      ),
    ).toBe(true);

    const guideFacts = verification.facts.filter((fact) =>
      namedSecondaryDocuments(fact.claim).includes("samuel-guide"),
    );
    expect(guideFacts.length).toBeGreaterThan(0);
    expect(
      guideFacts.every((fact) =>
        fact.supportingSources.every((source) =>
          sameDocumentIdentity(source.sourceUrl, BIBLEPROJECT_SAMUEL_GUIDE_URL),
        ),
      ),
    ).toBe(true);

    const kingFacts = verification.facts.filter((fact) =>
      namedSecondaryDocuments(fact.claim).includes("king-david-article"),
    );
    expect(kingFacts.length).toBeGreaterThan(0);
    expect(
      kingFacts.every((fact) =>
        fact.supportingSources.every((source) =>
          sameDocumentIdentity(source.sourceUrl, BIBLEPROJECT_KING_DAVID_URL),
        ),
      ),
    ).toBe(true);
  });
});

describe("article-grounded-v6 lifecycle", () => {
  it("allows one v6 replacement after a same-fingerprint v5 audit and rejects a duplicate", async () => {
    const article = article3();
    const fingerprint = computeArticleAuditFingerprint(
      article,
      ARTICLE_3_SOURCES.map((source) => source.url),
    );
    article.researchAudits = [
      {
        id: "cmucapfvx000004i4kx3xpc2v",
        articleId: article.id,
        createdAt: new Date("2026-09-21T18:56:27.259Z"),
      },
    ];
    article.reviewNotes = [
      {
        action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
        note: serializeArticleAuditAssociation({
          auditId: "cmucapfvx000004i4kx3xpc2v",
          contentFingerprint: fingerprint,
          createdAt: new Date("2026-09-21T18:56:27.259Z"),
          engineRevision: "article-grounded-v5",
        }),
      },
    ];
    const { store, createdAudits, articleUpdates } = createStore(article);

    const first = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence: async () => usefulArticle3Evidence(),
    });
    const second = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence: async () => usefulArticle3Evidence(),
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

  it("produces one audit from concurrent v6 attempts", async () => {
    const article = article3();
    const { store, createdAudits } = createStore(article);
    const [first, second] = await Promise.all([
      prepareArticleForReview(article.id, {
        prisma: store,
        collectEvidence: async () => usefulArticle3Evidence(),
      }),
      prepareArticleForReview(article.id, {
        prisma: store,
        collectEvidence: async () => usefulArticle3Evidence(),
      }),
    ]);
    expect([first.ok, second.ok].filter(Boolean)).toHaveLength(1);
    expect(
      [first, second].filter((result) => !result.ok && result.code === "duplicate_audit"),
    ).toHaveLength(1);
    expect(createdAudits).toHaveLength(1);
    const winner = [first, second].find((result) => result.ok);
    expect(winner && winner.ok ? winner.audit.engineRevision : null).toBe(
      CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
    );
  });

  it("keeps v5 historical and requires fingerprint plus v6 for current resolution", () => {
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

    const v5Only = partitionAssociatedArticleAudits(
      article,
      ARTICLE_3_SOURCES.map((source) => source.url),
      [v5],
      article.reviewNotes,
    );
    expect(v5Only.current).toBeNull();
    expect(v5Only.historical).toEqual([v5]);
    expect(resolveArticleAuditState(article).currentAudit).toBeNull();
    expect(publicationGuard("approved", { hasCurrentAudit: false }).allowed).toBe(false);
    expect(publicationGuard("scheduled", { hasCurrentAudit: false }).allowed).toBe(false);

    const both = partitionAssociatedArticleAudits(
      article,
      ARTICLE_3_SOURCES.map((source) => source.url),
      [v5, v6],
      [
        ...article.reviewNotes,
        {
          action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
          note: serializeArticleAuditAssociation({
            auditId: v6.id,
            contentFingerprint: fingerprint,
            createdAt: v6.createdAt,
            engineRevision: "article-grounded-v6",
          }),
        },
      ],
    );
    expect(both.current).toEqual(v6);
    expect(both.historical).toEqual([v5]);
  });

  it("writes nothing when preparation fails", async () => {
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
        unavailableSourceCount: 3,
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
    expect(article.researchAudits).toHaveLength(0);
  });

  it("does not change Prisma schema or migrations relative to 547cb1b", () => {
    const schema = execFileSync(
      "git",
      ["diff", "547cb1b2abd6a3e7f94892d6aca9ca5c080c6f95", "--", "prisma/schema.prisma"],
      { encoding: "utf8" },
    );
    const migrations = execFileSync(
      "git",
      ["diff", "547cb1b2abd6a3e7f94892d6aca9ca5c080c6f95", "--", "prisma/migrations"],
      { encoding: "utf8" },
    );
    expect(schema).toBe("");
    expect(migrations).toBe("");
  });
});
