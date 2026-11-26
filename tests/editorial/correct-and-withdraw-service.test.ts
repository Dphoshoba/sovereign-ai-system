import { beforeEach, describe, expect, it, vi } from "vitest";
import { publicationGuard } from "../../lib/publishing/publication-guard";
import {
  correctAndWithdrawPublishedArticle,
  transitionArticleLifecycle,
  updateArticleUnderGovernanceLock,
} from "../../lib/publishing/article-lifecycle";
import {
  CORRECTED_AND_UNPUBLISHED_ACTION,
  parseCorrectAndWithdrawRequest,
  parseCorrectionGovernanceNote,
} from "../../lib/publishing/correct-and-withdraw";
import { computeArticleAuditFingerprint } from "../../lib/research/article-audit-fingerprint";
import {
  RESEARCH_AUDIT_FINGERPRINT_ACTION,
  serializeArticleAuditAssociation,
} from "../../lib/research/article-audit-association";
import { resolveArticleAuditState } from "../../lib/research/current-article-audit";
import {
  ARTICLE_3_SAMUEL_17_32_AFTER,
  ARTICLE_3_SAMUEL_17_32_BEFORE,
  ARTICLE_3_SAMUEL_17_32_EVIDENCE,
} from "./fixtures/article-3-17-32-correction";

const auditCreatedAt = new Date("2026-09-15T00:00:00.000Z");
const correctedAt = new Date("2026-09-23T09:06:00.000Z");
const sourceUrl = ARTICLE_3_SAMUEL_17_32_EVIDENCE;

const publishedArticle = {
  id: "cmqt9zmlv0000kcunwyw2bo0q",
  title: "David and Goliath: A Careful, Practical Reading",
  excerpt: "A careful reading of 1 Samuel 17.",
  content: ARTICLE_3_SAMUEL_17_32_BEFORE,
  category: "faith",
  seoTitle: "David and Goliath",
  seoDescription: "A careful practical reading.",
  seoKeywords: "David, Goliath",
  featuredImage: "/generated/david-and-goliath.png",
  status: "published",
  scheduledFor: new Date("2026-09-20T00:00:00.000Z"),
  publishedAt: new Date("2026-09-21T00:00:00.000Z"),
  approvedAt: new Date("2026-09-19T00:00:00.000Z"),
  approvedBy: "editor@example.com",
  editorialScore: 88,
  editorialGrade: "approval-candidate",
  editorialWarnings: [{ code: "tone" }],
  qualityScore: 80,
  qualityGrade: "review",
  seoScore: 70,
  seoGrade: "review",
  researchSources: [
    {
      title: "1 Samuel 17:32 KJV",
      url: sourceUrl,
      sourceType: "primary-text",
      authorityScore: 90,
      trustScore: 90,
    },
  ],
  researchAudits: [
    { id: "audit-current", articleId: "cmqt9zmlv0000kcunwyw2bo0q", createdAt: auditCreatedAt },
  ],
  reviewNotes: [] as Array<{ action: string; note: string | null }>,
};

function currentAssociation(article = publishedArticle) {
  const fingerprint = computeArticleAuditFingerprint(article, [sourceUrl]);
  return {
    action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
    note: serializeArticleAuditAssociation({
      auditId: "audit-current",
      contentFingerprint: fingerprint,
      createdAt: auditCreatedAt,
    }),
  };
}

function snapshotArticle(article: typeof publishedArticle) {
  return {
    ...article,
    researchSources: article.researchSources.map((source) => ({ ...source })),
    researchAudits: article.researchAudits.map((audit) => ({ ...audit })),
    reviewNotes: article.reviewNotes.map((note) => ({ ...note })),
    editorialWarnings: article.editorialWarnings
      ? [...article.editorialWarnings]
      : article.editorialWarnings,
  };
}

