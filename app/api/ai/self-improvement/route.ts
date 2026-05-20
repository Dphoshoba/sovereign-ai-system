import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST() {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    })

    const jobs = await prisma.aiJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    })

    const activity = await prisma.aiActivityEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    const memories = await prisma.aiMemory.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the AI Self-Improvement and Prompt Optimization System for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Analyze patterns, weaknesses, risks, prompt gaps, workflow issues, and improvement opportunities. Return only valid JSON. No markdown.",
      input:
        "Review this AI publishing platform data and recommend improvements. " +
        "Do not invent metrics. Be practical, honest, and specific. " +
        "Return JSON only in this exact format: " +
        `{
          "summary":"...",
          "detectedWeaknesses":["..."],
          "promptImprovements":[{"area":"...","recommendation":"...","examplePromptAddition":"..."}],
          "workflowImprovements":[{"workflow":"...","issue":"...","fix":"..."}],
          "contentQualityImprovements":["..."],
          "seoImprovements":["..."],
          "automationRisks":["..."],
          "nextBestSystemUpgrades":["..."],
          "recommendedMemoryUpdates":[{"type":"...","title":"...","content":"...","tags":"..."}]
        }` +
        "\n\nArticles:\n" +
        JSON.stringify(
          articles.map((a) => ({
            title: a.title,
            category: a.category,
            status: a.status,
            excerpt: a.excerpt,
            seoTitle: a.seoTitle,
            seoDescription: a.seoDescription,
            seoKeywords: a.seoKeywords,
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
        "\n\nActivity:\n" +
        JSON.stringify(
          activity.map((e) => ({
            type: e.type,
            title: e.title,
            status: e.status,
            message: e.message,
            createdAt: e.createdAt,
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
        ),
    })

    const report = JSON.parse(response.output_text)

    await prisma.aiActivityEvent.create({
      data: {
        type: "self-improvement",
        title: "Self-improvement report generated",
        message: report.summary || "Prompt optimization report completed.",
        status: "success",
        metadata: report,
      },
    })

    return NextResponse.json({
      ok: true,
      report,
    })
  } catch (error) {
    console.error("Self-improvement failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate self-improvement report",
      },
      { status: 500 }
    )
  }
}