import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET() {
  try {
    const [cycles, tasks] = await Promise.all([
      prisma.autonomousMissionCycle.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.autonomousMissionTask.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ])

    return NextResponse.json({
      ok: true,
      cycles,
      tasks,
    })
  } catch (error) {
    console.error("Mission cycles fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch mission cycles" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const [
      leads,
      audits,
      proposals,
      invoices,
      automationActions,
      learningMemories,
      delegations,
      agents,
    ] = await Promise.all([
      prisma.creatorLead.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.creatorAuditRequest.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.creatorProposal.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.creatorInvoice.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.creatorAutomationAction.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      prisma.creatorLearningMemory.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      prisma.agentDelegation.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      prisma.executiveAgent.findMany({
        where: { status: "active" },
      }),
    ])

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Autonomous Mission Operations Engine for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Create recursive operational mission cycles across the executive workforce. Return valid JSON only.",
      input:
        "Analyze the creator business operating system and create autonomous mission tasks.\n\n" +
        "Return JSON only in this exact format:\n" +
        `{
          "title":"...",
          "objective":"...",
          "cycleType":"daily-ops|revenue-review|creator-success|executive-review|automation-review",
          "summary":"...",
          "tasks":[
            {
              "agentName":"...",
              "task":"...",
              "priority":"low|medium|high"
            }
          ]
        }` +
        "\n\nAgents:\n" +
        JSON.stringify(agents) +
        "\n\nLeads:\n" +
        JSON.stringify(leads) +
        "\n\nAudits:\n" +
        JSON.stringify(audits) +
        "\n\nProposals:\n" +
        JSON.stringify(proposals) +
        "\n\nInvoices:\n" +
        JSON.stringify(invoices) +
        "\n\nAutomation Actions:\n" +
        JSON.stringify(automationActions) +
        "\n\nStrategic Memories:\n" +
        JSON.stringify(learningMemories) +
        "\n\nDelegations:\n" +
        JSON.stringify(delegations),
    })

    const parsed = JSON.parse(response.output_text)

    const cycle = await prisma.autonomousMissionCycle.create({
      data: {
        title: parsed.title || "Autonomous Mission Cycle",
        objective: parsed.objective || "Operational review",
        cycleType: parsed.cycleType || "daily-ops",
        summary: parsed.summary || null,
        findings: parsed,
        status: "running",
      },
    })

    const createdTasks = []

    for (const item of parsed.tasks || []) {
      const task = await prisma.autonomousMissionTask.create({
        data: {
          cycleId: cycle.id,
          agentName: item.agentName,
          task: item.task,
          priority: item.priority || "medium",
          status: "pending",
        },
      })

      createdTasks.push(task)
    }

    await prisma.aiActivityEvent.create({
      data: {
        type: "autonomous-mission",
        title: "Autonomous mission cycle created",
        message: parsed.summary || cycle.title,
        status: "success",
        metadata: {
          cycleId: cycle.id,
          taskCount: createdTasks.length,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      cycle,
      tasks: createdTasks,
    })
  } catch (error) {
    console.error("Mission cycle generation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Mission cycle generation failed",
      },
      { status: 500 }
    )
  }
}