function createStore(
  article = snapshotArticle({
    ...publishedArticle,
    reviewNotes: [currentAssociation()],
  }),
  options: { failNote?: boolean } = {},
) {
  const calls: string[] = [];
  const createdNotes: Array<Record<string, unknown>> = [];
  const tx = {
    $queryRaw: vi.fn(async () => {
      calls.push("lock");
      return [{ id: article.id }];
    }),
    article: {
      findUnique: vi.fn(async () => {
        calls.push("read");
        return article;
      }),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        calls.push("update");
        Object.assign(article, data);
        return { ...article };
      }),
    },
    articleReviewNote: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        calls.push("note");
        if (options.failNote) {
          throw new Error("forced correction note failure");
        }
        createdNotes.push(data);
        article.reviewNotes.push({
          action: String(data.action),
          note: (data.note as string | null) ?? null,
        });
        return { id: `note-${createdNotes.length}` };
      }),
    },
    publishingQueue: {
      update: vi.fn(async () => {
        calls.push("queue");
        return { id: "queue-1", status: "published" };
      }),
    },
  };
  const store = {
    $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) => {
      const before = snapshotArticle(article);
      try {
        return await callback(tx);
      } catch (error) {
        Object.assign(article, before);
        article.researchSources.splice(
          0,
          article.researchSources.length,
          ...before.researchSources,
        );
        article.researchAudits.splice(
          0,
          article.researchAudits.length,
          ...before.researchAudits,
        );
        article.reviewNotes.splice(
          0,
          article.reviewNotes.length,
          ...before.reviewNotes,
        );
        throw error;
      }
    }),
  };
  return { store, tx, calls, article, createdNotes };
}

describe("parseCorrectAndWithdrawRequest", () => {
  it("accepts a content-only correction", () => {
    const parsed = parseCorrectAndWithdrawRequest({
      articleId: publishedArticle.id,
      reason: "Correct 1 Samuel 17:32 attribution.",
      changes: { content: ARTICLE_3_SAMUEL_17_32_AFTER },
    });
    expect(parsed).toMatchObject({
      ok: true,
      value: {
        articleId: publishedArticle.id,
        reason: "Correct 1 Samuel 17:32 attribution.",
        changes: { content: ARTICLE_3_SAMUEL_17_32_AFTER },
      },
    });
  });

  it.each([
    ["empty reason", { articleId: "a", reason: "   ", changes: { content: "x" } }],
    ["empty changes", { articleId: "a", reason: "fix", changes: {} }],
    ["unknown top-level key", { articleId: "a", reason: "fix", changes: { content: "x" }, extra: true }],
    ["forbidden status", { articleId: "a", reason: "fix", changes: { content: "x" }, status: "review-required" }],
    ["forbidden publishedAt", { articleId: "a", reason: "fix", changes: { content: "x" }, publishedAt: null }],
    ["forbidden slug in changes", { articleId: "a", reason: "fix", changes: { slug: "x", content: "y" } }],
    ["forbidden featuredImage", { articleId: "a", reason: "fix", changes: { featuredImage: "/x.png" } }],
    ["unknown ctaType", { articleId: "a", reason: "fix", changes: { ctaType: "consultation" } }],
    ["research sources", { articleId: "a", reason: "fix", changes: { researchSources: [] } }],
  ])("rejects %s", (_name, body) => {
    const parsed = parseCorrectAndWithdrawRequest(body);
    expect(parsed).toMatchObject({
      ok: false,
      code: "invalid_request",
      articleUnchanged: true,
    });
  });
});

