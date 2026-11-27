import { calculateEditorialQualityScore } from "../editorial/quality-score"
import { updateArticleUnderGovernanceLock } from "../publishing/article-lifecycle"
import {
  persistFeaturedImageBytes,
  type AllowedFeaturedImageMime,
} from "../storage/article-images"
import {
  requireCurrentFeaturedImagePrompt,
  type FeaturedImagePromptArticle,
} from "./featured-image-prompt"

type FeaturedImageArticle = FeaturedImagePromptArticle & {
  slug: string
  featuredImage: string | null
  approvedAt?: Date | string | null
  approvedBy?: string | null
  scheduledFor?: Date | string | null
  publishedAt?: Date | string | null
  excerpt: string | null
  content: string | null
  seoTitle: string | null
  seoDescription: string | null
}

type FeaturedImageStore = {
  $transaction?: (fn: (tx: unknown) => Promise<unknown>) => Promise<unknown>
  article: {
    findUnique: (args: {
      where: { id: string }
      include?: {
        researchSources: true
        researchAudits: true
        reviewNotes: true
      }
    }) => Promise<FeaturedImageArticle | null>
    update?: (args: {
      where: { id: string }
      data: Record<string, unknown>
    }) => Promise<FeaturedImageArticle>
  }
}

function wordCount(value: string | null) {
  if (!value) return 0
  return value.split(/\s+/).filter(Boolean).length
}

export async function generateAndPersistFeaturedImage(input: {
  articleId: string
  prisma?: FeaturedImageStore
  generateImage?: (prompt: string) => Promise<string | undefined>
  persistImage?: typeof persistFeaturedImageBytes
}) {
  const store =
    input.prisma ??
    ((await import("@/lib/prisma")).prisma as unknown as FeaturedImageStore)
  const persistImage = input.persistImage ?? persistFeaturedImageBytes

  const article = await store.article.findUnique({
    where: { id: input.articleId },
    include: {
      researchSources: true,
      researchAudits: true,
      reviewNotes: true,
    },
  })

  if (!article) {
    return {
      ok: false as const,
      error: "Article not found",
      code: "not_found",
      articleUnchanged: true as const,
    }
  }

  const required = requireCurrentFeaturedImagePrompt(article)
  if (!required.ok) {
    return {
      ok: false as const,
      error: required.error,
      code: required.code,
      articleUnchanged: true as const,
    }
  }

  const prompt = required.prompt
  const generateImage =
    input.generateImage ??
    (async (imagePrompt: string) => {
      const { getOpenAI } = await import("@/lib/ai/openai")
      const image = await getOpenAI().images.generate({
        model: "gpt-image-2",
        prompt: imagePrompt,
        size: "1024x1024",
      })
      return image.data?.[0]?.b64_json
    })

  let base64: string | undefined

  try {
    base64 = await generateImage(prompt)
  } catch {
    return {
      ok: false as const,
      error: "Featured image generation failed.",
      code: "featured_image_generation_failed",
      articleUnchanged: true as const,
    }
  }

  if (!base64) {
    return {
      ok: false as const,
      error: "No image returned from OpenAI",
      code: "featured_image_generation_failed",
      articleUnchanged: true as const,
    }
  }

  const bytes = Buffer.from(base64, "base64")
  const persisted = await persistImage({
    articleId: article.id,
    slug: article.slug,
    bytes,
    mimeType: "image/png" satisfies AllowedFeaturedImageMime,
  })

  if (!persisted.ok) {
    return {
      ok: false as const,
      error: persisted.error,
      code:
        persisted.error === "Image upload failed"
          ? "featured_image_upload_failed"
          : "featured_image_invalid_payload",
      articleUnchanged: true as const,
    }
  }

  const editorialQuality = calculateEditorialQualityScore({
    wordCount: wordCount(article.content),
    hasTitle: Boolean(article.title),
    hasExcerpt: Boolean(article.excerpt),
    hasSeoTitle: Boolean(article.seoTitle),
    hasSeoDescription: Boolean(article.seoDescription),
    hasFeaturedImage: true,
    consensusScore: 80,
    verifiedCount: 1,
    partiallyVerifiedCount: 1,
    unverifiedCount: 0,
    publicationRecommendation: "review-required",
  })

  const lockedUpdate = await updateArticleUnderGovernanceLock(
    {
      articleId: article.id,
      changes: {
        featuredImage: persisted.imageUrl,
        editorialScore: editorialQuality.score,
        editorialGrade: editorialQuality.grade,
        editorialWarnings: editorialQuality.warnings,
      },
      assert: (locked) => {
        const stillCurrent = requireCurrentFeaturedImagePrompt(locked)
        if (
          !stillCurrent.ok ||
          stillCurrent.prompt !== prompt ||
          stillCurrent.contentFingerprint !== required.contentFingerprint
        ) {
          return {
            ok: false,
            code: "stale_audit",
            error:
              "The approved featured-image prompt is no longer current. Article was left unchanged.",
            articleUnchanged: true,
          }
        }
        return null
      },
    },
    { prisma: store },
  )

  if (!lockedUpdate.ok) {
    return {
      ok: false as const,
      error: lockedUpdate.error,
      code:
        lockedUpdate.code === "stale_audit"
          ? "stale_approved_featured_image_prompt"
          : lockedUpdate.code,
      articleUnchanged: true as const,
    }
  }

  return {
    ok: true as const,
    article: lockedUpdate.article as unknown as FeaturedImageArticle,
    imageUrl: persisted.imageUrl,
    prompt,
    editorialQuality,
    articleUnchanged: false as const,
  }
}
