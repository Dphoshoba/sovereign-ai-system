import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const agentId = body.agentId as string
    const task = body.task as string

    if (!agentId || !task) {
      return NextResponse.json(
        { ok: false, error: "agentId and task are required" },
        { status: 400 }
      )
    }

    const agent = await prisma.executiveAgent.findUnique({
      where: { id: agentId },
    })

    if (!agent) {
      return NextResponse.json(
        { ok: false, error: "Agent not found" },
        { status: 404 }
      )
    }

    const [
      leads,
      audits,
      nurtureEvents,
      automationActions,
      proposals,
      invoices,
      learningMemories,
    ] = await Promise.all([
      prisma.creatorLead.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.creatorAuditRequest.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.creatorNurtureEvent.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.creatorAutomationAction.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.creatorProposal.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.creatorInvoice.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.creatorLearningMemory.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
    ])

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        `You are ${agent.name}, part of the Echoes & Visions Multi-Agent Executive Workforce. ` +
        `Role: ${agent.role}. Mission: ${agent.mission}. Department: ${agent.department}. ` +
        DAVID_WRITING_DNA +
        " Give direct operational recommendations. Do not pretend actions were completed unless data shows it. Return valid JSON only.",
      input:
        "Task:\n" +
        task +
        "\n\nReturn JSON only in this exact format:\n" +
        `{
          "summary":"...",
          "findings":["..."],
          "recommendedActions":[
            {
              "priority":"low|medium|high",
              "action":"...",
              "reason":"..."
            }
          ],
          "risks":["..."],
          "handoffSuggestions":[
            {
              "agent":"...",
              "task":"..."
            }
          ]
        }` +
        "\n\nCreator Leads:\n" +
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
        JSON.stringify(invoices) +
        "\n\nLearning Memories:\n" +
        JSON.stringify(learningMemories),
    })

    const output = JSON.parse(response.output_text)

    const run = await prisma.executiveAgentRun.create({
      data: {
        agentId: agent.id,
        agentName: agent.name,
        task,
        output,
        summary: output.summary || null,
        status: "completed",
      },
    })

    await prisma.aiActivityEvent.create({
      data: {
        type: "executive-agent",
        title: `${agent.name} completed task`,
        message: output.summary || task,
        status: "success",
        metadata: {
          agentId: agent.id,
          runId: run.id,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      run,
      output,
    })
  } catch (error) {
    console.error("Executive agent run failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Executive agent run failed",
      },
      { status: 500 }
    )
  }
}