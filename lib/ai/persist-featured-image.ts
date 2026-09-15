import { calculateEditorialQualityScore } from "../editorial/quality-score"
import { updateArticleUnderGovernanceLock } from "../publishing/article-lifecycle"
import {
  persistFeaturedImageBytes,
  type AllowedFeaturedImageMime,
} from "../storage/article-images"

type ArticleRecord = {
  id: string
  slug: string
  title: string
  category: string | null
  content: string | null
  excerpt: string | null
  seoTitle: string | null
  seoDescription: string | null
  featuredImage: string | null
}

type FeaturedImageStore = {
  $transaction?: (fn: (tx: unknown) => Promise<unknown>) => Promise<unknown>
  article: {
    findUnique: (args: {
      where: { id: string }
    }) => Promise<ArticleRecord | null>
    update?: (args: {
      where: { id: string }
      data: Record<string, unknown>
    }) => Promise<ArticleRecord>
  }
}

function wordCount(value: string | null) {
  if (!value) return 0
  return value.split(/\s+/).filter(Boolean).length
}

function buildFallbackPrompt(article: ArticleRecord) {
  const category = article.category?.toLowerCase() || ""

  if (category.includes("bible")) {
    return `Create a cinematic biblical blog cover image for this article: ${article.title}. Ancient Israel atmosphere, warm golden light, dramatic landscape, reverent spiritual tone, realistic but tasteful, no text, no logos, no watermarks.`
  }

  if (category.includes("history")) {
    return `Create a cinematic history blog cover image for this article: ${article.title}. Historical atmosphere, documentary style, warm dramatic lighting, tasteful and realistic, no text, no logos, no watermarks.`
  }

  if (category.includes("health")) {
    return `Create a clean health and wellness blog cover image for this article: ${article.title}. Calm professional medical wellness style, warm natural light, human-centered, no text, no logos, no watermarks.`
  }

  if (category.includes("space")) {
    return `Create a cinematic space blog cover image for this article: ${article.title}. Deep space atmosphere, stars, planets, cosmic lighting, realistic premium editorial style, no text, no logos, no watermarks.`
  }

  if (category.includes("motivation")) {
    return `Create an inspiring motivation blog cover image for this article: ${article.title}. Warm sunrise light, person overcoming challenge, hopeful cinematic tone, no text, no logos, no watermarks.`
  }

  return `Create a cinematic blog cover image for this article: ${article.title}. Modern AI automation, warm professional lighting, human-centered technology, elegant premium SaaS feel, abstract creator workspace, no text, no logos, no watermarks.`
}

export function resolveFeaturedImagePrompt(article: ArticleRecord) {
  return article.featuredImage && !article.featuredImage.startsWith("/")
    ? article.featuredImage
    : buildFallbackPrompt(article)
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
  })

  if (!article) {
    return {
      ok: false as const,
      error: "Article not found",
      code: "not_found",
      articleUnchanged: true as const,
    }
  }

  const prompt = resolveFeaturedImagePrompt(article)
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
      ok: true as const,
      warning:
        "Featured image generation failed. Article remains saved without a generated image.",
      article,
      articleUnchanged: true as const,
    }
  }

  if (!base64) {
    return {
      ok: false as const,
      error: "No image returned from OpenAI",
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
    },
    { prisma: store },
  )

  if (!lockedUpdate.ok) {
    return {
      ok: false as const,
      error: lockedUpdate.error,
      code: lockedUpdate.code,
      articleUnchanged: true as const,
    }
  }

  return {
    ok: true as const,
    article: lockedUpdate.article as unknown as ArticleRecord,
    imageUrl: persisted.imageUrl,
    editorialQuality,
    articleUnchanged: false as const,
  }
}
