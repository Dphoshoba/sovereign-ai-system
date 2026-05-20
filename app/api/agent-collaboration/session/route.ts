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
    const title = body.title || "Executive Collaboration Session"
    const objective = body.objective as string

    if (!objective) {
      return NextResponse.json(
        { ok: false, error: "Objective is required" },
        { status: 400 }
      )
    }

    const [agents, recentRuns, memories, leads, audits, proposals, invoices] =
      await Promise.all([
        prisma.executiveAgent.findMany({ where: { status: "active" } }),
        prisma.executiveAgentRun.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
        prisma.creatorLearningMemory.findMany({
          where: { status: "active" },
          orderBy: { createdAt: "desc" },
          take: 60,
        }),
        prisma.creatorLead.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
        prisma.creatorAuditRequest.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
        prisma.creatorProposal.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
        prisma.creatorInvoice.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
      ])

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the AI Boardroom Coordinator for the Echoes & Visions executive agent workforce. " +
        DAVID_WRITING_DNA +
        " Coordinate agent perspectives into one executive operating decision. Return valid JSON only.",
      input:
        `Session Objective: ${objective}\n\n` +
        "Return JSON only in this exact format:\n" +
        `{
          "summary":"...",
          "agentPerspectives":[
            {
              "agent":"...",
              "perspective":"...",
              "recommendation":"..."
            }
          ],
          "conflicts":["..."],
          "unifiedDecision":"...",
          "executionPlan":["..."],
          "delegationsToCreate":[
            {
              "fromAgent":"...",
              "toAgent":"...",
              "task":"...",
              "priority":"low|medium|high"
            }
          ]
        }` +
        "\n\nAgents:\n" +
        JSON.stringify(agents) +
        "\n\nRecent Agent Runs:\n" +
        JSON.stringify(recentRuns) +
        "\n\nStrategic Memories:\n" +
        JSON.stringify(memories) +
        "\n\nLeads:\n" +
        JSON.stringify(leads) +
        "\n\nAudits:\n" +
        JSON.stringify(audits) +
        "\n\nProposals:\n" +
        JSON.stringify(proposals) +
        "\n\nInvoices:\n" +
        JSON.stringify(invoices),
    })

    const output = JSON.parse(response.output_text)

    const session = await prisma.agentCollaborationSession.create({
      data: {
        title,
        objective,
        status: "completed",
        summary: output.summary || null,
        result: output,
      },
    })

    await prisma.aiActivityEvent.create({
      data: {
        type: "agent-boardroom",
        title: "Executive collaboration session completed",
        message: output.summary || objective,
        status: "success",
        metadata: { sessionId: session.id },
      },
    })

    return NextResponse.json({
      ok: true,
      session,
      output,
    })
  } catch (error) {
    console.error("Collaboration session failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Collaboration session failed",
      },
      { status: 500 }
    )
  }
}