import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"
import { getMemoryContext } from "@/lib/ai/memory-context"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      )
    }

    const body = await request.json()

    const topic = body.topic || "AI automation for creators"
    const category = body.category || "ai-automation"
    const publishNow = Boolean(body.publishNow)

    const memoryContext = await getMemoryContext({
      query: topic,
      types: ["strategy", "voice", "audience", "publishing"],
      limit: 8,
    })

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the AI writing engine for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Return only valid JSON. No markdown wrapper. No explanations.",
      input:
        "Create a practical SEO blog article for Echoes & Visions. " +
        "Topic: " +
        topic +
        ". Audience: creators, founders, ministries, agencies, and business owners using AI automation. " +
        "Relevant saved AI memory context: " +
        memoryContext +
        " " +
        'Return JSON only in this exact format: {"title":"...","excerpt":"...","content":"...","seoTitle":"...","seoDescription":"...","seoKeywords":"keyword one, keyword two, keyword three","featuredImagePrompt":"..."}. ' +
        "Requirements: use Markdown in content, include headings, practical examples, founder-level thinking, natural human rhythm, and a subtle Echoes & Visions CTA near the end.",
    })

    const parsed = JSON.parse(response.output_text)

    const title = parsed.title || topic
    const baseSlug = slugify(title)
    const slug = await createUniqueSlug(baseSlug, category)

    const article = await prisma.article.create({
      data: {
        title,
        slug,
        category,
        status: publishNow ? "published" : "draft",
        excerpt: parsed.excerpt || null,
        content: parsed.content || null,
        featuredImage: null,
        seoTitle: parsed.seoTitle || title,
        seoDescription: parsed.seoDescription || parsed.excerpt || null,
        seoKeywords: parsed.seoKeywords || null,
        publishedAt: publishNow ? new Date() : null,
      },
    })

    return NextResponse.json({
      ok: true,
      article,
    })
  } catch (error) {
    console.error("AI article generation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate article",
      },
      { status: 500 }
    )
  }
}