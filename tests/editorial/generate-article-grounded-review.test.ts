import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it, vi } from "vitest"
import { extractArticleSourceLinks } from "../../lib/research/article-source-links"
import { computeArticleAuditFingerprint } from "../../lib/research/article-audit-fingerprint"
import {
  RESEARCH_AUDIT_FINGERPRINT_ACTION,
  parseArticleAuditAssociation,
  serializeArticleAuditAssociation,
} from "../../lib/research/article-audit-association"
import { resolveArticleAuditState } from "../../lib/research/current-article-audit"
import { prepareArticleForReview } from "../../lib/research/prepare-article-for-review"
import type {
  PrepareForReviewArticle,
  PrepareForReviewStore,
} from "../../lib/research/prepare-article-for-review"
import type { EvidenceRegistryResult } from "../../lib/research/evidence-registry"
import { CURRENT_RESEARCH_AUDIT_ENGINE_REVISION } from "../../lib/research/research-audit-engine-revision"
import { researchPublicationBlockReason, publicationGuard } from "../../lib/publishing/publication-guard"
import {
  GROUNDED_ARTICLE_CLAIM,
  GROUNDED_EVIDENCE_TEXT,
} from "../fixtures/research-audit/article-2"

const SAVED_TITLE = "Saved article title for grounded review"
const SAVED_EXCERPT = GROUNDED_ARTICLE_CLAIM
const SAVED_CONTENT = `${GROUNDED_ARTICLE_CLAIM} See [NIST AI](https://www.nist.gov/artificial-intelligence) for the research basis.`

function usefulEvidence(url: string): EvidenceRegistryResult {
  return {
    topic: SAVED_TITLE,
    evidenceCount: 1,
    registryStatus: "Evidence registry created from filtered and ranked evidence chunks.",
    evidence: [
      {
        id: "nist-ai-chunk-1",
        sourceTitle: "NIST AI",
        sourceUrl: url,
        sourceType: "government",
        extractedText: GROUNDED_EVIDENCE_TEXT,
        confidence: 90,
        requiresHumanReview: true,
      },
    ],
  }
}

