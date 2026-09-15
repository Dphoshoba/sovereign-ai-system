import { describe, expect, it, vi } from "vitest"
import { publishDueArticles } from "../../lib/publishing/publish-due-articles"
import { computeArticleAuditFingerprint } from "../../lib/research/article-audit-fingerprint"
import {
  RESEARCH_AUDIT_FINGERPRINT_ACTION,
  serializeArticleAuditAssociation,
} from "../../lib/research/article-audit-association"

type DueFixture = {
  id: string
  title: string
  excerpt: string | null
  content: string | null
  category: string
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
  featuredImage: string | null
  status: string
  scheduledFor: Date | null
  publishedAt: Date | null
  approvedAt: Date | null
  approvedBy: string | null
  researchSources: []
  researchAudits: Array<{
    id: string
    articleId: string
    createdAt: Date
  }>
  reviewNotes: Array<{ action: string; note: string | null }>
}

function dueArticle(overrides: Partial<DueFixture> = {}): DueFixture {
  const article: DueFixture = {
    id: "due-1",
    title: "Governed AI",
    excerpt: "Evidence-backed operations.",
    content: "See [NIST](https://www.nist.gov/artificial-intelligence).",
    category: "ai-tools",
    seoTitle: "Governed AI",
    seoDescription: "Evidence-backed operations.",
    seoKeywords: "AI governance",
    featuredImage: null,
    status: "scheduled",
    scheduledFor: new Date("2026-09-14T03:32:00.000Z"),
    publishedAt: null,
    approvedAt: new Date("2026-09-13T00:00:00.000Z"),
    approvedBy: "editor",
    researchSources: [],
    researchAudits: [],
    reviewNotes: [],
    ...overrides,
  }

  if (overrides.researchAudits === undefined) {
    const auditId = `audit-${article.id}`
    const createdAt = new Date("2026-09-13T00:00:00.000Z")
    article.researchAudits = [
      { id: auditId, articleId: article.id, createdAt },
    ]
    article.reviewNotes = [
      {
        action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
        note: serializeArticleAuditAssociation({
          auditId,
          contentFingerprint: computeArticleAuditFingerprint(article, [
            "https://www.nist.gov/artificial-intelligence",
          ]),
          createdAt,
        }),
      },
    ]
  }

  return article
}

function createStore(
  articles: DueFixture[],
  options: { onLock?: (articleId: string) => void } = {},
) {
  const tx = {
    $queryRaw: vi.fn(async (_query: TemplateStringsArray, articleId: string) => {
      options.onLock?.(articleId)
      return [{ id: articleId }]
    }),
    article: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
        articles.find((item) => item.id === where.id) ?? null,
      ),
      update: vi.fn(
        async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
          const article = articles.find((item) => item.id === where.id)
          if (!article) throw new Error("Article not found")
          Object.assign(article, data)
          return { ...article }
        },
      ),
      findMany: vi.fn(async () => articles),
    },
    articleReviewNote: {
      create: vi.fn(async () => ({ id: "note-1" })),
    },
    publishingQueue: {
      update: vi.fn(async () => ({ id: "queue-1" })),
    },
  }

  return {
    article: tx.article,
    $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
    tx,
  }
}

describe("publishDueArticles", () => {
  it("publishes a due scheduled article once", async () => {
    const store = createStore([dueArticle()])
    const afterPublish = vi.fn()

    const result = await publishDueArticles({
      now: new Date("2026-09-14T03:45:00.000Z"),
      source: "test",
      prisma: store,
      afterPublish,
    })

    expect(result.published).toBe(1)
    expect(result.publishedIds).toEqual(["due-1"])
    expect(store.tx.article.update).toHaveBeenCalledWith({
      where: { id: "due-1" },
      data: expect.objectContaining({ status: "published" }),
    })
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
    expect(store.tx.article.update).not.toHaveBeenCalled()
  })

  it("skips articles rejected by publicationGuard", async () => {
    const store = createStore([
      dueArticle({
        id: "review-1",
        status: "review-required",
      }),
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
      { id: "review-1", category: "invalid_status" },
    ])
    expect(store.tx.article.update).not.toHaveBeenCalled()
    expect(afterPublish).not.toHaveBeenCalled()
  })

  it("skips a scheduled article when only a stale audit exists", async () => {
    const store = createStore([
      dueArticle({
        id: "stale-1",
        researchAudits: [
          {
            id: "audit-old",
            articleId: "stale-1",
            createdAt: new Date("2026-09-13T00:00:00.000Z"),
          },
        ],
        reviewNotes: [],
      }),
    ])

    const result = await publishDueArticles({
      now: new Date("2026-09-14T03:45:00.000Z"),
      source: "test",
      prisma: store,
      afterPublish: vi.fn(),
    })

    expect(result.published).toBe(0)
    expect(result.skippedItems).toEqual([
      { id: "stale-1", category: "stale_audit" },
    ])
  })

  it("treats a second overlapping claim as already-claimed", async () => {
    const store = createStore([dueArticle()])

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
      dueArticle(),
      dueArticle({
        id: "due-2",
      }),
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
    expect(result.failedItems).toEqual([
      { id: "due-1", category: "side-effect" },
    ])
    expect(store.tx.article.update).toHaveBeenCalledTimes(2)
  })

  it("rechecks due eligibility after locking the selected article", async () => {
    const selected = dueArticle()
    const store = createStore([selected], {
      onLock: () => {
        selected.scheduledFor = new Date("2026-09-20T00:00:00.000Z")
      },
    })
    const afterPublish = vi.fn()

    const result = await publishDueArticles({
      now: new Date("2026-09-14T03:45:00.000Z"),
      source: "test",
      prisma: store,
      afterPublish,
    })

    expect(result.published).toBe(0)
    expect(result.skippedItems).toEqual([
      { id: "due-1", category: "not_due" },
    ])
    expect(store.tx.article.update).not.toHaveBeenCalled()
    expect(afterPublish).not.toHaveBeenCalled()
  })
})
