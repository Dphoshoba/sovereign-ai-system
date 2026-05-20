import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

    const org = body.organizationId
      ? await prisma.sovereignOrganization.findUnique({
          where: { id: body.organizationId },
        })
      : await prisma.sovereignOrganization.findUnique({
          where: { slug: "echoes-visions" },
        })

    const records = await prisma.semanticKnowledgeRecord.findMany({
      where: {
        organizationId: org?.id || undefined,
        status: "active",
      },
      orderBy: [{ importance: "desc" }, { createdAt: "desc" }],
      take: 120,
    })

    const nodes = await prisma.knowledgeGraphNode.findMany({
      where: {
        organizationId: org?.id || undefined,
        status: "active",
      },
      orderBy: { importance: "desc" },
      take: 120,
    })

    const edges = await prisma.knowledgeGraphEdge.findMany({
      where: {
        organizationId: org?.id || undefined,
        status: "active",
      },
      orderBy: { strength: "desc" },
      take: 160,
    })

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Semantic Memory Query Engine for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Answer only from supplied memory, graph nodes and relationships. If memory is insufficient, say so clearly. Return valid JSON only.",
      input:
        "Question:\n" +
        question +
        "\n\nReturn JSON only in this exact format:\n" +
        `{
          "answer":"...",
          "confidence":0.75,
          "matchedRecords":[{"title":"...","reason":"..."}],
          "matchedNodes":["..."],
          "reasoningPath":["..."],
          "recommendedMemoryUpdates":["..."]
        }` +
        "\n\nKnowledge Records:\n" + JSON.stringify(records) +
        "\n\nGraph Nodes:\n" + JSON.stringify(nodes) +
        "\n\nGraph Edges:\n" + JSON.stringify(edges),
    })

    const parsed = JSON.parse(response.output_text)

    const query = await prisma.semanticMemoryQuery.create({
      data: {
        organizationId: org?.id || null,
        workspaceId: body.workspaceId || null,
        question,
        answer: parsed.answer || null,
        confidence: parsed.confidence || 0.7,
        matchedRecords: parsed.matchedRecords || [],
        matchedNodes: parsed.matchedNodes || [],
        reasoningPath: parsed.reasoningPath || [],
        status: "completed",
      },
    })

    return NextResponse.json({
      ok: true,
      query,
      result: parsed,
    })
  } catch (error) {
    console.error("Semantic memory query failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Semantic memory query failed",
      },
      { status: 500 }
    )
  }
}