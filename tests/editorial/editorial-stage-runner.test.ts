import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import {
  AUTHENTICATION_REQUIRED_BODY,
  EDITOR_FORBIDDEN_BODY,
} from "../../lib/publishing/require-editor-auth"
import {
  EDITORIAL_STAGE_HOLD_ACTION,
  EDITORIAL_STAGE_RUNNER_FORBIDDEN_TRANSITIONS,
  runEditorialStages,
  type EditorialStageRunnerStore,
} from "../../lib/publishing/editorial-stage-runner"
import { LEGACY_AUTO_SCHEDULE_DISABLED_BODY } from "../../lib/publishing/legacy-auto-schedule"
import {
  PUBLISH_READY_CONSENSUS_SCORE,
  PUBLISH_READY_RECOMMENDATION,
  PUBLISH_READY_SOURCE_QUALITY_SCORE,
} from "../../lib/research/consensus-engine"

const mockGetUser = vi.fn()
const transitionArticleLifecycle = vi.fn()
const publishDueArticles = vi.fn()
const autoGenerateSocialPosts = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}))

vi.mock("../../lib/publishing/article-lifecycle", async () => {
  const actual = await vi.importActual<
    typeof import("../../lib/publishing/article-lifecycle")
  >("../../lib/publishing/article-lifecycle")
  return {
    ...actual,
    transitionArticleLifecycle: (...args: unknown[]) =>
      transitionArticleLifecycle(...args),
  }
})

vi.mock("../../lib/publishing/publish-due-articles", () => ({
  publishDueArticles: (...args: unknown[]) => publishDueArticles(...args),
}))

vi.mock("../../lib/social/auto-generate-social", () => ({
  autoGenerateSocialPosts: (...args: unknown[]) =>
    autoGenerateSocialPosts(...args),
}))

function editorUser() {
  mockGetUser.mockResolvedValue({
    data: {
      user: {
        id: "editor-1",
        email: "editor@example.com",
        app_metadata: { role: "editor" },
      },
    },
    error: null,
  })
}

function baseArticle(overrides: Record<string, unknown> = {}) {
  return {
    id: "article-1",
    title: "Fact-Check Your AI Draft Before You Publish",
    slug: "fact-check-your-ai-draft",
    category: "ai-tools",
    status: "draft",
    excerpt: "A careful draft.",
    content:
      "Substantial article body with enough characters to pass the draft content gate for research preparation.",
    approvedAt: null,
    approvedBy: null,
    publishedAt: null,
    scheduledFor: null,
    researchSources: [
      {
        title: "NIST",
        url: "https://www.nist.gov/example",
        sourceType: "primary",
        authorityScore: 90,
        trustScore: 90,
      },
    ],
    researchAudits: [],
    reviewNotes: [],
    ...overrides,
  }
}

function createStore(article = baseArticle()) {
  const notes: Array<Record<string, unknown>> = []
  const created: Array<Record<string, unknown>> = []
  let current = { ...article, reviewNotes: [...(article.reviewNotes as [])] }

  const store: EditorialStageRunnerStore = {
    article: {
      async findUnique() {
        return current as never
      },
      async update({ data }) {
        current = { ...current, ...data }
        return current as never
      },
      async create({ data }) {
        const row = {
          id: "created-1",
          status: "draft",
          title: String(data.title),
          ...data,
          researchSources: [],
          researchAudits: [],
          reviewNotes: [],
        }
        created.push(row)
        current = row as never
        return { id: "created-1", status: "draft", title: String(data.title) }
      },
    },
    articleResearchAudit: {
      async create({ data }) {
        return { id: "audit-1", ...data }
      },
    },
    articleReviewNote: {
      async create({ data }) {
        notes.push(data)
        current = {
          ...current,
          reviewNotes: [...current.reviewNotes, data],
        }
        return { id: `note-${notes.length}`, ...data }
      },
    },
    async $queryRaw() {
      return []
    },
    async $transaction(fn) {
      return fn(store)
    },
  }

  return { store, notes, created, getArticle: () => current }
}

