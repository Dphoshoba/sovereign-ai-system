import { beforeEach, describe, expect, it, vi } from "vitest";
import { computeArticleAuditFingerprint } from "../../lib/research/article-audit-fingerprint";
import { serializeArticleAuditAssociation } from "../../lib/research/article-audit-association";
import {
  transitionArticleLifecycle,
  updateArticleUnderGovernanceLock,
} from "../../lib/publishing/article-lifecycle";

const auditCreatedAt = new Date("2026-09-15T00:00:00.000Z");
const baseArticle = {
  id: "article-1",
  title: "Governed AI workflows",
  excerpt: "Evidence-backed operations.",
  content: "See [NIST](https://www.nist.gov/artificial-intelligence).",
  category: "ai-tools",
  seoTitle: "Governed AI workflows",
  seoDescription: "Build accountable AI workflows.",
  seoKeywords: "AI governance",
  featuredImage: null,
  status: "review-required",
  scheduledFor: null,
  publishedAt: null,
  approvedAt: null,
  approvedBy: null,
  researchSources: [],
  researchAudits: [
    { id: "audit-current", articleId: "article-1", createdAt: auditCreatedAt },
  ],
  reviewNotes: [] as Array<{ action: string; note: string | null }>,
};

function currentAssociation() {
  const fingerprint = computeArticleAuditFingerprint(baseArticle, [
    "https://www.nist.gov/artificial-intelligence",
  ]);
  return {
    action: "research-audit-fingerprint",
    note: serializeArticleAuditAssociation({
      auditId: "audit-current",
      contentFingerprint: fingerprint,
      createdAt: auditCreatedAt,
    }),
  };
}

