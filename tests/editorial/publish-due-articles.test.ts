import { describe, expect, it, vi } from "vitest"
import { publishDueArticles } from "../../lib/publishing/publish-due-articles"

function createStore(articles: Array<{ id: string; status: string; scheduledFor: Date | null }>) {
  const claimed = new Set<string>()

  return {
    article: {
      findMany: vi.fn(async () => articles),
      updateMany: vi.fn(async ({ where }: { where: { id: string } }) => {
        const article = articles.find((item) => item.id === where.id)
        if (!article || claimed.has(article.id)) {
          return { count: 0 }
        }
        claimed.add(article.id)
        return { count: 1 }
      }),
    },
    claimed,
  }
}

describe("publishDueArticles", () => {
  it("publishes a due scheduled article once", async () => {
    const store = createStore([
      {
        id: "due-1",
        status: "scheduled",
        scheduledFor: new Date("2026-09-14T03:32:00.000Z"),
      },
    ])
    const afterPublish = vi.fn()

    const result = await publishDueArticles({
      now: new Date("2026-09-14T03:45:00.000Z"),
      source: "test",
      prisma: store,
      afterPublish,
    })

    expect(result.published).toBe(1)
    expect(result.publishedIds).toEqual(["due-1"])
    expect(store.article.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "due-1",
          publishedAt: null,
        }),
        data: expect.objectContaining({
          status: "published",
        }),
      })
    )
    expect(afterPublish).toHaveBeenCalledWith("due-1")
  })

  it("skips future articles because they are not selected", async () => {
    const store = createStore([])

    const result = await publishDueArticles({
      now: new Date("2026-09-14T03:00:00.000Z"),
      source: "test",
      prisma: store,
      afterPublish: vi.fn(),
    })

    expect(result.eligible).toBe(0)
    expect(result.published).toBe(0)
    expect(store.article.updateMany).not.toHaveBeenCalled()
  })

  it("skips articles rejected by publicationGuard", async () => {
    const store = createStore([
      {
        id: "review-1",
        status: "review-required",
        scheduledFor: new Date("2026-09-14T03:32:00.000Z"),
      },
    ])
    const afterPublish = vi.fn()

    const result = await publishDueArticles({
      now: new Date("2026-09-14T03:45:00.000Z"),
      source: "test",
      prisma: store,
      afterPublish,
    })

    expect(result.published).toBe(0)
    expect(result.skippedItems).toEqual([
      { id: "review-1", category: "publication-guard" },
    ])
    expect(store.article.updateMany).not.toHaveBeenCalled()
    expect(afterPublish).not.toHaveBeenCalled()
  })

  it("treats a second overlapping claim as already-claimed", async () => {
    const store = createStore([
      {
        id: "due-1",
        status: "scheduled",
        scheduledFor: new Date("2026-09-14T03:32:00.000Z"),
      },
    ])

    const first = await publishDueArticles({
      now: new Date("2026-09-14T03:45:00.000Z"),
      source: "test-a",
      prisma: store,
      afterPublish: vi.fn(),
    })
    const second = await publishDueArticles({
      now: new Date("2026-09-14T03:45:00.000Z"),
      source: "test-b",
      prisma: store,
      afterPublish: vi.fn(),
    })

    expect(first.published).toBe(1)
    expect(second.published).toBe(0)
    expect(second.skippedItems).toEqual([
      { id: "due-1", category: "already-claimed" },
    ])
  })

  it("isolates after-publish failures without reversing publication", async () => {
    const store = createStore([
      {
        id: "due-1",
        status: "scheduled",
        scheduledFor: new Date("2026-09-14T03:32:00.000Z"),
      },
      {
        id: "due-2",
        status: "scheduled",
        scheduledFor: new Date("2026-09-14T03:32:00.000Z"),
      },
    ])

    const result = await publishDueArticles({
      now: new Date("2026-09-14T03:45:00.000Z"),
      source: "test",
      prisma: store,
      afterPublish: async (articleId) => {
        if (articleId === "due-1") {
          throw new Error("newsletter failed")
        }
      },
    })

    expect(result.publishedIds).toEqual(["due-1", "due-2"])
    expect(result.failedItems).toEqual([{ id: "due-1", category: "side-effect" }])
    expect(store.claimed.has("due-1")).toBe(true)
    expect(store.claimed.has("due-2")).toBe(true)
  })
})
