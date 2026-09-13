import { describe, expect, it, vi } from "vitest"
import { generateAndPersistFeaturedImage } from "../../lib/ai/persist-featured-image"
import { MINIMAL_PNG } from "./article-images.test"

const article = {
  id: "article-1",
  slug: "ai-automation-for-creators",
  title: "Save time",
  category: "ai-tools",
  content: "A short article about automation.",
  excerpt: "Excerpt",
  seoTitle: "SEO title",
  seoDescription: "SEO description",
  featuredImage: null,
}

describe("generateAndPersistFeaturedImage", () => {
  it("writes the durable URL only after a successful upload", async () => {
    const update = vi.fn(async ({ data }) => ({ ...article, ...data }))

    const result = await generateAndPersistFeaturedImage({
      articleId: article.id,
      prisma: {
        article: {
          findUnique: async () => article,
          update,
        },
      },
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
  })

  it("leaves the article unchanged when upload fails", async () => {
    const update = vi.fn()

    const result = await generateAndPersistFeaturedImage({
      articleId: article.id,
      prisma: {
        article: {
          findUnique: async () => article,
          update,
        },
      },
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
    const update = vi.fn()

    const result = await generateAndPersistFeaturedImage({
      articleId: article.id,
      prisma: {
        article: {
          findUnique: async () => article,
          update,
        },
      },
      generateImage: async () => undefined,
    })

    expect(result).toMatchObject({
      ok: false,
      articleUnchanged: true,
    })
    expect(update).not.toHaveBeenCalled()
  })
})