function createStore(
  article = { ...baseArticle },
  options: { onLock?: () => void } = {},
) {
  const calls: string[] = [];
  const tx = {
    $queryRaw: vi.fn(async () => {
      calls.push("lock");
      options.onLock?.();
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
      create: vi.fn(async () => {
        calls.push("note");
        return { id: "note-1" };
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
    $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  };
  return { store, tx, calls, article };
}

describe("transitionArticleLifecycle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("locks and re-reads before atomically approving a current revision", async () => {
    const current = {
      ...baseArticle,
      reviewNotes: [currentAssociation()],
    };
    const { store, tx, calls } = createStore(current);

    const result = await transitionArticleLifecycle(
      {
        articleId: current.id,
        transition: "approve",
        actor: "editor@example.com",
        reviewNote: "Reviewed.",
        now: new Date("2026-09-16T00:00:00.000Z"),
      },
      { prisma: store },
    );

    expect(result).toMatchObject({ ok: true });
    expect(calls).toEqual(["lock", "read", "update", "note"]);
    expect(tx.article.update).toHaveBeenCalledWith({
      where: { id: current.id },
      data: expect.objectContaining({
        status: "approved",
        approvedBy: "editor@example.com",
      }),
    });
  });

  it("returns a structured no-write error for a stale revision", async () => {
    const { store, tx } = createStore({ ...baseArticle, reviewNotes: [] });

    const result = await transitionArticleLifecycle(
      { articleId: baseArticle.id, transition: "approve" },
      { prisma: store },
    );

    expect(result).toMatchObject({
      ok: false,
      code: "stale_audit",
      articleUnchanged: true,
    });
    expect(tx.article.update).not.toHaveBeenCalled();
    expect(tx.articleReviewNote.create).not.toHaveBeenCalled();
  });

  it("distinguishes a missing audit from a stale audit", async () => {
    const { store, tx } = createStore({
      ...baseArticle,
      researchAudits: [],
      reviewNotes: [],
    });

    const result = await transitionArticleLifecycle(
      { articleId: baseArticle.id, transition: "approve" },
      { prisma: store },
    );

    expect(result).toMatchObject({
      ok: false,
      code: "missing_audit",
      articleUnchanged: true,
    });
    expect(tx.article.update).not.toHaveBeenCalled();
  });

  it("schedules an approved article with a current audit", async () => {
    const approved = {
      ...baseArticle,
      status: "approved",
      approvedAt: new Date("2026-09-15T01:00:00.000Z"),
      approvedBy: "editor",
      reviewNotes: [currentAssociation()],
    };
    const { store, tx } = createStore(approved);
    const scheduledFor = new Date("2026-09-20T00:00:00.000Z");

    const result = await transitionArticleLifecycle(
      { articleId: approved.id, transition: "schedule", scheduledFor },
      { prisma: store },
    );

    expect(result).toMatchObject({
      ok: true,
      alreadyApplied: false,
      article: { status: "scheduled", scheduledFor },
    });
    expect(tx.article.update).toHaveBeenCalledTimes(1);
  });

  it("publishes an approved article with a current audit", async () => {
    const approved = {
      ...baseArticle,
      status: "approved",
      approvedAt: new Date("2026-09-15T01:00:00.000Z"),
      approvedBy: "editor",
      reviewNotes: [currentAssociation()],
    };
    const { store, tx } = createStore(approved);

    const result = await transitionArticleLifecycle(
      {
        articleId: approved.id,
        transition: "publish",
        now: new Date("2026-09-16T00:00:00.000Z"),
      },
      { prisma: store },
    );

    expect(result).toMatchObject({
      ok: true,
      alreadyApplied: false,
      article: { status: "published" },
    });
    expect(tx.article.update).toHaveBeenCalledTimes(1);
  });

  it("returns a no-write result for an invalid transition", async () => {
    const draft = {
      ...baseArticle,
      status: "draft",
      reviewNotes: [currentAssociation()],
    };
    const { store, tx } = createStore(draft);

    const result = await transitionArticleLifecycle(
      { articleId: draft.id, transition: "approve" },
      { prisma: store },
    );

    expect(result).toMatchObject({
      ok: false,
      code: "invalid_status",
      articleUnchanged: true,
    });
    expect(tx.article.update).not.toHaveBeenCalled();
    expect(tx.articleReviewNote.create).not.toHaveBeenCalled();
  });

  it("rechecks the due-time precondition under the lock", async () => {
    const scheduled = {
      ...baseArticle,
      status: "scheduled",
      scheduledFor: new Date("2026-09-20T00:00:00.000Z"),
      reviewNotes: [currentAssociation()],
    };
    const { store, tx } = createStore(scheduled);

    const result = await transitionArticleLifecycle(
      {
        articleId: scheduled.id,
        transition: "publish",
        requireDueAt: new Date("2026-09-16T00:00:00.000Z"),
      },
      { prisma: store },
    );

    expect(result).toMatchObject({
      ok: false,
      code: "not_due",
      articleUnchanged: true,
    });
    expect(tx.article.update).not.toHaveBeenCalled();
  });

  it.each([
    ["approve", "approved"],
    ["schedule", "scheduled"],
    ["publish", "published"],
  ] as const)(
    "treats a repeated %s operation as an idempotent no-write",
    async (transition, status) => {
      const scheduledFor =
        transition === "schedule"
          ? new Date("2026-09-20T00:00:00.000Z")
          : null;
      const alreadyFinal = {
        ...baseArticle,
        status,
        scheduledFor,
        publishedAt:
          transition === "publish"
            ? new Date("2026-09-16T00:00:00.000Z")
            : null,
        approvedAt: new Date("2026-09-15T01:00:00.000Z"),
        approvedBy: "editor",
        reviewNotes: [currentAssociation()],
      };
      const { store, tx } = createStore(alreadyFinal);

      const result = await transitionArticleLifecycle(
        {
          articleId: alreadyFinal.id,
          transition,
          scheduledFor: scheduledFor ?? undefined,
          queueId: transition === "publish" ? "queue-1" : undefined,
        },
        { prisma: store },
      );

      expect(result).toMatchObject({
        ok: true,
        alreadyApplied: true,
        articleUnchanged: true,
      });
      expect(tx.article.update).not.toHaveBeenCalled();
      expect(tx.articleReviewNote.create).not.toHaveBeenCalled();
      expect(tx.publishingQueue.update).not.toHaveBeenCalled();
    },
  );

  it("rejects a scheduled article and clears lifecycle metadata atomically", async () => {
    const scheduled = {
      ...baseArticle,
      status: "scheduled",
      approvedAt: new Date("2026-09-15T01:00:00.000Z"),
      approvedBy: "editor",
      scheduledFor: new Date("2026-09-20T00:00:00.000Z"),
      reviewNotes: [currentAssociation()],
    };
    const { store, tx } = createStore(scheduled);

    const result = await transitionArticleLifecycle(
      {
        articleId: scheduled.id,
        transition: "reject",
        actor: "admin-1",
        reviewNote: "Evidence needs revision.",
      },
      { prisma: store },
    );

    expect(result).toMatchObject({
      ok: true,
      alreadyApplied: false,
      article: { status: "rejected" },
    });
    expect(tx.article.update).toHaveBeenCalledWith({
      where: { id: scheduled.id },
      data: {
        status: "rejected",
        approvedAt: null,
        approvedBy: null,
        scheduledFor: null,
        publishedAt: null,
      },
    });
    expect(tx.articleReviewNote.create).toHaveBeenCalledWith({
      data: {
        articleId: scheduled.id,
        action: "rejected",
        reviewer: "admin-1",
        note: "Evidence needs revision.",
      },
    });
  });

  it("rejects an invalid rejection transition without writing", async () => {
    const draft = { ...baseArticle, status: "draft" };
    const { store, tx } = createStore(draft);

    const result = await transitionArticleLifecycle(
      { articleId: draft.id, transition: "reject" },
      { prisma: store },
    );

    expect(result).toMatchObject({
      ok: false,
      code: "invalid_status",
      articleUnchanged: true,
    });
    expect(tx.article.update).not.toHaveBeenCalled();
    expect(tx.articleReviewNote.create).not.toHaveBeenCalled();
  });

  it("treats repeated rejection as an idempotent no-write", async () => {
    const rejected = { ...baseArticle, status: "rejected" };
    const { store, tx } = createStore(rejected);

    const result = await transitionArticleLifecycle(
      { articleId: rejected.id, transition: "reject" },
      { prisma: store },
    );

    expect(result).toMatchObject({
      ok: true,
      alreadyApplied: true,
      articleUnchanged: true,
    });
    expect(tx.article.update).not.toHaveBeenCalled();
    expect(tx.articleReviewNote.create).not.toHaveBeenCalled();
  });

  it("allows an existing published article to be archived", async () => {
    const published = {
      ...baseArticle,
      status: "published",
      publishedAt: new Date("2026-09-16T00:00:00.000Z"),
    };
    const { store, tx } = createStore(published);

    const result = await transitionArticleLifecycle(
      { articleId: published.id, transition: "archive" },
      { prisma: store },
    );

    expect(result).toMatchObject({
      ok: true,
      alreadyApplied: false,
      article: { status: "archived" },
    });
    expect(tx.article.update).toHaveBeenCalledWith({
      where: { id: published.id },
      data: { status: "archived" },
    });
    expect(tx.articleReviewNote.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        articleId: published.id,
        action: "archived",
      }),
    });
  });

  it("treats repeated archival as an idempotent no-write", async () => {
    const archived = { ...baseArticle, status: "archived" };
    const { store, tx } = createStore(archived);

    const result = await transitionArticleLifecycle(
      { articleId: archived.id, transition: "archive" },
      { prisma: store },
    );

    expect(result).toMatchObject({
      ok: true,
      alreadyApplied: true,
      articleUnchanged: true,
    });
    expect(tx.article.update).not.toHaveBeenCalled();
  });

  it("publishes an article and its queue item in the same transaction", async () => {
    const current = {
      ...baseArticle,
      status: "approved",
      reviewNotes: [currentAssociation()],
    };
    const { store, tx, calls } = createStore(current);

    const result = await transitionArticleLifecycle(
      {
        articleId: current.id,
        transition: "publish",
        queueId: "queue-1",
        now: new Date("2026-09-16T00:00:00.000Z"),
      },
      { prisma: store },
    );

    expect(result).toMatchObject({ ok: true, alreadyApplied: false });
    expect(calls).toEqual(["lock", "read", "update", "queue"]);
    expect(tx.publishingQueue.update).toHaveBeenCalledWith({
      where: { id: "queue-1" },
      data: {
        status: "published",
        publishedAt: new Date("2026-09-16T00:00:00.000Z"),
      },
    });
  });

  it("rolls back the Article when the queue write fails", async () => {
    const current = {
      ...baseArticle,
      status: "approved",
      approvedAt: new Date("2026-09-15T01:00:00.000Z"),
      approvedBy: "editor",
      reviewNotes: [currentAssociation()],
    };
    const { store, tx, article } = createStore(current);
    const transaction = store.$transaction;
    transaction.mockImplementation(async (callback) => {
      const snapshot = { ...article };
      try {
        return await callback(tx);
      } catch (error) {
        Object.assign(article, snapshot);
        throw error;
      }
    });
    tx.publishingQueue.update.mockRejectedValueOnce(new Error("queue failed"));

    await expect(
      transitionArticleLifecycle(
        {
          articleId: current.id,
          transition: "publish",
          queueId: "queue-1",
        },
        { prisma: store },
      ),
    ).rejects.toThrow("queue failed");

    expect(article.status).toBe("approved");
    expect(article.publishedAt).toBeNull();
    expect(tx.article.update).toHaveBeenCalledTimes(1);
    expect(tx.publishingQueue.update).toHaveBeenCalledTimes(1);
  });

  it("uses content re-read after lock acquisition for audit currency", async () => {
    const current = {
      ...baseArticle,
      reviewNotes: [currentAssociation()],
    };
    const { store, tx } = createStore(current, {
      onLock: () => {
        current.content = "Content changed before the lock was acquired.";
      },
    });

    const result = await transitionArticleLifecycle(
      { articleId: current.id, transition: "approve" },
      { prisma: store },
    );

    expect(result).toMatchObject({
      ok: false,
      code: "stale_audit",
      articleUnchanged: true,
    });
    expect(tx.article.update).not.toHaveBeenCalled();
  });

  it("uses the source set re-read after lock acquisition", async () => {
    const current = {
      ...baseArticle,
      researchSources: [] as Array<{
        title: string | null;
        url: string | null;
        sourceType: string | null;
        authorityScore: number;
        trustScore: number;
      }>,
      reviewNotes: [currentAssociation()],
    };
    const { store, tx } = createStore(current, {
      onLock: () => {
        current.researchSources.push({
          title: "New source",
          url: "https://example.com/new-evidence",
          sourceType: "web",
          authorityScore: 80,
          trustScore: 80,
        });
      },
    });

    const result = await transitionArticleLifecycle(
      { articleId: current.id, transition: "approve" },
      { prisma: store },
    );

    expect(result).toMatchObject({
      ok: false,
      code: "stale_audit",
      articleUnchanged: true,
    });
    expect(tx.article.update).not.toHaveBeenCalled();
  });

  it("invalidates approval when audited content is edited after approval", async () => {
    const approved = {
      ...baseArticle,
      status: "approved",
      approvedAt: new Date("2026-09-15T01:00:00.000Z"),
      approvedBy: "editor",
      reviewNotes: [currentAssociation()],
    };
    const { store, tx } = createStore(approved);

    const result = await updateArticleUnderGovernanceLock(
      { articleId: approved.id, changes: { title: "Revised title" } },
      { prisma: store },
    );

    expect(result).toMatchObject({
      ok: true,
      article: { status: "review-required" },
    });
    expect(tx.article.update).toHaveBeenCalledWith({
      where: { id: approved.id },
      data: expect.objectContaining({
        title: "Revised title",
        status: "review-required",
        approvedAt: null,
        approvedBy: null,
        scheduledFor: null,
      }),
    });
  });

  it("rejects audited content edits after publication", async () => {
    const published = { ...baseArticle, status: "published" };
    const { store, tx } = createStore(published);

    const result = await updateArticleUnderGovernanceLock(
      { articleId: published.id, changes: { content: "Changed" } },
      { prisma: store },
    );

    expect(result).toMatchObject({
      ok: false,
      code: "published_immutable",
      articleUnchanged: true,
    });
    expect(tx.article.update).not.toHaveBeenCalled();
  });
});
