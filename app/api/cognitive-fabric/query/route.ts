import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const question = body.question?.trim()

    if (!question) {
      return NextResponse.json(
        { ok: false, error: "question is required" },
        { status: 400 }
      )
    }

    const [entities, relations, insights, runs] = await Promise.all([
      prisma.cognitiveEntity.findMany({ orderBy: { importance: "desc" }, take: 120 }),
      prisma.cognitiveRelation.findMany({ orderBy: { strength: "desc" }, take: 160 }),
      prisma.cognitiveInsight.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.cognitiveSynthesisRun.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    ])

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Cross-System Intelligence Graph Query Engine for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Answer using the cognitive graph. Explain causal relationships, dependencies and strategic meaning. Return valid JSON only.",
      input:
        "Question:\n" +
        question +
        "\n\nReturn JSON only in this exact format:\n" +
        `{
          "answer":"...",
          "keyEntities":["..."],
          "relationships":["..."],
          "risks":["..."],
          "recommendedNextSteps":["..."]
        }` +
        "\n\nEntities:\n" + JSON.stringify(entities) +
        "\n\nRelations:\n" + JSON.stringify(relations) +
        "\n\nInsights:\n" + JSON.stringify(insights) +
        "\n\nSynthesis Runs:\n" + JSON.stringify(runs),
    })

    const parsed = JSON.parse(response.output_text)

    return NextResponse.json({
      ok: true,
      result: parsed,
    })
  } catch (error) {
    console.error("Cognitive fabric query failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Cognitive fabric query failed",
      },
      { status: 500 }
    )
  }
}