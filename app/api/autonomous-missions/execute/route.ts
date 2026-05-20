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
    const taskId = body.taskId as string

    if (!taskId) {
      return NextResponse.json(
        { ok: false, error: "taskId is required" },
        { status: 400 }
      )
    }

    const task = await prisma.autonomousMissionTask.findUnique({
      where: { id: taskId },
    })

    if (!task) {
      return NextResponse.json(
        { ok: false, error: "Mission task not found" },
        { status: 404 }
      )
    }

    const agent = await prisma.executiveAgent.findFirst({
      where: { name: task.agentName },
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
      proposals,
      invoices,
      memories,
      automations,
      delegations,
    ] = await Promise.all([
      prisma.creatorLead.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.creatorAuditRequest.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.creatorProposal.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.creatorInvoice.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.creatorLearningMemory.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.creatorAutomationAction.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.agentDelegation.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
    ])

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        `You are ${agent.name} executing an autonomous mission task inside the Echoes & Visions AI organization. ` +
        DAVID_WRITING_DNA +
        " Execute operational analysis and recommend next steps. Return valid JSON only.",
      input:
        `Mission Task:\n${task.task}\n\n` +
        "Return JSON only in this exact format:\n" +
        `{
          "summary":"...",
          "findings":["..."],
          "recommendedActions":["..."],
          "delegationNeeded":false,
          "delegationSuggestion":{
            "toAgent":"...",
            "task":"..."
          },
          "memoryToStore":"..."
        }` +
        "\n\nLeads:\n" +
        JSON.stringify(leads) +
        "\n\nAudits:\n" +
        JSON.stringify(audits) +
        "\n\nProposals:\n" +
        JSON.stringify(proposals) +
        "\n\nInvoices:\n" +
        JSON.stringify(invoices) +
        "\n\nMemories:\n" +
        JSON.stringify(memories) +
        "\n\nAutomations:\n" +
        JSON.stringify(automations) +
        "\n\nDelegations:\n" +
        JSON.stringify(delegations),
    })

    const output = JSON.parse(response.output_text)

    const updatedTask = await prisma.autonomousMissionTask.update({
      where: { id: task.id },
      data: {
        status: "completed",
        resultSummary: output.summary || null,
        resultPayload: output,
      },
    })

    if (output.memoryToStore) {
      await prisma.creatorLearningMemory.create({
        data: {
          type: "strategy",
          title: `Mission Insight: ${agent.name}`,
          insight: output.memoryToStore,
          confidence: 0.75,
          priority: task.priority,
          status: "active",
        },
      })
    }

    if (
      output.delegationNeeded &&
      output.delegationSuggestion?.toAgent &&
      output.delegationSuggestion?.task
    ) {
      const targetAgent = await prisma.executiveAgent.findFirst({
        where: { name: output.delegationSuggestion.toAgent },
      })

      if (targetAgent) {
        await prisma.agentDelegation.create({
          data: {
            fromAgentId: agent.id,
            fromAgentName: agent.name,
            toAgentId: targetAgent.id,
            toAgentName: targetAgent.name,
            task: output.delegationSuggestion.task,
            priority: task.priority,
            status: "pending",
          },
        })
      }
    }

    await prisma.aiActivityEvent.create({
      data: {
        type: "mission-execution",
        title: `${agent.name} executed mission task`,
        message: output.summary || task.task,
        status: "success",
        metadata: {
          taskId: task.id,
          cycleId: task.cycleId,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      task: updatedTask,
      output,
    })
  } catch (error) {
    console.error("Mission execution failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Mission execution failed",
      },
      { status: 500 }
    )
  }
}