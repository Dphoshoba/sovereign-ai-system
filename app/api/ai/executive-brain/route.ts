import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"
import { getMemoryContext } from "@/lib/ai/memory-context"

export async function POST() {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    })

    const jobs = await prisma.aiJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    const memories = await prisma.aiMemory.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    const activity = await prisma.aiActivityEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    })

    const memoryContext = await getMemoryContext({
      types: ["strategy", "audience", "publishing", "product", "voice"],
      limit: 12,
    })

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the AI Executive Brain for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Think like a strategic advisor, publishing director, product architect, ministry-minded operator, and growth strategist. Return only valid JSON. No markdown.",
      input:
        "Analyze the current Echoes & Visions AI publishing system and produce a strategic intelligence report. " +
        "Use the articles, jobs, memories, and activity below. " +
        "Return JSON only in this exact format: " +
        `{
          "executiveSummary":"...",
          "currentStrengths":["..."],
          "risks":["..."],
          "contentGaps":["..."],
          "nextBestActions":[{"priority":"high","action":"...","reason":"..."}],
          "recommendedArticles":[{"title":"...","category":"...","reason":"...","keywords":["..."]}],
          "systemImprovements":["..."],
          "ministryAndBusinessInsight":"...",
          "thirtyDayPlan":["..."]
        }` +
        "\n\nSaved Memory Context:\n" +
        memoryContext +
        "\n\nArticles:\n" +
        JSON.stringify(
          articles.map((a) => ({
            title: a.title,
            category: a.category,
            status: a.status,
            excerpt: a.excerpt,
            seoKeywords: a.seoKeywords,
            createdAt: a.createdAt,
            scheduledFor: a.scheduledFor,
          }))
        ) +
        "\n\nJobs:\n" +
        JSON.stringify(
          jobs.map((j) => ({
            type: j.type,
            status: j.status,
            attempts: j.attempts,
            error: j.error,
            createdAt: j.createdAt,
          }))
        ) +
        "\n\nMemories:\n" +
        JSON.stringify(
          memories.map((m) => ({
            type: m.type,
            title: m.title,
            content: m.content,
            tags: m.tags,
          }))
        ) +
        "\n\nActivity:\n" +
        JSON.stringify(
          activity.map((e) => ({
            type: e.type,
            title: e.title,
            status: e.status,
            message: e.message,
            createdAt: e.createdAt,
          }))
        ),
    })

    const report = JSON.parse(response.output_text)

    await prisma.aiActivityEvent.create({
      data: {
        type: "executive-brain",
        title: "Strategic intelligence report generated",
        message: report.executiveSummary || "Executive report completed.",
        status: "success",
        metadata: report,
      },
    })

    return NextResponse.json({
      ok: true,
      report,
    })
  } catch (error) {
    console.error("Executive brain failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate executive report",
      },
      { status: 500 }
    )
  }
}
