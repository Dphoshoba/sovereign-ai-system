import { beforeEach, describe, expect, it, vi } from "vitest"
import { extractArticleSourceLinks } from "../../lib/research/article-source-links"
import { prepareArticleForReview } from "../../lib/research/prepare-article-for-review"
import type {
  PrepareForReviewArticle,
  PrepareForReviewStore,
} from "../../lib/research/prepare-article-for-review"
import type { EvidenceRegistryResult } from "../../lib/research/evidence-registry"
import { sourceCollector } from "../../lib/research/source-collector"

vi.mock("../../lib/research/source-collector", async () => {
  const actual = await vi.importActual<
    typeof import("../../lib/research/source-collector")
  >("../../lib/research/source-collector")

  return {
    ...actual,
    sourceCollector: vi.fn(actual.sourceCollector),
  }
})

const USEFUL_EVIDENCE_TEXT =
  "A government research report on workflow automation shows that artificial intelligence can reduce repetitive creator tasks and improve productivity across content pipelines. Responsible governance remains essential for trustworthy publishing."

function usefulEvidence(url: string): EvidenceRegistryResult {
  return {
    topic: "Manual article",
    evidenceCount: 1,
    registryStatus: "Evidence registry created from filtered and ranked evidence chunks.",
    evidence: [
      {
        id: "nist-ai-chunk-1",
        sourceTitle: "NIST AI",
        sourceUrl: url,
        sourceType: "government",
        extractedText: USEFUL_EVIDENCE_TEXT,
        confidence: 90,
        requiresHumanReview: true,
      },
    ],
  }
}

function baseArticle(
  overrides: Partial<PrepareForReviewArticle> = {}
): PrepareForReviewArticle {
  return {
    id: "article-1",
    title: "How creators can use automation without losing editorial judgment",
    slug: "creators-automation-judgment",
    category: "ai-tools",
    status: "review",
    excerpt: "A manual draft with linked research.",
    content:
      "Creators can keep judgment while using tools. See [NIST AI](https://www.nist.gov/artificial-intelligence) for the research basis.",
    featuredImage: "/generated/manual-cover.png",
    seoTitle: "How creators can use automation without losing judgment",
    seoDescription:
      "A practical look at how creators can use automation while keeping editorial judgment and research discipline intact.",
    seoKeywords: "ai automation, editorial judgment, creator workflow",
    researchSources: [],
    researchAudits: [],
    ...overrides,
  }
}

function createStore(article: PrepareForReviewArticle | null) {
  const createdAudits: unknown[] = []
  const articleUpdates: unknown[] = []
  const reviewNotes: unknown[] = []
  let auditCount = article?.researchAudits.length ?? 0

  const tx = {
    article: {
      findUnique: vi.fn(),
      update: vi.fn(async (args: { where: { id: string }; data: Record<string, unknown> }) => {
        articleUpdates.push(args)
        return { id: article?.id, ...args.data }
      }),
    },
    articleResearchAudit: {
      count: vi.fn(async () => auditCount),
      create: vi.fn(async (args: unknown) => {
        auditCount += 1
        createdAudits.push(args)
        return { id: "audit-1" }
      }),
    },
    articleReviewNote: {
      create: vi.fn(async (args: unknown) => {
        reviewNotes.push(args)
        return { id: "note-1" }
      }),
    },
  }

  const store: PrepareForReviewStore = {
    article: {
      findUnique: vi.fn(async () => article),
      update: tx.article.update,
    },
    articleResearchAudit: tx.articleResearchAudit,
    articleReviewNote: tx.articleReviewNote,
    $transaction: vi.fn(async (fn) => fn(tx)),
  }

  return { store, createdAudits, articleUpdates, reviewNotes, tx }
}

describe("extractArticleSourceLinks", () => {
  it("collects stored research sources and markdown links without inventing URLs", () => {
    const sources = extractArticleSourceLinks({
      excerpt: "Background from https://www.nist.gov/artificial-intelligence",
      content: "See also [OECD AI](https://oecd.ai/en/) for policy context.",
      featuredImage: "https://cdn.example.com/cover.png",
      researchSources: [
        {
          title: "NIST",
          url: "https://www.nist.gov/artificial-intelligence",
          sourceType: "government",
          authorityScore: 95,
          trustScore: 95,
        },
      ],
    })

    expect(sources.map((source) => source.url).sort()).toEqual([
      "https://oecd.ai/en/",
      "https://www.nist.gov/artificial-intelligence",
    ])
    expect(sources.find((source) => source.url.includes("nist.gov"))?.authorityScore).toBe(95)
  })

  it("ignores featured images and returns no sources when none exist", () => {
    const sources = extractArticleSourceLinks({
      content: "A manually written article with no citations.",
      featuredImage: "https://cdn.example.com/cover.png",
      researchSources: [],
    })

    expect(sources).toEqual([])
  })
})

