import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const delegationId = body.delegationId as string

    if (!delegationId) {
      return NextResponse.json(
        { ok: false, error: "delegationId is required" },
        { status: 400 }
      )
    }

    const delegation = await prisma.agentDelegation.findUnique({
      where: { id: delegationId },
    })

    if (!delegation) {
      return NextResponse.json(
        { ok: false, error: "Delegation not found" },
        { status: 404 }
      )
    }

    const toAgent = await prisma.executiveAgent.findUnique({
      where: { id: delegation.toAgentId },
    })

    if (!toAgent) {
      return NextResponse.json(
        { ok: false, error: "Receiving agent not found" },
        { status: 404 }
      )
    }

    const [
      leads,
      audits,
      proposals,
      invoices,
      learningMemories,
      automationActions,
      recentRuns,
    ] = await Promise.all([
      prisma.creatorLead.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
      prisma.creatorAuditRequest.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
      prisma.creatorProposal.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
      prisma.creatorInvoice.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
      prisma.creatorLearningMemory.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 60,
      }),
      prisma.creatorAutomationAction.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
      prisma.executiveAgentRun.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    ])

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        `You are ${toAgent.name}, responding to a delegated task inside the Echoes & Visions executive agent workforce. ` +
        `Role: ${toAgent.role}. Mission: ${toAgent.mission}. Department: ${toAgent.department}. ` +
        DAVID_WRITING_DNA +
        " Respond as a specialist. Be direct, practical and operational. Return valid JSON only.",
      input:
        `Delegated by: ${delegation.fromAgentName}\n` +
        `Task: ${delegation.task}\n` +
        `Context: ${delegation.context || "No extra context provided."}\n\n` +
        "Return JSON only in this exact format:\n" +
        `{
          "summary":"...",
          "specialistFindings":["..."],
          "recommendedActions":[
            {
              "priority":"low|medium|high",
              "action":"...",
              "reason":"..."
            }
          ],
          "risks":["..."],
          "needsEscalation":false,
          "escalationTarget":"...",
          "handoffTask":"..."
        }` +
        "\n\nLeads:\n" +
        JSON.stringify(leads) +
        "\n\nAudits:\n" +
        JSON.stringify(audits) +
        "\n\nProposals:\n" +
        JSON.stringify(proposals) +
        "\n\nInvoices:\n" +
        JSON.stringify(invoices) +
        "\n\nLearning Memories:\n" +
        JSON.stringify(learningMemories) +
        "\n\nAutomation Actions:\n" +
        JSON.stringify(automationActions) +
        "\n\nRecent Agent Runs:\n" +
        JSON.stringify(recentRuns),
    })

    const output = JSON.parse(response.output_text)

    const updated = await prisma.agentDelegation.update({
      where: { id: delegation.id },
      data: {
        status: "completed",
        responseSummary: output.summary || null,
        responsePayload: output,
      },
    })

    await prisma.executiveAgentRun.create({
      data: {
        agentId: toAgent.id,
        agentName: toAgent.name,
        task: `Delegation from ${delegation.fromAgentName}: ${delegation.task}`,
        output,
        summary: output.summary || null,
        status: "completed",
      },
    })

    await prisma.aiActivityEvent.create({
      data: {
        type: "agent-collaboration",
        title: `${toAgent.name} completed delegated task`,
        message: output.summary || delegation.task,
        status: "success",
        metadata: {
          delegationId: delegation.id,
          agentId: toAgent.id,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      delegation: updated,
      output,
    })
  } catch (error) {
    console.error("Delegation run failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Delegation run failed",
      },
      { status: 500 }
    )
  }
}