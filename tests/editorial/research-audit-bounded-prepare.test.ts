import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseArticleAuditAssociation,
  RESEARCH_AUDIT_FINGERPRINT_ACTION,
  serializeArticleAuditAssociation,
} from "../../lib/research/article-audit-association";
import { selectClaimAwareEvidence } from "../../lib/research/claim-evidence-selector";
import * as consensusModule from "../../lib/research/consensus-engine";
import {
  PUBLISH_READY_CONSENSUS_SCORE,
  PUBLISH_READY_SOURCE_QUALITY_SCORE,
} from "../../lib/research/consensus-engine";
import { collectBoundedBatchEvidence } from "../../lib/research/evidence-registry";
import * as completenessModule from "../../lib/research/evidence-completeness";
import { prepareArticleForReview } from "../../lib/research/prepare-article-for-review";
import type {
  PrepareForReviewArticle,
  PrepareForReviewStore,
} from "../../lib/research/prepare-article-for-review";
import * as publicationGateModule from "../../lib/research/publication-gate";
import { isCurrentResearchAuditEngineRevision } from "../../lib/research/research-audit-engine-revision";
import {
  emptyDiagnostic,
  sourceIdFromTitle,
} from "../../lib/research/source-acquisition";
import type { EvidenceRegistryOptions } from "../../lib/research/evidence-registry";
import type { SourceRecord } from "../../lib/research/source-collector";

const GOOGLE_URL = "https://support.google.com/mail/answer/scheduling";
const MICROSOFT_URL = "https://support.microsoft.com/office/outlook-draft";

function claimSentence(index: number): string {
  return `Google says markerwordalpha${index} confirms markerwordbeta${index} in the isolated ledger entry.`;
}

function articleContent(count: number, links: string[]): string {
  const sections = Array.from({ length: count }, (_, index) => {
    return `## Section ${index}\n\n${claimSentence(index)}`;
  });
  return [...sections, ...links].join("\n\n");
}

function article(content: string, status = "review"): PrepareForReviewArticle {
  return {
    id: "bounded-article",
    title: "Bounded audit fixture",
    slug: "bounded-audit-fixture",
    category: "ai-tools",
    status,
    excerpt: "A short editorial note.",
    content,
    featuredImage: null,
    seoTitle: "Bounded audit fixture",
    seoDescription: "A fixture for the bounded research audit.",
    seoKeywords: "audit",
    researchSources: [],
    researchAudits: [],
    reviewNotes: [],
  };
}

function createStore(current: PrepareForReviewArticle | null) {
  const createdAudits: Array<{ data: Record<string, unknown> }> = [];
  const tx = {
    article: {
      findUnique: vi.fn(async () => current),
      update: vi.fn(async () => ({ id: current?.id })),
    },
    articleResearchAudit: {
      create: vi.fn(async (args: { data: Record<string, unknown> }) => {
        const audit = {
          id: `audit-${createdAudits.length + 1}`,
          articleId: String(args.data.articleId),
          createdAt: new Date("2026-11-04T00:00:00.000Z"),
        };
        createdAudits.push(args);
        current?.researchAudits.push(audit);
        return audit;
      }),
    },
    articleReviewNote: {
      create: vi.fn(async (args: { data: Record<string, unknown> }) => {
        current?.reviewNotes.push({
          action: String(args.data.action),
          note: typeof args.data.note === "string" ? args.data.note : null,
        });
        return { id: `note-${current?.reviewNotes.length ?? 0}` };
      }),
    },
    $queryRaw: vi.fn(async () => [{ id: current?.id }]),
  };
  const store: PrepareForReviewStore = {
    article: {
      findUnique: vi.fn(async () => current),
      update: tx.article.update,
    },
    articleResearchAudit: tx.articleResearchAudit,
    articleReviewNote: tx.articleReviewNote,
    $queryRaw: tx.$queryRaw,
    $transaction: vi.fn(async (fn) => fn(tx)),
  };
  return { store, createdAudits };
}

