import { describe, expect, it, vi } from "vitest"
import { transitionArticleLifecycle } from "../../lib/publishing/article-lifecycle"
import { computeArticleAuditFingerprint } from "../../lib/research/article-audit-fingerprint"
import { serializeArticleAuditAssociation } from "../../lib/research/article-audit-association"
import {
  publicationGuard,
  researchPublicationBlockReason,
} from "../../lib/publishing/publication-guard"

describe("publicationGuard research-audit currency", () => {
  it("rejects review-required even when a current audit exists", () => {
    const result = publicationGuard("review-required", { hasCurrentAudit: true })

    expect(result.allowed).toBe(false)
    expect(result.reason).toContain("human review")
  })

  it("rejects an approved article with only stale audits", () => {
    const result = publicationGuard("approved", { hasCurrentAudit: false })

    expect(result.allowed).toBe(false)
    expect(result.reason).toContain("current research audit")
  })

  it("allows an approved article with a current matching audit", () => {
    const result = publicationGuard("approved", { hasCurrentAudit: true })

    expect(result.allowed).toBe(true)
  })

  it("rejects a scheduled article after its audit becomes stale", () => {
    const result = publicationGuard("scheduled", { hasCurrentAudit: false })

    expect(result.allowed).toBe(false)
    expect(result.reason).toContain("current research audit")
  })

  it("rejects an already published article", () => {
    const result = publicationGuard("published", { hasCurrentAudit: true })

    expect(result.allowed).toBe(false)
    expect(result.reason).toContain("already been published")
  })

  it("allows a scheduled article with a current audit for the scheduler", () => {
    const result = publicationGuard("scheduled", { hasCurrentAudit: true })

    expect(result.allowed).toBe(true)
  })
})

describe("research publication eligibility", () => {
  it("accepts the stored policy thresholds together", () => {
    expect(
      researchPublicationBlockReason({
        consensusScore: 80,
        sourceQualityScore: 70,
        publicationRecommendation: "publish-ready",
      }),
    ).toBeNull()
  })

  it("rejects a review-required recommendation below the policy", () => {
    expect(
      researchPublicationBlockReason({
        consensusScore: 53,
        sourceQualityScore: 63,
        publicationRecommendation: "review-required",
      }),
    ).toContain("not publish-ready")
  })

  it("rejects a missing recommendation and invalid scores", () => {
    expect(
      researchPublicationBlockReason({
        consensusScore: 80,
        sourceQualityScore: 70,
        publicationRecommendation: null,
      }),
    ).toContain("not publish-ready")
    expect(
      researchPublicationBlockReason({
        consensusScore: null,
        sourceQualityScore: "70",
        publicationRecommendation: "publish-ready",
      }),
    ).toContain("not publish-ready")
  })

  it("rejects publish-ready when either score is below the policy", () => {
    expect(
      researchPublicationBlockReason({
        consensusScore: 79,
        sourceQualityScore: 70,
        publicationRecommendation: "publish-ready",
      }),
    ).toContain("not publish-ready")
    expect(
      researchPublicationBlockReason({
        consensusScore: 80,
        sourceQualityScore: 69,
        publicationRecommendation: "publish-ready",
      }),
    ).toContain("not publish-ready")
  })

  it("blocks the lifecycle transition for a non-publishable approved article", async () => {
    const createdAt = new Date("2026-09-15T00:00:00.000Z")
    const article = {
      id: "guard-article",
      title: "Governed AI workflows",
      excerpt: "Evidence-backed operations.",
      content: "See [NIST](https://www.nist.gov/artificial-intelligence).",
      category: "ai-tools",
      seoTitle: "Governed AI workflows",
      seoDescription: "Build accountable AI workflows.",
      seoKeywords: "AI governance",
      featuredImage: null,
      status: "approved",
      scheduledFor: null,
      publishedAt: null,
      approvedAt: new Date("2026-09-15T01:00:00.000Z"),
      approvedBy: "editor",
      researchSources: [],
      researchAudits: [
        {
          id: "guard-audit",
          articleId: "guard-article",
          createdAt,
          consensusScore: 53,
          sourceQualityScore: 63,
          publicationRecommendation: "review-required",
        },
      ],
      reviewNotes: [] as Array<{ action: string; note: string | null }>,
    }
    article.reviewNotes = [
      {
        action: "research-audit-fingerprint",
        note: serializeArticleAuditAssociation({
          auditId: "guard-audit",
          contentFingerprint: computeArticleAuditFingerprint(article, [
            "https://www.nist.gov/artificial-intelligence",
          ]),
          createdAt,
        }),
      },
    ]
    const update = vi.fn()
    const note = vi.fn()
    const queue = vi.fn()
    const store = {
      $transaction: async (callback: (tx: unknown) => unknown) =>
        callback({
          $queryRaw: async () => [{ id: article.id }],
          article: {
            findUnique: async () => article,
            update,
          },
          articleReviewNote: { create: note },
          publishingQueue: { update: queue },
        }),
    }

    const published = await transitionArticleLifecycle(
      { articleId: article.id, transition: "publish" },
      { prisma: store },
    )
    const scheduled = await transitionArticleLifecycle(
      {
        articleId: article.id,
        transition: "schedule",
        scheduledFor: new Date("2026-09-20T00:00:00.000Z"),
      },
      { prisma: store },
    )

    expect(published).toMatchObject({
      ok: false,
      code: "research_not_publishable",
      articleUnchanged: true,
    })
    expect(scheduled).toMatchObject({
      ok: false,
      code: "research_not_publishable",
      articleUnchanged: true,
    })
    expect(update).not.toHaveBeenCalled()
    expect(note).not.toHaveBeenCalled()
    expect(queue).not.toHaveBeenCalled()
    expect(article.status).toBe("approved")
  })
})
