import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function createUniqueSlug(baseSlug: string, category: string) {
  let slug = baseSlug
  let counter = 2

  while (true) {
    const existing = await prisma.article.findFirst({
      where: { slug, category },
      select: { id: true },
    })

    if (!existing) return slug

    slug = `${baseSlug}-${counter}`
    counter++
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const topic = body.topic || "AI automation for creators"
    const category = body.category || "ai-automation"
    const mode = body.mode || "draft"
    const scheduledFor = body.scheduledFor ? new Date(body.scheduledFor) : null

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Autonomous Publishing Pipeline for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Return only valid JSON. No markdown wrapper. No explanations.",
      input:
        "Create a complete publishing package for this topic: " +
        topic +
        ". Return JSON only in this exact format: " +
        `{
          "title":"...",
          "excerpt":"...",
          "content":"...",
          "seoTitle":"...",
          "seoDescription":"...",
          "seoKeywords":"keyword one, keyword two, keyword three",
          "thumbnailText":"...",
          "thumbnailPrompt":"...",
          "socialPosts":["...","...","..."],
          "newsletterSubject":"...",
          "newsletterBody":"..."
        }` +
        " Requirements: content must use Markdown, follow the Echoes & Visions Writing DNA, include practical examples, strong headings, clear CTA, no fluff.",
    })

    const parsed = JSON.parse(response.output_text)

    const title = parsed.title || topic
    const slug = await createUniqueSlug(slugify(title), category)

    const status =
      mode === "publish" ? "published" : mode === "schedule" ? "scheduled" : "draft"

    const article = await prisma.article.create({
      data: {
        title,
        slug,
        category,
        status,
        excerpt: parsed.excerpt || null,
        content: parsed.content || null,
        featuredImage: null,
        seoTitle: parsed.seoTitle || title,
        seoDescription: parsed.seoDescription || parsed.excerpt || null,
        seoKeywords: parsed.seoKeywords || null,
        publishedAt: mode === "publish" ? new Date() : null,
        scheduledFor: mode === "schedule" ? scheduledFor : null,
      },
    })

    return NextResponse.json({
      ok: true,
      article,
      assets: {
        thumbnailText: parsed.thumbnailText || null,
        thumbnailPrompt: parsed.thumbnailPrompt || null,
        socialPosts: parsed.socialPosts || [],
        newsletterSubject: parsed.newsletterSubject || null,
        newsletterBody: parsed.newsletterBody || null,
      },
    })
  } catch (error) {
    console.error("Autonomous pipeline failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to run autonomous publishing pipeline",
      },
      { status: 500 }
    )
  }
}