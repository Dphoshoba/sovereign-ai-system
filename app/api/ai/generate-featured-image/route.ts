import { NextResponse } from "next/server"
import { mkdir, writeFile } from "fs/promises"
import path from "path"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { calculateEditorialQualityScore } from "../../../../lib/editorial/quality-score"

function safeFileName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function wordCount(value: string | null) {
  if (!value) return 0
  return value.split(/\s+/).filter(Boolean).length
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const articleId = body.articleId as string

    if (!articleId) {
      return NextResponse.json(
        { ok: false, error: "Missing articleId" },
        { status: 400 }
      )
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
    })

    if (!article) {
      return NextResponse.json(
        { ok: false, error: "Article not found" },
        { status: 404 }
      )
    }

    const prompt =
      article.featuredImage && !article.featuredImage.startsWith("/")
        ? article.featuredImage
        : `Create a cinematic blog cover image for this article: ${article.title}. Modern AI automation, warm professional lighting, human-centered technology, elegant premium SaaS feel, abstract creator workspace, no text, no logos, no watermarks.`

    const image = await getOpenAI().images.generate({
      model: "gpt-image-2",
      prompt,
      size: "1024x1024",
    })

    const base64 = image.data?.[0]?.b64_json

    if (!base64) {
      return NextResponse.json(
        { ok: false, error: "No image returned from OpenAI" },
        { status: 500 }
      )
    }

    const generatedDir = path.join(process.cwd(), "public", "generated")
    await mkdir(generatedDir, { recursive: true })

    const fileName = `${safeFileName(article.slug)}-${Date.now()}.png`
    const filePath = path.join(generatedDir, fileName)

    await writeFile(filePath, Buffer.from(base64, "base64"))

    const imageUrl = `/generated/${fileName}`

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

    const updatedArticle = await prisma.article.update({
      where: { id: article.id },
      data: {
        featuredImage: imageUrl,
        editorialScore: editorialQuality.score,
        editorialGrade: editorialQuality.grade,
        editorialWarnings: editorialQuality.warnings,
      },
    })

    return NextResponse.json({
      ok: true,
      article: updatedArticle,
      imageUrl,
      editorialQuality,
    })
  } catch (error) {
    console.error("Featured image generation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate featured image",
      },
      { status: 500 }
    )
  }
}