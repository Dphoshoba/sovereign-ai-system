import { beforeEach, describe, expect, it, vi } from "vitest"
import { extractArticleSourceLinks } from "../../lib/research/article-source-links"
import { prepareArticleForReview } from "../../lib/research/prepare-article-for-review"
import type {
  PrepareForReviewArticle,
  PrepareForReviewStore,
} from "../../lib/research/prepare-article-for-review"
import type { EvidenceRegistryResult } from "../../lib/research/evidence-registry"
import { sourceCollector } from "../../lib/research/source-collector"
import { computeArticleAuditFingerprint } from "../../lib/research/article-audit-fingerprint"
import {
  RESEARCH_AUDIT_FINGERPRINT_ACTION,
  parseArticleAuditAssociation,
  serializeArticleAuditAssociation,
} from "../../lib/research/article-audit-association"
import { CURRENT_RESEARCH_AUDIT_ENGINE_REVISION } from "../../lib/research/research-audit-engine-revision"
import { GROUNDED_ARTICLE_CLAIM, GROUNDED_EVIDENCE_TEXT } from "../fixtures/research-audit/article-2"

vi.mock("../../lib/research/source-collector", async () => {
  const actual = await vi.importActual<
    typeof import("../../lib/research/source-collector")
  >("../../lib/research/source-collector")

  return {
    ...actual,
    sourceCollector: vi.fn(actual.sourceCollector),
  }
})

const USEFUL_EVIDENCE_TEXT = GROUNDED_EVIDENCE_TEXT
const auditCreatedAt = new Date("2026-09-15T00:00:00.000Z")