function countingFetch(pages: Record<string, string>) {
  const calls: Record<string, number> = {};
  const fetchContent = async (url: string, title: string) => {
    calls[url] = (calls[url] ?? 0) + 1;
    const extractedText = pages[url] ?? "";
    return {
      title,
      url,
      extractedText,
      fetchStatus: extractedText ? "success" : "failed",
      contentKind: "html" as const,
      diagnostic: {
        ...emptyDiagnostic(
          sourceIdFromTitle(title, url),
          url,
          extractedText ? "accepted" : "html_extraction_empty",
          extractedText ? "" : "No article text could be read from this page.",
        ),
        extractedCharacterCount: extractedText.length,
      },
    };
  };
  return { fetchContent, calls };
}

function collector(
  pages: Record<string, string>,
  selectBatch?: NonNullable<
    Parameters<typeof collectBoundedBatchEvidence>[2]
  >["selectBatch"],
) {
  const fetched = countingFetch(pages);
  const collectEvidence = (
    topic: string,
    sources: SourceRecord[],
    options?: EvidenceRegistryOptions,
  ) =>
    collectBoundedBatchEvidence(topic, sources, {
      ...options,
      fetchContent: fetched.fetchContent,
      selectBatch,
    });
  return { collectEvidence, calls: fetched.calls };
}

function storedFacts(createdAudits: Array<{ data: Record<string, unknown> }>) {
  return createdAudits[0]?.data.facts as Array<{
    claim: string;
    verificationStatus: string;
    sourceUrl: string;
    supportingSources: Array<{ sourceUrl: string }>;
  }>;
}