describe("prepareArticleForReview", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("records supported audit results and moves the article to review-required", async () => {
    const article = baseArticle()
    const { store, createdAudits, articleUpdates } = createStore(article)
    const collectEvidence = vi.fn(async () =>
      usefulEvidence("https://www.nist.gov/artificial-intelligence")
    )

    const result = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence,
      reviewer: "editor@example.com",
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.article.status).toBe("review-required")
    expect(result.audit.sourceCount).toBeGreaterThan(0)
    expect(result.audit.evidenceCount).toBeGreaterThan(0)
    expect(result.audit.factCount).toBeGreaterThan(0)
    expect(typeof result.article.editorialScore).toBe("number")
    expect(typeof result.article.qualityScore).toBe("number")
    expect(typeof result.article.seoScore).toBe("number")
    expect(sourceCollector).not.toHaveBeenCalled()
    expect(collectEvidence).toHaveBeenCalledTimes(1)
    expect(createdAudits).toHaveLength(1)
    expect(articleUpdates).toHaveLength(1)

    const update = articleUpdates[0] as { data: Record<string, unknown> }
    expect(update.data.status).toBe("review-required")
    expect(update.data).not.toHaveProperty("title")
    expect(update.data).not.toHaveProperty("slug")
    expect(update.data).not.toHaveProperty("excerpt")
    expect(update.data).not.toHaveProperty("content")
    expect(update.data).not.toHaveProperty("featuredImage")
  })

  it("returns a missing-evidence error and leaves the article unchanged when no sources exist", async () => {
    const article = baseArticle({
      content: "A manually written article with no citations or URLs.",
      excerpt: "No sources here.",
      researchSources: [],
    })
    const { store, createdAudits, articleUpdates } = createStore(article)
    const collectEvidence = vi.fn()

    const result = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence,
    })

    expect(result).toMatchObject({
      ok: false,
      code: "missing_evidence",
      articleUnchanged: true,
    })
    expect(collectEvidence).not.toHaveBeenCalled()
    expect(store.$transaction).not.toHaveBeenCalled()
    expect(createdAudits).toHaveLength(0)
    expect(articleUpdates).toHaveLength(0)
  })

  it("returns missing evidence when source links yield no usable research text", async () => {
    const article = baseArticle()
    const { store, createdAudits, articleUpdates } = createStore(article)
    const collectEvidence = vi.fn(async () => ({
      topic: article.title,
      evidence: [],
      evidenceCount: 0,
      registryStatus: "No useful evidence available after filtering.",
    }))

    const result = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence,
    })

    expect(result).toMatchObject({
      ok: false,
      code: "missing_evidence",
      articleUnchanged: true,
    })
    expect(store.$transaction).not.toHaveBeenCalled()
    expect(createdAudits).toHaveLength(0)
    expect(articleUpdates).toHaveLength(0)
  })

  it("returns audit_failure and writes nothing when evidence collection throws", async () => {
    const article = baseArticle()
    const { store, createdAudits, articleUpdates } = createStore(article)
    const collectEvidence = vi.fn(async () => {
      throw new Error("verification pipeline unavailable")
    })

    const result = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence,
    })

    expect(result).toMatchObject({
      ok: false,
      code: "audit_failure",
      articleUnchanged: true,
    })
    expect(result.ok === false && result.error).toContain(
      "The article was left unchanged"
    )
    expect(store.$transaction).not.toHaveBeenCalled()
    expect(createdAudits).toHaveLength(0)
    expect(articleUpdates).toHaveLength(0)
  })

  it("does not change article title, slug, excerpt, body, or featured image on success", async () => {
    const article = baseArticle({
      title: "Original title",
      slug: "original-slug",
      excerpt: "Original excerpt with https://www.nist.gov/artificial-intelligence",
      content: "Original body with https://www.nist.gov/artificial-intelligence",
      featuredImage: "/generated/keep-me.png",
    })
    const { store, articleUpdates } = createStore(article)

    await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence: async () =>
        usefulEvidence("https://www.nist.gov/artificial-intelligence"),
    })

    const update = articleUpdates[0] as { data: Record<string, unknown> }
    for (const field of [
      "title",
      "slug",
      "excerpt",
      "content",
      "featuredImage",
      "seoTitle",
      "seoDescription",
      "seoKeywords",
    ]) {
      expect(update.data).not.toHaveProperty(field)
    }
  })

  it("refuses to create a second audit record", async () => {
    const article = baseArticle({
      researchAudits: [{ id: "audit-existing" }],
    })
    const { store, createdAudits, articleUpdates } = createStore(article)
    const collectEvidence = vi.fn()

    const result = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence,
    })

    expect(result).toMatchObject({
      ok: false,
      code: "duplicate_audit",
      articleUnchanged: true,
    })
    expect(collectEvidence).not.toHaveBeenCalled()
    expect(store.$transaction).not.toHaveBeenCalled()
    expect(createdAudits).toHaveLength(0)
    expect(articleUpdates).toHaveLength(0)
  })

  it("prevents a duplicate audit if one appears during the write transaction", async () => {
    const article = baseArticle()
    const { store, createdAudits, articleUpdates, tx } = createStore(article)
    tx.articleResearchAudit.count.mockResolvedValueOnce(1)

    const result = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence: async () =>
        usefulEvidence("https://www.nist.gov/artificial-intelligence"),
    })

    expect(result).toMatchObject({
      ok: false,
      code: "duplicate_audit",
      articleUnchanged: true,
    })
    expect(createdAudits).toHaveLength(0)
    expect(articleUpdates).toHaveLength(0)
  })
})