function usefulEvidence(url: string): EvidenceRegistryResult {
  return {
    topic: "Manual article",
    evidenceCount: 1,
    registryStatus:
      "Evidence registry created from filtered and ranked evidence chunks.",
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
  overrides: Partial<PrepareForReviewArticle> = {},
): PrepareForReviewArticle {
  return {
    id: "article-1",
    title: "How creators can use automation without losing editorial judgment",
    slug: "creators-automation-judgment",
    category: "ai-tools",
    status: "review",
    excerpt: GROUNDED_ARTICLE_CLAIM,
    content:
      `${GROUNDED_ARTICLE_CLAIM} See [NIST AI](https://www.nist.gov/artificial-intelligence) for the research basis.`,
    featuredImage: "/generated/manual-cover.png",
    seoTitle: "How creators can use automation without losing judgment",
    seoDescription:
      "A practical look at how creators can use automation while keeping editorial judgment and research discipline intact.",
    seoKeywords: "ai automation, editorial judgment, creator workflow",
    researchSources: [],
    researchAudits: [],
    reviewNotes: [],
    ...overrides,
  }
}

function createStore(article: PrepareForReviewArticle | null) {
  const createdAudits: unknown[] = []
  const articleUpdates: unknown[] = []
  const reviewNotes: unknown[] = []
  const audits = [...(article?.researchAudits ?? [])]
  let transactionQueue = Promise.resolve()
  const persistReviewNote = async (args: { data: Record<string, unknown> }) => {
    reviewNotes.push(args)
    article?.reviewNotes.push({
      action: String(args.data.action),
      note: typeof args.data.note === "string" ? args.data.note : null,
    })
    return { id: `note-${reviewNotes.length}` }
  }

  const tx = {
    article: {
      findUnique: vi.fn(async () => article),
      update: vi.fn(
        async (args: {
          where: { id: string }
          data: Record<string, unknown>
        }) => {
          articleUpdates.push(args)
          return { id: article?.id, ...args.data }
        },
      ),
    },
    articleResearchAudit: {
      create: vi.fn(async (args: { data: Record<string, unknown> }) => {
        const audit = {
          id: `audit-${audits.length + 1}`,
          articleId: String(args.data.articleId),
          createdAt: new Date("2026-09-15T00:00:00.000Z"),
        }
        audits.push(audit)
        article?.researchAudits.push(audit)
        createdAudits.push(args)
        return audit
      }),
    },
    articleReviewNote: {
      create: vi.fn(persistReviewNote),
    },
    $queryRaw: vi.fn(async () => [{ id: article?.id }]),
  }

  const store: PrepareForReviewStore = {
    article: {
      findUnique: vi.fn(async () => article),
      update: tx.article.update,
    },
    articleResearchAudit: tx.articleResearchAudit,
    articleReviewNote: tx.articleReviewNote,
    $queryRaw: tx.$queryRaw,
    $transaction: vi.fn(async (fn) => {
      const run = transactionQueue.then(async () => {
        const snapshots = {
          createdAudits: createdAudits.length,
          articleUpdates: articleUpdates.length,
          reviewNotes: reviewNotes.length,
          audits: audits.length,
          articleAudits: article?.researchAudits.length ?? 0,
          articleNotes: article?.reviewNotes.length ?? 0,
        }
        try {
          return await fn(tx)
        } catch (error) {
          createdAudits.splice(snapshots.createdAudits)
          articleUpdates.splice(snapshots.articleUpdates)
          reviewNotes.splice(snapshots.reviewNotes)
          audits.splice(snapshots.audits)
          article?.researchAudits.splice(snapshots.articleAudits)
          article?.reviewNotes.splice(snapshots.articleNotes)
          throw error
        }
      })
      transactionQueue = run.then(
        () => undefined,
        () => undefined,
      )
      return run
    }),
  }

  return {
    store,
    createdAudits,
    articleUpdates,
    reviewNotes,
    tx,
    persistReviewNote,
  }
}

function associationNote(
  auditId: string,
  contentFingerprint: string,
): { action: string; note: string } {
  return {
    action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
    note: serializeArticleAuditAssociation({
      auditId,
      contentFingerprint,
      createdAt: new Date("2026-09-15T00:00:00.000Z"),
    }),
  }
}

function fingerprintFor(article: PrepareForReviewArticle): string {
  const sources = extractArticleSourceLinks({
    content: article.content,
    excerpt: article.excerpt,
    featuredImage: article.featuredImage,
    researchSources: article.researchSources,
  })

  return computeArticleAuditFingerprint(
    article,
    sources.map((source) => source.url),
  )
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
    expect(
      sources.find((source) => source.url.includes("nist.gov"))?.authorityScore,
    ).toBe(95)
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
    const { store, createdAudits, articleUpdates, reviewNotes, tx } =
      createStore(article)
    const collectEvidence = vi.fn(async () =>
      usefulEvidence("https://www.nist.gov/artificial-intelligence"),
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

    const auditCreate = createdAudits[0] as {
      data: Record<string, unknown>
    }
    expect(auditCreate.data).not.toHaveProperty("contentFingerprint")

    const associationCreate = reviewNotes.find(
      (entry) =>
        (entry as { data: { action: string } }).data.action ===
        RESEARCH_AUDIT_FINGERPRINT_ACTION,
    ) as { data: { action: string; note: string } }
    expect(parseArticleAuditAssociation(associationCreate.data)).toMatchObject({
      auditId: result.audit.id,
      contentFingerprint: fingerprintFor(article),
      createdAt: result.audit.createdAt,
      algorithm: "sha256",
      version: 2,
      engineRevision: CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
    })
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1)
    expect(String(tx.$queryRaw.mock.calls[0]?.[0]?.raw?.[0])).toContain(
      'SELECT "id" FROM "Article" WHERE "id" = ',
    )
    expect(String(tx.$queryRaw.mock.calls[0]?.[0]?.raw?.[1])).toContain(
      "FOR UPDATE",
    )

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
      "The article was left unchanged",
    )
    expect(store.$transaction).not.toHaveBeenCalled()
    expect(createdAudits).toHaveLength(0)
    expect(articleUpdates).toHaveLength(0)
  })

  it("does not change article title, slug, excerpt, body, or featured image on success", async () => {
    const article = baseArticle({
      title: "Original title",
      slug: "original-slug",
      excerpt: GROUNDED_ARTICLE_CLAIM,
      content:
        `${GROUNDED_ARTICLE_CLAIM} Original body with https://www.nist.gov/artificial-intelligence`,
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

  it("refuses to create a second audit for identical content", async () => {
    const article = baseArticle()
    article.researchAudits = [
      { id: "audit-existing", articleId: article.id, createdAt: auditCreatedAt },
    ]
    article.reviewNotes = [
      associationNote("audit-existing", fingerprintFor(article)),
    ]
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

  it("allows revised content to create a new audit while preserving the previous audit", async () => {
    const previous = baseArticle({ title: "Previous title" })
    const article = baseArticle({
      researchAudits: [
        {
          id: "audit-previous",
          articleId: "article-1",
          createdAt: auditCreatedAt,
        },
      ],
      reviewNotes: [
        associationNote("audit-previous", fingerprintFor(previous)),
      ],
    })
    const { store, createdAudits, articleUpdates } = createStore(article)

    const result = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence: async () =>
        usefulEvidence("https://www.nist.gov/artificial-intelligence"),
    })

    expect(result.ok).toBe(true)
    expect(article.researchAudits).toHaveLength(2)
    expect(article.researchAudits[0]?.id).toBe("audit-previous")
    expect(createdAudits).toHaveLength(1)
    expect(articleUpdates).toHaveLength(1)
  })

  it("treats a legacy audit without an association as stale", async () => {
    const article = baseArticle({
      researchAudits: [
        {
          id: "audit-legacy",
          articleId: "article-1",
          createdAt: auditCreatedAt,
        },
      ],
    })
    const { store, createdAudits } = createStore(article)

    const result = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence: async () =>
        usefulEvidence("https://www.nist.gov/artificial-intelligence"),
    })

    expect(result.ok).toBe(true)
    expect(createdAudits).toHaveLength(1)
  })

  it("prevents a duplicate audit if its association appears after the preflight", async () => {
    const article = baseArticle()
    const { store, createdAudits, articleUpdates, tx } = createStore(article)
    tx.article.findUnique.mockImplementationOnce(async () => {
      article.researchAudits.push({
        id: "audit-concurrent",
        articleId: article.id,
        createdAt: auditCreatedAt,
      })
      article.reviewNotes.push(
        associationNote("audit-concurrent", fingerprintFor(article)),
      )
      return article
    })

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

  it("serializes concurrent requests so the revision creates one audit", async () => {
    const article = baseArticle()
    const { store, createdAudits, articleUpdates } = createStore(article)
    const collectEvidence = vi.fn(async () =>
      usefulEvidence("https://www.nist.gov/artificial-intelligence"),
    )

    const [first, second] = await Promise.all([
      prepareArticleForReview(article.id, { prisma: store, collectEvidence }),
      prepareArticleForReview(article.id, { prisma: store, collectEvidence }),
    ])

    expect([first.ok, second.ok].filter(Boolean)).toHaveLength(1)
    expect([first, second].find((result) => !result.ok)).toMatchObject({
      code: "duplicate_audit",
      articleUnchanged: true,
    })
    expect(createdAudits).toHaveLength(1)
    expect(articleUpdates).toHaveLength(1)
  })

  it("rolls back the audit and association when a later write fails", async () => {
    const article = baseArticle()
    const {
      store,
      createdAudits,
      articleUpdates,
      reviewNotes,
      tx,
      persistReviewNote,
    } = createStore(article)
    tx.articleReviewNote.create
      .mockImplementationOnce(persistReviewNote)
      .mockRejectedValueOnce(new Error("review note write failed"))

    const result = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence: async () =>
        usefulEvidence("https://www.nist.gov/artificial-intelligence"),
    })

    expect(result).toMatchObject({ ok: false, code: "audit_failure" })
    expect(createdAudits).toHaveLength(0)
    expect(articleUpdates).toHaveLength(0)
    expect(reviewNotes).toHaveLength(0)
    expect(article.researchAudits).toHaveLength(0)
    expect(article.reviewNotes).toHaveLength(0)
  })

  it("returns insufficient_article_evidence and writes nothing when the article has no auditable claims", async () => {
    const article = baseArticle({
      title: "Notes",
      excerpt: "Short notes.",
      content: "See [NIST AI](https://www.nist.gov/artificial-intelligence).",
    })
    const { store, createdAudits, articleUpdates } = createStore(article)
    const collectEvidence = vi.fn()

    const result = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence,
    })

    expect(result).toMatchObject({
      ok: false,
      code: "insufficient_article_evidence",
      articleUnchanged: true,
    })
    expect(collectEvidence).not.toHaveBeenCalled()
    expect(store.$transaction).not.toHaveBeenCalled()
    expect(createdAudits).toHaveLength(0)
    expect(articleUpdates).toHaveLength(0)
  })

  it("allows one replacement audit after an audit-engine revision change", async () => {
    const article = baseArticle()
    article.researchAudits = [
      { id: "audit-obsolete", articleId: article.id, createdAt: auditCreatedAt },
    ]
    article.reviewNotes = [
      {
        action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
        note: serializeArticleAuditAssociation({
          auditId: "audit-obsolete",
          contentFingerprint: fingerprintFor(article),
          createdAt: auditCreatedAt,
          engineRevision: "legacy-chrome-v0",
        }),
      },
    ]
    const { store, createdAudits, articleUpdates } = createStore(article)

    const result = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence: async () =>
        usefulEvidence("https://www.nist.gov/artificial-intelligence"),
    })

    expect(result.ok).toBe(true)
    expect(article.researchAudits.map((audit) => audit.id)).toEqual([
      "audit-obsolete",
      "audit-2",
    ])
    expect(createdAudits).toHaveLength(1)
    expect(articleUpdates).toHaveLength(1)
    expect(
      parseArticleAuditAssociation(
        article.reviewNotes.find(
          (note) => note.action === RESEARCH_AUDIT_FINGERPRINT_ACTION &&
            note.note?.includes("audit-2"),
        ) ?? article.reviewNotes[article.reviewNotes.length - 2],
      )?.engineRevision,
    ).toBe(CURRENT_RESEARCH_AUDIT_ENGINE_REVISION)
  })

  it("allows one article-grounded-v3 replacement after an article-grounded-v2 audit", async () => {
    const article = baseArticle()
    article.researchAudits = [
      { id: "audit-v2", articleId: article.id, createdAt: auditCreatedAt },
    ]
    article.reviewNotes = [
      {
        action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
        note: serializeArticleAuditAssociation({
          auditId: "audit-v2",
          contentFingerprint: fingerprintFor(article),
          createdAt: auditCreatedAt,
          engineRevision: "article-grounded-v2",
        }),
      },
    ]
    const { store, createdAudits, articleUpdates } = createStore(article)

    const result = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence: async () =>
        usefulEvidence("https://www.nist.gov/artificial-intelligence"),
    })

    expect(result.ok).toBe(true)
    expect(createdAudits).toHaveLength(1)
    expect(articleUpdates).toHaveLength(1)
    expect(article.researchAudits.map((audit) => audit.id)).toEqual([
      "audit-v2",
      "audit-2",
    ])
    if (!result.ok) return
    expect(result.audit.engineRevision).toBe(CURRENT_RESEARCH_AUDIT_ENGINE_REVISION)
    expect(result.sourceDiagnostics).toBeDefined()
  })

  it("allows one article-grounded-v4 replacement after an article-grounded-v3 audit", async () => {
    const article = baseArticle()
    article.researchAudits = [
      { id: "audit-v3", articleId: article.id, createdAt: auditCreatedAt },
    ]
    article.reviewNotes = [
      {
        action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
        note: serializeArticleAuditAssociation({
          auditId: "audit-v3",
          contentFingerprint: fingerprintFor(article),
          createdAt: auditCreatedAt,
          engineRevision: "article-grounded-v3",
        }),
      },
    ]
    const { store, createdAudits, articleUpdates } = createStore(article)

    const result = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence: async () =>
        usefulEvidence("https://www.nist.gov/artificial-intelligence"),
    })

    expect(result.ok).toBe(true)
    expect(createdAudits).toHaveLength(1)
    expect(articleUpdates).toHaveLength(1)
    expect(article.researchAudits.map((audit) => audit.id)).toEqual([
      "audit-v3",
      "audit-2",
    ])
    if (!result.ok) return
    expect(result.audit.engineRevision).toBe(CURRENT_RESEARCH_AUDIT_ENGINE_REVISION)
    expect(result.sourceDiagnostics).toBeDefined()
  })

  it("allows one article-grounded-v6 replacement after an article-grounded-v5 audit", async () => {
    const article = baseArticle()
    article.researchAudits = [
      { id: "audit-v5", articleId: article.id, createdAt: auditCreatedAt },
    ]
    article.reviewNotes = [
      {
        action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
        note: serializeArticleAuditAssociation({
          auditId: "audit-v5",
          contentFingerprint: fingerprintFor(article),
          createdAt: auditCreatedAt,
          engineRevision: "article-grounded-v5",
        }),
      },
    ]
    const { store, createdAudits, articleUpdates } = createStore(article)

    const result = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence: async () =>
        usefulEvidence("https://www.nist.gov/artificial-intelligence"),
    })

    expect(result.ok).toBe(true)
    expect(createdAudits).toHaveLength(1)
    expect(articleUpdates).toHaveLength(1)
    expect(article.researchAudits.map((audit) => audit.id)).toEqual([
      "audit-v5",
      "audit-2",
    ])
    if (!result.ok) return
    expect(result.audit.engineRevision).toBe("article-grounded-v6")
    expect(result.sourceDiagnostics).toBeDefined()
  })

  it("rejects Prepare for Review on a published article without a write", async () => {
    const article = baseArticle({ status: "published" })
    const { store, articleUpdates, createdAudits } = createStore(article)
    const result = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence: async () =>
        usefulEvidence("https://www.nist.gov/artificial-intelligence"),
    })
    expect(result).toMatchObject({
      ok: false,
      code: "invalid_status",
      articleUnchanged: true,
    })
    expect(articleUpdates).toHaveLength(0)
    expect(createdAudits).toHaveLength(0)
  })

  it("allows Prepare for Review after a published article returns to review-required", async () => {
    const article = baseArticle({ status: "review-required" })
    const { store, createdAudits } = createStore(article)
    const result = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence: async () =>
        usefulEvidence("https://www.nist.gov/artificial-intelligence"),
    })
    expect(result.ok).toBe(true)
    expect(createdAudits).toHaveLength(1)
  })
})