describe("correctAndWithdrawPublishedArticle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("atomically corrects published content and withdraws it for review", async () => {
    const { store, tx, calls, article, createdNotes } = createStore();
    const previousFingerprint = computeArticleAuditFingerprint(article, [
      sourceUrl,
    ]);

    const result = await correctAndWithdrawPublishedArticle(
      {
        articleId: article.id,
        reason: "Correct the 1 Samuel 17:32 wording.",
        changes: { content: ARTICLE_3_SAMUEL_17_32_AFTER },
        actor: "admin@example.com",
        now: correctedAt,
      },
      { prisma: store },
    );

    expect(result.ok).toBe(true);
    expect(calls).toEqual(["lock", "read", "update", "note"]);
    expect(tx.article.update).toHaveBeenCalledWith({
      where: { id: article.id },
      data: expect.objectContaining({
        content: ARTICLE_3_SAMUEL_17_32_AFTER,
        status: "review-required",
        publishedAt: null,
        scheduledFor: null,
        approvedAt: null,
        approvedBy: null,
        editorialScore: null,
        editorialGrade: null,
        editorialWarnings: null,
        qualityScore: null,
        qualityGrade: null,
        seoScore: null,
        seoGrade: null,
      }),
    });
    expect(article.status).toBe("review-required");
    expect(article.content).toBe(ARTICLE_3_SAMUEL_17_32_AFTER);
    expect(article.publishedAt).toBeNull();
    expect(article.scheduledFor).toBeNull();
    expect(article.approvedAt).toBeNull();
    expect(article.approvedBy).toBeNull();
    expect(article.editorialScore).toBeNull();
    expect(article.editorialGrade).toBeNull();
    expect(article.editorialWarnings).toBeNull();
    expect(article.qualityScore).toBeNull();
    expect(article.qualityGrade).toBeNull();
    expect(article.seoScore).toBeNull();
    expect(article.seoGrade).toBeNull();
    expect(createdNotes).toHaveLength(1);
    expect(createdNotes[0]).toMatchObject({
      action: CORRECTED_AND_UNPUBLISHED_ACTION,
      reviewer: "admin@example.com",
    });
    const note = parseCorrectionGovernanceNote(String(createdNotes[0]?.note));
    expect(note).toMatchObject({
      version: 1,
      articleId: article.id,
      reason: "Correct the 1 Samuel 17:32 wording.",
      changedFields: ["content"],
      previousStatus: "published",
      newStatus: "review-required",
      previousFingerprint,
      correctedAt: correctedAt.toISOString(),
      correctedBy: "admin@example.com",
    });
    expect(note?.newFingerprint).not.toBe(previousFingerprint);
    if (result.ok) {
      expect(result.newFingerprint).toBe(note?.newFingerprint);
      expect(result.previousFingerprint).toBe(previousFingerprint);
    }
  });

  it("preserves historical audits and association notes after the fingerprint changes", async () => {
    const { store, article } = createStore();
    const priorNotes = article.reviewNotes.map((note) => ({ ...note }));
    const priorAudits = article.researchAudits.map((audit) => ({ ...audit }));

    const result = await correctAndWithdrawPublishedArticle(
      {
        articleId: article.id,
        reason: "Correct the 1 Samuel 17:32 wording.",
        changes: { content: ARTICLE_3_SAMUEL_17_32_AFTER },
        actor: "admin@example.com",
        now: correctedAt,
      },
      { prisma: store },
    );

    expect(result.ok).toBe(true);
    expect(article.researchAudits).toEqual(priorAudits);
    expect(article.reviewNotes.slice(0, priorNotes.length)).toEqual(priorNotes);
    const { currentAudit, historicalAudits } = resolveArticleAuditState(article);
    expect(currentAudit).toBeNull();
    expect(historicalAudits).toEqual(priorAudits);
  });

  it("removes the article from published queries and blocks immediate publication", async () => {
    const { store, article } = createStore();
    await correctAndWithdrawPublishedArticle(
      {
        articleId: article.id,
        reason: "Correct the 1 Samuel 17:32 wording.",
        changes: { content: ARTICLE_3_SAMUEL_17_32_AFTER },
        actor: "admin@example.com",
        now: correctedAt,
      },
      { prisma: store },
    );

    const publishedMatches = [article].filter(
      (row) => row.status === "published",
    );
    expect(publishedMatches).toEqual([]);
    expect(
      publicationGuard(article.status, { hasCurrentAudit: false }).allowed,
    ).toBe(false);
    expect(article.status).toBe("review-required");
  });

  it("fails closed when approval is attempted without a new current audit", async () => {
    const current = snapshotArticle({
      ...publishedArticle,
      reviewNotes: [currentAssociation()],
    });
    const { store } = createStore(current);
    await correctAndWithdrawPublishedArticle(
      {
        articleId: current.id,
        reason: "Correct the 1 Samuel 17:32 wording.",
        changes: { content: ARTICLE_3_SAMUEL_17_32_AFTER },
        actor: "admin@example.com",
        now: correctedAt,
      },
      { prisma: store },
    );

    const approval = await transitionArticleLifecycle(
      {
        articleId: current.id,
        transition: "approve",
        actor: "admin@example.com",
      },
      { prisma: store },
    );

    expect(approval).toMatchObject({
      ok: false,
      code: "stale_audit",
      articleUnchanged: true,
    });
    expect(current.status).toBe("review-required");
  });

  it("keeps generic PATCH of published audited content fail-closed", async () => {
    const { store, tx } = createStore();
    const result = await updateArticleUnderGovernanceLock(
      {
        articleId: publishedArticle.id,
        changes: { content: ARTICLE_3_SAMUEL_17_32_AFTER },
      },
      { prisma: store },
    );
    expect(result).toMatchObject({
      ok: false,
      code: "published_immutable",
      articleUnchanged: true,
    });
    expect(tx.article.update).not.toHaveBeenCalled();
  });

  it("rejects a non-published article without a write", async () => {
    const { store, tx } = createStore(
      snapshotArticle({ ...publishedArticle, status: "approved" }),
    );
    const result = await correctAndWithdrawPublishedArticle(
      {
        articleId: publishedArticle.id,
        reason: "Correct the 1 Samuel 17:32 wording.",
        changes: { content: ARTICLE_3_SAMUEL_17_32_AFTER },
        actor: "admin@example.com",
      },
      { prisma: store },
    );
    expect(result).toMatchObject({
      ok: false,
      code: "invalid_article_status",
      articleUnchanged: true,
    });
    expect(tx.article.update).not.toHaveBeenCalled();
    expect(tx.articleReviewNote.create).not.toHaveBeenCalled();
  });

  it("returns no_effective_change when posted values already match", async () => {
    const { store, tx } = createStore();
    const result = await correctAndWithdrawPublishedArticle(
      {
        articleId: publishedArticle.id,
        reason: "Correct the 1 Samuel 17:32 wording.",
        changes: { content: ARTICLE_3_SAMUEL_17_32_BEFORE },
        actor: "admin@example.com",
      },
      { prisma: store },
    );
    expect(result).toMatchObject({
      ok: false,
      code: "no_effective_change",
      articleUnchanged: true,
    });
    expect(tx.article.update).not.toHaveBeenCalled();
  });

  it("returns article_not_found when the article is missing", async () => {
    const { store, tx, article } = createStore();
    tx.article.findUnique.mockResolvedValueOnce(null);
    const result = await correctAndWithdrawPublishedArticle(
      {
        articleId: article.id,
        reason: "Correct the 1 Samuel 17:32 wording.",
        changes: { content: ARTICLE_3_SAMUEL_17_32_AFTER },
        actor: "admin@example.com",
      },
      { prisma: store },
    );
    expect(result).toMatchObject({
      ok: false,
      code: "article_not_found",
      articleUnchanged: true,
    });
    expect(tx.article.update).not.toHaveBeenCalled();
  });

  it("rolls back the article when the correction note cannot be created", async () => {
    const { store, article } = createStore(undefined, { failNote: true });
    const before = snapshotArticle(article);

    await expect(
      correctAndWithdrawPublishedArticle(
        {
          articleId: article.id,
          reason: "Correct the 1 Samuel 17:32 wording.",
          changes: { content: ARTICLE_3_SAMUEL_17_32_AFTER },
          actor: "admin@example.com",
        },
        { prisma: store },
      ),
    ).rejects.toThrow("forced correction note failure");

    expect(article.content).toBe(before.content);
    expect(article.status).toBe("published");
    expect(article.publishedAt).toEqual(before.publishedAt);
    expect(article.approvedAt).toEqual(before.approvedAt);
    expect(article.approvedBy).toBe(before.approvedBy);
    expect(article.editorialScore).toBe(before.editorialScore);
    expect(article.qualityScore).toBe(before.qualityScore);
    expect(article.seoScore).toBe(before.seoScore);
    expect(article.reviewNotes).toEqual(before.reviewNotes);
  });

  it("fails the second in-process correction after the first withdraws the article", async () => {
    const { store, article, createdNotes } = createStore();
    const first = await correctAndWithdrawPublishedArticle(
      {
        articleId: article.id,
        reason: "First correction.",
        changes: { content: ARTICLE_3_SAMUEL_17_32_AFTER },
        actor: "admin@example.com",
        now: correctedAt,
      },
      { prisma: store },
    );
    const second = await correctAndWithdrawPublishedArticle(
      {
        articleId: article.id,
        reason: "Second correction.",
        changes: { content: `${ARTICLE_3_SAMUEL_17_32_AFTER} extra` },
        actor: "admin@example.com",
        now: correctedAt,
      },
      { prisma: store },
    );

    expect(first.ok).toBe(true);
    expect(second).toMatchObject({
      ok: false,
      code: "correction_conflict",
      articleUnchanged: true,
    });
    expect(createdNotes).toHaveLength(1);
    expect(article.content).toBe(ARTICLE_3_SAMUEL_17_32_AFTER);
    expect(article.status).toBe("review-required");
  });
});
