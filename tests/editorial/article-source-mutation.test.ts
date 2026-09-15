import { describe, expect, it, vi } from "vitest";
import { mutateArticleSources } from "../../lib/research/article-source-mutation";

function createStore(article: {
  id: string;
  status: string;
  approvedAt: Date | null;
  approvedBy: string | null;
  scheduledFor: Date | null;
  publishedAt: Date | null;
  sources?: Array<{ id: string; url: string | null }>;
}) {
  const sources = [...(article.sources ?? [])];
  const tx = {
    $queryRaw: vi.fn(async () => [{ id: article.id }]),
    article: {
      findUnique: vi.fn(async () => article),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(article, data);
        return article;
      }),
    },
    researchSource: {
      findMany: vi.fn(async () => [...sources]),
      create: vi.fn(async ({ data }: { data: { url: string | null } }) => {
        const created = { id: `source-${sources.length + 1}`, ...data };
        sources.push(created);
        return created;
      }),
      update: vi.fn(async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        const existing = sources.find((source) => source.id === where.id);
        if (!existing) throw new Error("Record to update does not exist");
        Object.assign(existing, data);
        return existing;
      }),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        const index = sources.findIndex((source) => source.id === where.id);
        if (index < 0) throw new Error("Record to delete does not exist");
        return sources.splice(index, 1)[0];
      }),
      deleteMany: vi.fn(async () => {
        const count = sources.length;
        sources.splice(0, sources.length);
        return { count };
      }),
    },
  };
  return {
    store: {
      $transaction: async (fn: (client: typeof tx) => unknown) => fn(tx),
    },
    tx,
    sources,
  };
}

describe("article source mutation service", () => {
  it("replaces sources atomically and clears approval state", async () => {
    const article = {
      id: "article-1",
      status: "approved",
      approvedAt: new Date("2026-09-15T00:00:00.000Z"),
      approvedBy: "editor",
      scheduledFor: null,
      publishedAt: null,
      sources: [{ id: "old", url: "https://example.com/old" }],
    };
    const { store, tx } = createStore(article);

    const result = await mutateArticleSources(
      {
        articleId: article.id,
        operation: "replace",
        sources: [{ url: "https://www.nist.gov/artificial-intelligence" }],
      },
      { prisma: store },
    );

    expect(result.ok).toBe(true);
    expect(tx.researchSource.deleteMany).toHaveBeenCalledTimes(1);
    expect(tx.researchSource.create).toHaveBeenCalledTimes(1);
    expect(tx.article.update).toHaveBeenCalledWith({
      where: { id: article.id },
      data: {
        status: "review-required",
        approvedAt: null,
        approvedBy: null,
        scheduledFor: null,
        publishedAt: null,
      },
    });
  });

  it("rejects source mutation for published articles", async () => {
    const article = {
      id: "article-1",
      status: "published",
      approvedAt: new Date("2026-09-15T00:00:00.000Z"),
      approvedBy: "editor",
      scheduledFor: null,
      publishedAt: new Date("2026-09-16T00:00:00.000Z"),
      sources: [{ id: "old", url: "https://example.com/old" }],
    };
    const { store, tx } = createStore(article);

    const result = await mutateArticleSources(
      {
        articleId: article.id,
        operation: "create",
        source: { url: "https://example.com/new" },
      },
      { prisma: store },
    );

    expect(result).toMatchObject({
      ok: false,
      code: "published_immutable",
      articleUnchanged: true,
    });
    expect(tx.researchSource.create).not.toHaveBeenCalled();
    expect(tx.article.update).not.toHaveBeenCalled();
  });

  it("rolls back a bulk replacement when a later write fails", async () => {
    const article = {
      id: "article-1",
      status: "review-required",
      approvedAt: null,
      approvedBy: null,
      scheduledFor: null,
      publishedAt: null,
      sources: [{ id: "old", url: "https://example.com/old" }],
    };
    const { store, tx, sources } = createStore(article);
    const snapshot = [...sources];
    store.$transaction = async (fn: (client: typeof tx) => unknown) => {
      try {
        return await fn(tx);
      } catch (error) {
        sources.splice(0, sources.length, ...snapshot);
        throw error;
      }
    };
    tx.researchSource.create.mockRejectedValueOnce(new Error("write failed"));

    await expect(
      mutateArticleSources(
        {
          articleId: article.id,
          operation: "replace",
          sources: [{ url: "https://example.com/new" }],
        },
        { prisma: store },
      ),
    ).rejects.toThrow("write failed");

    expect(sources).toEqual(snapshot);
  });
});