describe("bounded prepare-for-review audit", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("scores 25 and 36 claims in one audit and leaves claim 37 unscored", async () => {
    const consensusSpy = vi.spyOn(consensusModule, "consensusEngine");
    const completenessSpy = vi.spyOn(
      completenessModule,
      "recommendationWithEvidenceCompleteness",
    );
    const gateSpy = vi.spyOn(publicationGateModule, "publicationGate");

    for (const count of [25, 36]) {
      consensusSpy.mockClear();
      completenessSpy.mockClear();
      gateSpy.mockClear();
      const current = article(
        articleContent(count, [`[Google scheduling](${GOOGLE_URL})`]),
      );
      const { store, createdAudits } = createStore(current);
      const evidence = collector({
        [GOOGLE_URL]: Array.from({ length: count }, (_, index) =>
          claimSentence(index),
        ).join("\n"),
      });
      const result = await prepareArticleForReview(current.id, {
        prisma: store,
        collectEvidence: evidence.collectEvidence,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(evidence.calls).toEqual({ [GOOGLE_URL]: 1 });
      expect(result.audit.factCount).toBe(count);
      expect(result.audit.notScoredClaims).toEqual([]);
      expect(result.audit.engineRevision).toBe("article-grounded-v12");
      expect(storedFacts(createdAudits).map((fact) => fact.claim)).toEqual(
        Array.from({ length: count }, (_, index) => claimSentence(index)),
      );
      expect(consensusSpy).toHaveBeenCalledTimes(1);
      expect(completenessSpy).toHaveBeenCalledTimes(1);
      expect(gateSpy).toHaveBeenCalledTimes(1);
      expect(createdAudits).toHaveLength(1);
      expect(result.article.status).toBe("review-required");
    }

    const current = article(
      articleContent(37, [`[Google scheduling](${GOOGLE_URL})`]),
    );
    const { store, createdAudits } = createStore(current);
    const evidence = collector({
      [GOOGLE_URL]: Array.from({ length: 37 }, (_, index) =>
        claimSentence(index),
      ).join("\n"),
    });
    consensusSpy.mockClear();
    completenessSpy.mockClear();
    const result = await prepareArticleForReview(current.id, {
      prisma: store,
      collectEvidence: evidence.collectEvidence,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.audit.factCount).toBe(36);
    expect(result.audit.notScoredClaims).toEqual([
      { text: claimSentence(36), section: "Section 36" },
    ]);
    expect(
      storedFacts(createdAudits).some((fact) => fact.claim === claimSentence(36)),
    ).toBe(false);
    expect(consensusSpy).toHaveBeenCalledTimes(1);
    expect(completenessSpy).toHaveBeenCalledTimes(1);
    expect(createdAudits).toHaveLength(1);
  });

  it("stores one partial vendor fact and one unsupported scored claim", async () => {
    const supported = claimSentence(0);
    const unsupported =
      "Google says the aurora quartz never exports the midnight archive to another mailbox.";
    const current = article(
      [
        `## Section 0\n\n${supported}`,
        `## Section 1\n\n${unsupported}`,
        `[Google scheduling](${GOOGLE_URL})`,
        `[Outlook draft](${MICROSOFT_URL})`,
      ].join("\n\n"),
    );
    const { store, createdAudits } = createStore(current);
    const evidence = collector({
      [GOOGLE_URL]: supported,
      [MICROSOFT_URL]: supported,
    });
    const result = await prepareArticleForReview(current.id, {
      prisma: store,
      collectEvidence: evidence.collectEvidence,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(evidence.calls).toEqual({ [GOOGLE_URL]: 1, [MICROSOFT_URL]: 1 });
    const facts = storedFacts(createdAudits);
    expect(facts[0]?.verificationStatus).toBe("partially verified");
    expect(facts[0]?.supportingSources.map((source) => source.sourceUrl)).toEqual([
      GOOGLE_URL,
    ]);
    expect(facts[1]?.claim).toBe(unsupported);
    expect(facts[1]?.verificationStatus).toBe("unverified");
    expect(facts[1]?.supportingSources).toEqual([]);
    expect(result.audit.notScoredClaims).toEqual([]);
    expect(result.audit.publicationRecommendation).not.toBe("publish-ready");
    expect(PUBLISH_READY_CONSENSUS_SCORE).toBe(80);
    expect(PUBLISH_READY_SOURCE_QUALITY_SCORE).toBe(70);
  });

  it("writes no audit when a later batch throws", async () => {
    const consensusSpy = vi.spyOn(consensusModule, "consensusEngine");
    const completenessSpy = vi.spyOn(
      completenessModule,
      "recommendationWithEvidenceCompleteness",
    );
    const current = article(
      articleContent(13, [`[Google scheduling](${GOOGLE_URL})`]),
    );
    const { store, createdAudits } = createStore(current);
    const evidence = collector(
      {
        [GOOGLE_URL]: Array.from({ length: 13 }, (_, index) =>
          claimSentence(index),
        ).join("\n"),
      },
      (input) => {
        if (input.claims.length === 1) throw new Error("batch failed");
        return selectClaimAwareEvidence(input);
      },
    );
    const result = await prepareArticleForReview(current.id, {
      prisma: store,
      collectEvidence: evidence.collectEvidence,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("audit_failure");
    expect(result.articleUnchanged).toBe(true);
    expect(createdAudits).toHaveLength(0);
    expect(evidence.calls[GOOGLE_URL]).toBe(1);
    expect(consensusSpy).not.toHaveBeenCalled();
    expect(completenessSpy).not.toHaveBeenCalled();
  });

  it("keeps approved articles unchanged and historical fingerprints readable", async () => {
    const current = article(
      articleContent(1, [`[Google scheduling](${GOOGLE_URL})`]),
      "approved",
    );
    const { store, createdAudits } = createStore(current);
    const collectEvidence = vi.fn();
    const result = await prepareArticleForReview(current.id, {
      prisma: store,
      collectEvidence,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("invalid_status");
    expect(createdAudits).toHaveLength(0);
    expect(collectEvidence).not.toHaveBeenCalled();

    const historical = parseArticleAuditAssociation({
      action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
      note: serializeArticleAuditAssociation({
        auditId: "historical-audit",
        contentFingerprint: "a".repeat(64),
        createdAt: new Date("2026-10-01T00:00:00.000Z"),
        engineRevision: "article-grounded-v9",
      }),
    });
    expect(historical?.engineRevision).toBe("article-grounded-v9");
    expect(historical?.version).toBe(2);
    expect(
      isCurrentResearchAuditEngineRevision(historical?.engineRevision ?? ""),
    ).toBe(false);
    expect(isCurrentResearchAuditEngineRevision("article-grounded-v7")).toBe(false);
    expect(isCurrentResearchAuditEngineRevision("article-grounded-v10")).toBe(false);
    expect(isCurrentResearchAuditEngineRevision("article-grounded-v11")).toBe(false);
    expect(isCurrentResearchAuditEngineRevision("article-grounded-v12")).toBe(true);
  });
});