function savedArticle(
  overrides: Partial<PrepareForReviewArticle> = {},
): PrepareForReviewArticle {
  return {
    id: "saved-article",
    title: SAVED_TITLE,
    slug: "saved-article",
    category: "ai-tools",
    status: "review-required",
    excerpt: SAVED_EXCERPT,
    content: SAVED_CONTENT,
    featuredImage: null,
    seoTitle: SAVED_TITLE,
    seoDescription: "A saved description that stays outside publication clearance.",
    seoKeywords: "grounded review",
    researchSources: [],
    researchAudits: [],
    reviewNotes: [],
    ...overrides,
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

function createStore(article: PrepareForReviewArticle) {
  const createdAudits: unknown[] = []
  const articleUpdates: Array<{ data: Record<string, unknown> }> = []
  const reviewNotes: Array<{ data: { action: string; note: string } }> = []

  const tx = {
    article: {
      findUnique: vi.fn(async () => article),
      update: vi.fn(async (args: { data: Record<string, unknown> }) => {
        articleUpdates.push(args)
        Object.assign(article, args.data)
        return article
      }),
    },
    articleResearchAudit: {
      create: vi.fn(async (args: { data: Record<string, unknown> }) => {
        const audit = {
          id: `audit-${article.researchAudits.length + 1}`,
          articleId: article.id,
          createdAt: new Date("2026-09-16T00:00:00.000Z"),
          ...args.data,
        }
        article.researchAudits.push(audit)
        createdAudits.push(args)
        return audit
      }),
    },
    articleReviewNote: {
      create: vi.fn(async (args: { data: { action: string; note: string } }) => {
        reviewNotes.push(args)
        article.reviewNotes.push({
          action: args.data.action,
          note: args.data.note,
        })
        return { id: `note-${reviewNotes.length}` }
      }),
    },
    $queryRaw: vi.fn(async () => [{ id: article.id }]),
  }

  const store: PrepareForReviewStore = {
    article: {
      findUnique: vi.fn(async () => article),
      update: tx.article.update,
    },
    articleResearchAudit: tx.articleResearchAudit,
    articleReviewNote: tx.articleReviewNote,
    $queryRaw: tx.$queryRaw,
    $transaction: vi.fn(async (fn) => fn(tx)),
  }

  return { store, createdAudits, articleUpdates, reviewNotes }
}

describe("generation article-grounded review association", () => {
  it("associates the article-grounded fingerprint with the saved revision", async () => {
    const article = savedArticle()
    const { store, createdAudits, reviewNotes, articleUpdates } = createStore(article)

    const result = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence: vi.fn(async () =>
        usefulEvidence("https://www.nist.gov/artificial-intelligence"),
      ),
      reviewer: "system",
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.audit.engineRevision).toBe(CURRENT_RESEARCH_AUDIT_ENGINE_REVISION)
    expect(result.audit.contentFingerprint).toBe(fingerprintFor(article))
    expect(result.audit.contentFingerprint).toBe(
      computeArticleAuditFingerprint(article, [
        "https://www.nist.gov/artificial-intelligence",
      ]),
    )
    expect(createdAudits).toHaveLength(1)
    const association = parseArticleAuditAssociation(reviewNotes[0].data)
    expect(association).toMatchObject({
      auditId: result.audit.id,
      contentFingerprint: fingerprintFor({
        ...article,
        title: SAVED_TITLE,
        excerpt: SAVED_EXCERPT,
        content: SAVED_CONTENT,
      }),
      engineRevision: "article-grounded-v14",
    })
    expect(articleUpdates[0]?.data.status).toBe("review-required")
    expect(articleUpdates[0]?.data).not.toHaveProperty("approvedAt")
    expect(articleUpdates[0]?.data).not.toHaveProperty("scheduledFor")
    expect(articleUpdates[0]?.data).not.toHaveProperty("publishedAt")
    expect(resolveArticleAuditState(article).currentAudit?.id).toBe(result.audit.id)
  })

  it("keeps duplicate review protection for the same saved revision", async () => {
    const article = savedArticle()
    const { store, createdAudits } = createStore(article)
    const collectEvidence = vi.fn(async () =>
      usefulEvidence("https://www.nist.gov/artificial-intelligence"),
    )

    const first = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence,
      reviewer: "system",
    })
    const second = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence,
      reviewer: "system",
    })

    expect(first.ok).toBe(true)
    expect(second).toMatchObject({
      ok: false,
      code: "duplicate_audit",
      articleUnchanged: true,
    })
    expect(createdAudits).toHaveLength(1)
    expect(collectEvidence).toHaveBeenCalledTimes(1)
  })

  it("does not let a generic template audit authorise publication", () => {
    const article = savedArticle({
      researchAudits: [
        {
          id: "template-audit",
          articleId: "saved-article",
          createdAt: new Date("2026-09-16T00:00:00.000Z"),
          consensusScore: 100,
          sourceQualityScore: 100,
          publicationRecommendation: "publish-ready",
        },
      ] as PrepareForReviewArticle["researchAudits"],
      reviewNotes: [],
    })

    const unresolved = resolveArticleAuditState(article)
    expect(unresolved.currentAudit).toBeNull()
    expect(researchPublicationBlockReason(unresolved.currentAudit)).toContain(
      "current publish-ready research audit is required",
    )

    const mismatchedFingerprint = computeArticleAuditFingerprint(
      { ...article, title: "A different unsaved template title" },
      ["https://www.ibm.com/artificial-intelligence"],
    )
    article.reviewNotes.push({
      action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
      note: serializeArticleAuditAssociation({
        auditId: "template-audit",
        contentFingerprint: mismatchedFingerprint,
        createdAt: new Date("2026-09-16T00:00:00.000Z"),
      }),
    })

    const mismatched = resolveArticleAuditState(article)
    expect(mismatched.currentAudit).toBeNull()
    expect(researchPublicationBlockReason(mismatched.currentAudit)).not.toBeNull()
    expect(
      publicationGuard("review-required", { hasCurrentAudit: false }).allowed,
    ).toBe(false)
  })

  it("leaves an incomplete review required and without a publication audit", async () => {
    const article = savedArticle({
      title: "A heading only",
      excerpt: "No factual sentence here.",
      content: "A short note without a verifiable claim or a source.",
    })
    const { store, createdAudits, articleUpdates } = createStore(article)
    const collectEvidence = vi.fn()

    const result = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence,
      reviewer: "system",
    })

    expect(result).toMatchObject({
      ok: false,
      code: "missing_evidence",
      articleUnchanged: true,
    })
    expect(collectEvidence).not.toHaveBeenCalled()
    expect(createdAudits).toHaveLength(0)
    expect(articleUpdates).toHaveLength(0)
    expect(article.status).toBe("review-required")
    expect(resolveArticleAuditState(article).currentAudit).toBeNull()
    expect(researchPublicationBlockReason(null)).not.toBeNull()
    expect(publicationGuard(article.status, { hasCurrentAudit: false }).allowed).toBe(
      false,
    )
  })

  it("does not authorise publication or distribution from the generator", () => {
    const source = readFileSync(
      path.join(process.cwd(), "app/api/ai/generate-article/route.ts"),
      "utf8",
    )

    expect(source).toContain("prepareArticleForReview(")
    expect(source).toContain("publicationGate(governedConsensus)")
    expect(source).toContain("recommendationWithEvidenceCompleteness")
    expect(source).not.toContain("articleResearchAudit.create")
    expect(source).not.toContain("RESEARCH_AUDIT_FINGERPRINT_ACTION")
    expect(source).not.toContain("approveArticle")
    expect(source).not.toContain("scheduleArticle")
    expect(source).not.toContain("publishArticle")
    expect(source).not.toContain("sendNewsletter")
    expect(source).not.toContain("resend")
    expect(source).toContain('status: "review-required"')
    expect(source).toContain("publicationCleared = false")
  })
})
