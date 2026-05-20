import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"
import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST() {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    const articleMap = articles.map((article) => ({
      title: article.title,
      slug: article.slug,
      category: article.category,
      status: article.status,
      excerpt: article.excerpt,
      seoKeywords: article.seoKeywords,
    }))

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        instructions:
  "You are the Echoes & Visions AI Content Strategy Engine. " +
  DAVID_WRITING_DNA +
  " Return only valid JSON. No markdown.",
      input:
        "Analyze these existing blog articles and create a strategic content plan for Echoes & Visions. " +
        "Audience: creators, founders, ministries, agencies, businesses, and builders interested in AI automation. " +
        "Brand voice: clear, human, practical, spiritually aware, strategic, non-corporate. " +
        "Return JSON only in this exact shape: " +
        '{"pillarTopics":[{"title":"...","reason":"..."}],"articleIdeas":[{"title":"...","category":"...","excerpt":"...","targetKeywords":["..."],"internalLinkTargets":["..."]}],"contentGaps":["..."],"nextBestArticle":{"title":"...","category":"...","reason":"...","targetKeywords":["..."]}}. ' +
        "Existing articles: " +
        JSON.stringify(articleMap),
    })

    const parsed = JSON.parse(response.output_text)

    return NextResponse.json({
      ok: true,
      strategy: parsed,
    })
  } catch (error) {
    console.error("Content strategy generation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate content strategy",
      },
      { status: 500 }
    )
  }
}