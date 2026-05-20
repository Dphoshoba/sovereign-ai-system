import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET() {
  try {
    const conversations = await prisma.executiveCopilotConversation.findMany({
      orderBy: { updatedAt: "desc" },
      take: 20,
    })

    const messages = await prisma.executiveCopilotMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
    })

    return NextResponse.json({
      ok: true,
      conversations,
      messages,
    })
  } catch (error) {
    console.error("Executive copilot fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch Executive Copilot data" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const question = body.question?.trim()
    let conversationId = body.conversationId as string | undefined

    if (!question) {
      return NextResponse.json(
        { ok: false, error: "question is required" },
        { status: 400 }
      )
    }

    if (!conversationId) {
      const conversation = await prisma.executiveCopilotConversation.create({
        data: {
          title: question.slice(0, 80),
        },
      })

      conversationId = conversation.id
    }

    await prisma.executiveCopilotMessage.create({
      data: {
        conversationId,
        role: "user",
        content: question,
      },
    })

    const [
      pulseEvents,
      leads,
      audits,
      proposals,
      invoices,
      toolActions,
      missions,
      agents,
      delegations,
      forecasts,
      simulations,
      optimizationRuns,
      optimizationActions,
      memories,
    ] = await Promise.all([
      prisma.operationalEvent.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.creatorLead.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.creatorAuditRequest.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.creatorProposal.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.creatorInvoice.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.toolExecutionAction.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.autonomousMissionTask.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.executiveAgent.findMany({ where: { status: "active" } }),
      prisma.agentDelegation.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.predictiveForecast.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.strategicSimulation.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.optimizationRun.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.optimizationAction.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.creatorLearningMemory.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
    ])

    const previousMessages = await prisma.executiveCopilotMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 20,
    })

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Executive AI Copilot for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " You are not a generic chatbot. You are a conversational enterprise intelligence layer. " +
        "Answer with direct executive judgment, operational clarity and practical next steps. " +
        "Never claim an action was completed unless the data proves it. Return valid JSON only.",
      input:
        "User question:\n" +
        question +
        "\n\nConversation so far:\n" +
        JSON.stringify(previousMessages.map((m) => ({ role: m.role, content: m.content }))) +
        "\n\nReturn JSON only in this exact format:\n" +
        `{
          "answer":"...",
          "executiveSummary":"...",
          "risks":["..."],
          "opportunities":["..."],
          "recommendedActions":[
            {
              "label":"...",
              "type":"tool_action|mission|optimization|forecast|delegation|manual",
              "priority":"low|medium|high",
              "description":"...",
              "payload":{}
            }
          ],
          "systemsReferenced":["..."]
        }` +
        "\n\nOperational Events:\n" +
        JSON.stringify(pulseEvents) +
        "\n\nCreator Leads:\n" +
        JSON.stringify(leads) +
        "\n\nAudits:\n" +
        JSON.stringify(audits) +
        "\n\nProposals:\n" +
        JSON.stringify(proposals) +
        "\n\nInvoices:\n" +
        JSON.stringify(invoices) +
        "\n\nTool Actions:\n" +
        JSON.stringify(toolActions) +
        "\n\nMission Tasks:\n" +
        JSON.stringify(missions) +
        "\n\nAgents:\n" +
        JSON.stringify(agents) +
        "\n\nDelegations:\n" +
        JSON.stringify(delegations) +
        "\n\nForecasts:\n" +
        JSON.stringify(forecasts) +
        "\n\nSimulations:\n" +
        JSON.stringify(simulations) +
        "\n\nOptimization Runs:\n" +
        JSON.stringify(optimizationRuns) +
        "\n\nOptimization Actions:\n" +
        JSON.stringify(optimizationActions) +
        "\n\nStrategic Memories:\n" +
        JSON.stringify(memories),
    })

    const parsed = JSON.parse(response.output_text)

    await prisma.executiveCopilotMessage.create({
      data: {
        conversationId,
        role: "assistant",
        content: parsed.answer || parsed.executiveSummary || "Executive response generated.",
        metadata: parsed,
      },
    })

    await prisma.operationalEvent.create({
      data: {
        type: "executive-copilot-response",
        source: "executive-copilot",
        title: "Executive Copilot responded",
        message: parsed.executiveSummary || parsed.answer || null,
        severity: parsed.risks?.length ? "medium" : "info",
        payload: {
          conversationId,
          systemsReferenced: parsed.systemsReferenced || [],
        },
      },
    })

    return NextResponse.json({
      ok: true,
      conversationId,
      response: parsed,
    })
  } catch (error) {
    console.error("Executive copilot failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Executive copilot failed",
      },
      { status: 500 }
    )
  }
}