describe("EV-EDITORIAL-07-P0 editorial stage runner", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
  })

  it("keeps publication thresholds unchanged", () => {
    expect(PUBLISH_READY_CONSENSUS_SCORE).toBe(80)
    expect(PUBLISH_READY_SOURCE_QUALITY_SCORE).toBe(70)
    expect(PUBLISH_READY_RECOMMENDATION).toBe("publish-ready")
    expect(EDITORIAL_STAGE_RUNNER_FORBIDDEN_TRANSITIONS).toEqual([
      "approve",
      "schedule",
      "publish",
    ])
  })

  it("runs draft→research/audit→review-required without approval side effects", async () => {
    const { store, notes, getArticle } = createStore()
    const prepare = vi.fn(async () => {
      // Simulate prepare mutating status + audit row.
      await store.article.update({
        where: { id: "article-1" },
        data: {
          status: "review-required",
          researchAudits: [
            {
              id: "audit-1",
              articleId: "article-1",
              createdAt: "2026-11-22T08:00:00.000Z",
              consensusScore: 84,
              sourceQualityScore: 90,
              publicationRecommendation: "publish-ready",
            },
          ],
        },
      })
      return {
        ok: true as const,
        articleUnchanged: false as const,
        article: {
          id: "article-1",
          status: "review-required",
          editorialScore: 80,
          editorialGrade: "B",
          qualityScore: 80,
          qualityGrade: "B",
          seoScore: 80,
          seoGrade: "B",
        },
        audit: {
          id: "audit-1",
          createdAt: "2026-11-22T08:00:00.000Z",
          contentFingerprint: "a".repeat(64),
          engineRevision: "article-grounded-v14",
          sourceCount: 1,
          evidenceCount: 1,
          factCount: 1,
          verifiedCount: 1,
          partiallyVerifiedCount: 0,
          unverifiedCount: 0,
          consensusScore: 84,
          publicationRecommendation: "publish-ready",
          sourceCoverage: 1,
          listedSourceAvailability: 1,
          acceptedEvidenceCoverage: 1,
          unavailableSourceCount: 0,
          notScoredClaims: [],
        },
        sourceDiagnostics: [],
        preservedFields: [] as never,
      }
    })

    const result = await runEditorialStages(
      {
        actor: "editor@example.com",
        articleId: "article-1",
        prepare,
      },
      { prisma: store },
    )

    expect(prepare).toHaveBeenCalledTimes(1)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.outcome).toBe("ready_for_human_review")
    expect(result.status).toBe("review-required")
    expect(getArticle().status).toBe("review-required")
    expect(result.sideEffects).toEqual({
      approved: false,
      scheduled: false,
      published: false,
      socialDistributed: false,
      featuredImageGenerated: false,
    })
    expect(transitionArticleLifecycle).not.toHaveBeenCalled()
    expect(publishDueArticles).not.toHaveBeenCalled()
    expect(autoGenerateSocialPosts).not.toHaveBeenCalled()
    expect(
      notes.some((n) => n.action === "approved" || n.action === "scheduled"),
    ).toBe(false)
  })

  it("records HOLD for unsupported / missing evidence without inventing scores", async () => {
    const { store, notes } = createStore()
    const prepare = vi.fn(async () => ({
      ok: false as const,
      code: "missing_evidence" as const,
      error: "This article has no source links or stored research sources to audit.",
      articleUnchanged: true as const,
      sourceDiagnostics: [],
    }))

    const result = await runEditorialStages(
      {
        actor: "editor@example.com",
        articleId: "article-1",
        prepare,
      },
      { prisma: store },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.outcome).toBe("hold")
    expect(result.holdReason).toMatch(/HOLD:/)
    expect(notes.some((n) => n.action === EDITORIAL_STAGE_HOLD_ACTION)).toBe(
      true,
    )
    expect(transitionArticleLifecycle).not.toHaveBeenCalled()
  })

  it("retries transient prepare failures then succeeds", async () => {
    const { store } = createStore()
    const prepare = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        code: "audit_failure",
        error: "fetch failed while collecting evidence",
        articleUnchanged: true,
      })
      .mockImplementationOnce(async () => {
        await store.article.update({
          where: { id: "article-1" },
          data: {
            status: "review-required",
            researchAudits: [
              {
                id: "audit-2",
                articleId: "article-1",
                createdAt: "2026-11-22T08:00:00.000Z",
                consensusScore: 84,
                sourceQualityScore: 90,
                publicationRecommendation: "publish-ready",
              },
            ],
          },
        })
        return {
          ok: true,
          articleUnchanged: false,
          article: {
            id: "article-1",
            status: "review-required",
            editorialScore: 80,
            editorialGrade: "B",
            qualityScore: 80,
            qualityGrade: "B",
            seoScore: 80,
            seoGrade: "B",
          },
          audit: {
            id: "audit-2",
            createdAt: "2026-11-22T08:00:00.000Z",
            contentFingerprint: "b".repeat(64),
            engineRevision: "article-grounded-v14",
            sourceCount: 1,
            evidenceCount: 1,
            factCount: 1,
            verifiedCount: 1,
            partiallyVerifiedCount: 0,
            unverifiedCount: 0,
            consensusScore: 84,
            publicationRecommendation: "publish-ready",
            sourceCoverage: 1,
            listedSourceAvailability: 1,
            acceptedEvidenceCoverage: 1,
            unavailableSourceCount: 0,
            notScoredClaims: [],
          },
          sourceDiagnostics: [],
          preservedFields: [],
        }
      })

    const result = await runEditorialStages(
      {
        actor: "editor@example.com",
        articleId: "article-1",
        prepare,
        maxPrepareAttempts: 3,
        sleep: async () => undefined,
      },
      { prisma: store },
    )

    expect(prepare).toHaveBeenCalledTimes(2)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.outcome).toBe("ready_for_human_review")
    expect(
      result.stages.find((s) => s.id === "research_audit")?.attempts,
    ).toBe(2)
  })

  it("is idempotent when prepare reports duplicate_audit at review-required", async () => {
    const { store } = createStore(
      baseArticle({
        status: "review-required",
        researchAudits: [
          {
            id: "audit-existing",
            articleId: "article-1",
            createdAt: "2026-11-22T08:00:00.000Z",
            consensusScore: 84,
            sourceQualityScore: 90,
            publicationRecommendation: "publish-ready",
          },
        ],
      }),
    )
    const prepare = vi.fn(async () => ({
      ok: false as const,
      code: "duplicate_audit" as const,
      error: "A research audit already exists for this content revision.",
      articleUnchanged: true as const,
    }))

    const result = await runEditorialStages(
      {
        actor: "editor@example.com",
        articleId: "article-1",
        prepare,
      },
      { prisma: store },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.outcome).toBe("already_applied")
    expect(result.articleUnchanged).toBe(true)
    expect(prepare).toHaveBeenCalledTimes(1)
  })

  it("leaves scheduled articles unchanged", async () => {
    const { store } = createStore(
      baseArticle({ status: "scheduled", scheduledFor: "2026-11-22T22:30:00.000Z" }),
    )
    const prepare = vi.fn()
    const result = await runEditorialStages(
      { actor: "editor@example.com", articleId: "article-1", prepare },
      { prisma: store },
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe("immutable_lifecycle")
    expect(prepare).not.toHaveBeenCalled()
  })

  it("rejects unauthenticated stage-runner requests", async () => {
    const { POST } = await import(
      "../../app/api/articles/editorial-stage-runner/route"
    )
    const response = await POST(
      new NextRequest("http://localhost/api/articles/editorial-stage-runner", {
        method: "POST",
        body: JSON.stringify({ articleId: "article-1" }),
      }),
    )
    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY)
  })

  it("rejects non-editor stage-runner requests", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "u1",
          email: "reader@example.com",
          app_metadata: { role: "reader" },
        },
      },
      error: null,
    })
    const { POST } = await import(
      "../../app/api/articles/editorial-stage-runner/route"
    )
    const response = await POST(
      new NextRequest("http://localhost/api/articles/editorial-stage-runner", {
        method: "POST",
        body: JSON.stringify({ articleId: "article-1" }),
      }),
    )
    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual(EDITOR_FORBIDDEN_BODY)
  })

  it("rejects legacy auto-schedule for editors without scheduling", async () => {
    editorUser()
    const { POST } = await import("../../app/api/pipeline/auto-schedule/route")
    const response = await POST(
      new NextRequest("http://localhost/api/pipeline/auto-schedule", {
        method: "POST",
        body: JSON.stringify({ articleId: "article-1" }),
      }),
    )
    expect(response.status).toBe(410)
    await expect(response.json()).resolves.toEqual(
      LEGACY_AUTO_SCHEDULE_DISABLED_BODY,
    )
    expect(transitionArticleLifecycle).not.toHaveBeenCalled()
  })

  it("rejects anonymous legacy auto-schedule before work", async () => {
    const { POST } = await import("../../app/api/pipeline/auto-schedule/route")
    const response = await POST(
      new NextRequest("http://localhost/api/pipeline/auto-schedule", {
        method: "POST",
        body: JSON.stringify({ articleId: "article-1" }),
      }),
    )
    expect(response.status).toBe(401)
    expect(transitionArticleLifecycle).not.toHaveBeenCalled()
  })
})
