import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"
import { getMemoryContext } from "@/lib/ai/memory-context"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST() {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
    })

    const memories = await prisma.aiMemory.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
    })

    const jobs = await prisma.aiJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    const activity = await prisma.aiActivityEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    })

    const memoryContext = await getMemoryContext({
      types: ["strategy", "audience", "product", "publishing", "voice"],
      limit: 12,
    })

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the AI Chief Growth Officer for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Return only valid JSON. No markdown.",
      input:
        "Analyze the Echoes & Visions AI ecosystem and recommend growth and monetization opportunities. " +
        "Return JSON only in this exact format: " +
        `{
          "growthSummary":"...",
          "highestValueAudienceSegments":["..."],
          "quickWins":["..."],
          "thirtyDayGrowthPlan":["..."]
        }` +
        "\n\nSaved Memory Context:\n" +
        memoryContext +
        "\n\nArticles:\n" +
        JSON.stringify(articles) +
        "\n\nMemories:\n" +
        JSON.stringify(memories) +
        "\n\nJobs:\n" +
        JSON.stringify(jobs) +
        "\n\nActivity:\n" +
        JSON.stringify(activity),
    })

    const report = JSON.parse(response.output_text)

    await prisma.aiActivityEvent.create({
      data: {
        type: "growth-intelligence",
        title: "Growth intelligence report generated",
        message: report.growthSummary || "Growth intelligence completed.",
        status: "success",
        metadata: report,
      },
    })

    return NextResponse.json({
      ok: true,
      report,
    })
  } catch (error) {
    console.error("Growth intelligence failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate growth intelligence report",
      },
      { status: 500 }
    )
  }
}