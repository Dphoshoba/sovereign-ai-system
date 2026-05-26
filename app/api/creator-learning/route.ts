import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

export async function GET() {
  try {
    const [memories, runs] = await Promise.all([
      prisma.creatorLearningMemory.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.creatorLearningRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    ])

    return NextResponse.json({
      ok: true,
      memories,
      runs,
    })
  } catch (error) {
    console.error("Creator learning fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch creator learning data" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const [
      leads,
      audits,
      nurtureEvents,
      automationActions,
      proposals,
      invoices,
      existingMemories,
    ] = await Promise.all([
      prisma.creatorLead.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.creatorAuditRequest.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.creatorNurtureEvent.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.creatorAutomationAction.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.creatorProposal.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.creatorInvoice.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.creatorLearningMemory.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ])

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Recursive AI Learning and Strategic Memory Engine for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Analyze creator operations, detect patterns, learn from outcomes and create strategic memories. Return valid JSON only.",
      input:
        "Analyze this creator business system and extract durable strategic lessons.\n\n" +
        "Do not invent performance data. If data is thin, say the pattern is early or low confidence.\n\n" +
        "Return JSON only in this exact format:\n" +
        `{
          "summary":"...",
          "memories":[
            {
              "type":"lead|audit|nurture|proposal|revenue|automation|strategy",
              "title":"...",
              "insight":"...",
              "confidence":0.75,
              "priority":"low|medium|high",
              "evidence":{}
            }
          ]
        }` +
        "\n\nExisting Memories:\n" +
        JSON.stringify(existingMemories) +
        "\n\nLeads:\n" +
        JSON.stringify(leads) +
        "\n\nAudits:\n" +
        JSON.stringify(audits) +
        "\n\nNurture Events:\n" +
        JSON.stringify(nurtureEvents) +
        "\n\nAutomation Actions:\n" +
        JSON.stringify(automationActions) +
        "\n\nProposals:\n" +
        JSON.stringify(proposals) +
        "\n\nInvoices:\n" +
        JSON.stringify(invoices),
    })

    const parsed = JSON.parse(response.output_text)

    const run = await prisma.creatorLearningRun.create({
      data: {
        summary: parsed.summary || "Learning run completed.",
        status: "completed",
        findings: parsed,
      },
    })

    const savedMemories = []

    for (const item of parsed.memories || []) {
      const memory = await prisma.creatorLearningMemory.create({
        data: {
          type: item.type || "strategy",
          title: item.title,
          insight: item.insight,
          confidence:
            typeof item.confidence === "number" ? item.confidence : 0.7,
          priority: item.priority || "medium",
          evidence: item.evidence || {},
          status: "active",
        },
      })

      savedMemories.push(memory)
    }

    await prisma.aiActivityEvent.create({
      data: {
        type: "creator-learning",
        title: "Recursive learning run completed",
        message: parsed.summary || "Creator strategic memories generated.",
        status: "success",
        metadata: {
          runId: run.id,
          memoryCount: savedMemories.length,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      run,
      memories: savedMemories,
    })
  } catch (error) {
    console.error("Creator learning failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Creator learning failed",
      },
      { status: 500 }
    )
  }
}