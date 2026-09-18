import { generateAndPersistFeaturedImage } from "../../lib/ai/persist-featured-image"
import { MINIMAL_PNG } from "./article-images.test"
import { ARTICLE_2_FEATURED_IMAGE_PROMPT } from "./fixtures/article-2-featured-image-prompt"
import { describe, expect, it, vi } from "vitest"
import {
  FEATURED_IMAGE_PROMPT_APPROVED_ACTION,
  computeArticleContentFingerprint,
  serializeFeaturedImagePromptNote,
} from "../../lib/ai/featured-image-prompt"
import {
  RESEARCH_AUDIT_FINGERPRINT_ACTION,
  serializeArticleAuditAssociation,
} from "../../lib/research/article-audit-association"

const sourceUrl = "https://www.nist.gov/itl/ai-risk-management-framework"

function createApprovedArticle() {
  const article = {
    id: "article-1",
    slug: "ai-automation-for-creators",
    title: "Save time",
    category: "ai-tools",
    content: `A short article about automation. See [NIST](${sourceUrl}).`,
    excerpt: "Excerpt",
    seoTitle: "SEO title",
    seoDescription: "SEO description",
    seoKeywords: null,
    featuredImage: null,
    status: "approved",
    approvedAt: new Date("2026-09-18T11:55:51.914Z"),
    approvedBy: "admin@example.com",
    scheduledFor: null,
    publishedAt: null,
    researchSources: [
      {
        title: "NIST",
        url: sourceUrl,
        sourceType: "stored-research-source",
        authorityScore: 90,
        trustScore: 90,
      },
    ],
    researchAudits: [
      {
        id: "audit-1",
        articleId: "article-1",
        createdAt: new Date("2026-09-18T11:50:00.000Z"),
      },
    ],
    reviewNotes: [] as Array<{
      id?: string
      action: string
      note: string | null
    }>,
  }
  const fingerprint = computeArticleContentFingerprint(article)
  article.reviewNotes.push(
    {
      id: "assoc-1",
      action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
      note: serializeArticleAuditAssociation({
        auditId: "audit-1",
        contentFingerprint: fingerprint,
        createdAt: new Date("2026-09-18T11:50:00.000Z"),
      }),
    },
    {
      id: "prompt-1",
      action: FEATURED_IMAGE_PROMPT_APPROVED_ACTION,
      note: serializeFeaturedImagePromptNote({
        version: 1,
        articleId: article.id,
        contentFingerprint: fingerprint,
        prompt: ARTICLE_2_FEATURED_IMAGE_PROMPT,
        approvedAt: "2026-09-18T12:00:00.000Z",
        approvedBy: "admin@example.com",
      }),
    },
  )
  return article
}

function createStore(
  article: ReturnType<typeof createApprovedArticle>,
  update: ReturnType<typeof vi.fn>,
) {
  const tx = {
    $queryRaw: vi.fn(async () => [{ id: article.id }]),
    article: {
      findUnique: vi.fn(async () => article),
      update: async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(article, data)
        return update({
          where: { id: article.id },
          data,
        })
      },
    },
    articleReviewNote: { create: vi.fn() },
    publishingQueue: { update: vi.fn() },
  }
  return {
    $transaction: async (fn: (client: typeof tx) => unknown) => fn(tx),
    article: {
      findUnique: async () => article,
      update,
    },
  }
}

describe("generateAndPersistFeaturedImage", () => {
  it("writes the durable URL only after a successful upload", async () => {
    const article = createApprovedArticle()
    const update = vi.fn(async ({ data }) => ({ ...article, ...data }))

    const result = await generateAndPersistFeaturedImage({
      articleId: article.id,
      prisma: createStore(article, update),
      generateImage: async () => MINIMAL_PNG.toString("base64"),
      persistImage: async () => ({
        ok: true,
        imageUrl:
          "https://kqptdgbttfuqkzxzbazw.supabase.co/storage/v1/object/public/article-images/ai-automation-for-creators/img.png",
        objectPath: "ai-automation-for-creators/img.png",
      }),
    })

    expect(result.ok).toBe(true)
    if (!result.ok || !("imageUrl" in result)) {
      throw new Error("expected a persisted image")
    }
    expect(result.imageUrl).toContain("/storage/v1/object/public/article-images/")
    expect(update).toHaveBeenCalledWith({
      where: { id: "article-1" },
      data: expect.objectContaining({
        featuredImage: result.imageUrl,
      }),
    })
    expect(update.mock.calls[0][0].data).not.toHaveProperty("status")
    expect(update.mock.calls[0][0].data).not.toHaveProperty("content")
    expect(update.mock.calls[0][0].data).not.toHaveProperty("approvedAt")
    expect(update.mock.calls[0][0].data).not.toHaveProperty("approvedBy")
    expect(update.mock.calls[0][0].data).not.toHaveProperty("scheduledFor")
    expect(update.mock.calls[0][0].data).not.toHaveProperty("publishedAt")
  })

  it("leaves the article unchanged when upload fails", async () => {
    const article = createApprovedArticle()
    const update = vi.fn()

    const result = await generateAndPersistFeaturedImage({
      articleId: article.id,
      prisma: createStore(article, update),
      generateImage: async () => MINIMAL_PNG.toString("base64"),
      persistImage: async () => ({
        ok: false,
        error: "Image upload failed",
      }),
    })

    expect(result).toMatchObject({
      ok: false,
      error: "Image upload failed",
      articleUnchanged: true,
    })
    expect(update).not.toHaveBeenCalled()
  })

  it("leaves the article unchanged when generation returns no image", async () => {
    const article = createApprovedArticle()
    const update = vi.fn()

    const result = await generateAndPersistFeaturedImage({
      articleId: article.id,
      prisma: createStore(article, update),
      generateImage: async () => undefined,
    })

    expect(result).toMatchObject({
      ok: false,
      articleUnchanged: true,
    })
    expect(update).not.toHaveBeenCalled()
  })

  it("does not write featuredImage if the prompt goes stale before the locked update", async () => {
    const article = createApprovedArticle()
    const update = vi.fn()

    const result = await generateAndPersistFeaturedImage({
      articleId: article.id,
      prisma: createStore(article, update),
      generateImage: async () => MINIMAL_PNG.toString("base64"),
      persistImage: async () => {
        article.reviewNotes = article.reviewNotes.filter(
          (note) => note.action !== FEATURED_IMAGE_PROMPT_APPROVED_ACTION,
        )
        return {
          ok: true,
          imageUrl:
            "https://kqptdgbttfuqkzxzbazw.supabase.co/storage/v1/object/public/article-images/ai-automation-for-creators/img.png",
          objectPath: "ai-automation-for-creators/img.png",
        }
      },
    })

    expect(result).toMatchObject({
      ok: false,
      code: "stale_approved_featured_image_prompt",
      articleUnchanged: true,
    })
    expect(update).not.toHaveBeenCalled()
    expect(article.featuredImage).toBeNull()
  })
})
