import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

export async function GET() {
  try {
    const [runs, actions] = await Promise.all([
      prisma.optimizationRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.optimizationAction.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
    ])

    return NextResponse.json({
      ok: true,
      runs,
      actions,
    })
  } catch (error) {
    console.error("Optimization fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch optimization data" },
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
      events,
      automations,
      missions,
      forecasts,
      simulations,
      learningMemories,
      delegations,
      toolActions,
    ] = await Promise.all([
      prisma.creatorLead.findMany({ orderBy: { createdAt: "desc" }, take: 150 }),
      prisma.creatorAuditRequest.findMany({ orderBy: { createdAt: "desc" }, take: 150 }),
      prisma.creatorProposal.findMany({ orderBy: { createdAt: "desc" }, take: 150 }),
      prisma.creatorInvoice.findMany({ orderBy: { createdAt: "desc" }, take: 150 }),
      prisma.operationalEvent.findMany({ orderBy: { createdAt: "desc" }, take: 150 }),
      prisma.creatorAutomationAction.findMany({ orderBy: { createdAt: "desc" }, take: 150 }),
      prisma.autonomousMissionTask.findMany({ orderBy: { createdAt: "desc" }, take: 150 }),
      prisma.predictiveForecast.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.strategicSimulation.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.creatorLearningMemory.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
      prisma.agentDelegation.findMany({ orderBy: { createdAt: "desc" }, take: 150 }),
      prisma.toolExecutionAction.findMany({ orderBy: { createdAt: "desc" }, take: 150 }),
    ])

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Autonomous Optimization and Self-Healing Systems Engine for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Detect friction, failed patterns, bottlenecks, stalled operations, weak loops and self-healing opportunities. Return valid JSON only.",
      input:
        "Analyze the operating system and produce optimization actions.\n\n" +
        "Do not invent data. If evidence is thin, mark confidence or risk accordingly.\n\n" +
        "Return JSON only in this exact format:\n" +
        `{
          "title":"...",
          "summary":"...",
          "healthScore":78,
          "findings":{
            "bottlenecks":["..."],
            "failures":["..."],
            "stalledLoops":["..."],
            "optimizationOpportunities":["..."]
          },
          "actions":[
            {
              "title":"...",
              "description":"...",
              "actionType":"create_tool_action|create_mission_task|create_delegation|create_learning_memory|create_operational_event|update_lead_status|recommend_process_change",
              "targetSystem":"crm|audit|revenue|nurture|automation|missions|agents|event-bus|tool-gateway|learning",
              "priority":"low|medium|high",
              "riskLevel":"low|medium|high",
              "payload":{}
            }
          ]
        }` +
        "\n\nLeads:\n" +
        JSON.stringify(leads) +
        "\n\nAudits:\n" +
        JSON.stringify(audits) +
        "\n\nProposals:\n" +
        JSON.stringify(proposals) +
        "\n\nInvoices:\n" +
        JSON.stringify(invoices) +
        "\n\nOperational Events:\n" +
        JSON.stringify(events) +
        "\n\nAutomation Actions:\n" +
        JSON.stringify(automations) +
        "\n\nMission Tasks:\n" +
        JSON.stringify(missions) +
        "\n\nForecasts:\n" +
        JSON.stringify(forecasts) +
        "\n\nSimulations:\n" +
        JSON.stringify(simulations) +
        "\n\nLearning Memories:\n" +
        JSON.stringify(learningMemories) +
        "\n\nDelegations:\n" +
        JSON.stringify(delegations) +
        "\n\nTool Actions:\n" +
        JSON.stringify(toolActions),
    })

    const parsed = JSON.parse(response.output_text)

    const run = await prisma.optimizationRun.create({
      data: {
        title: parsed.title || "Optimization Run",
        summary: parsed.summary || null,
        healthScore:
          typeof parsed.healthScore === "number" ? parsed.healthScore : 70,
        findings: parsed.findings || {},
        status: "completed",
      },
    })

    const savedActions = []

    for (const item of parsed.actions || []) {
      const action = await prisma.optimizationAction.create({
        data: {
          runId: run.id,
          title: item.title,
          description: item.description || null,
          actionType: item.actionType,
          targetSystem: item.targetSystem,
          priority: item.priority || "medium",
          riskLevel: item.riskLevel || "medium",
          status: "proposed",
          payload: item.payload || {},
        },
      })

      savedActions.push(action)
    }

    await prisma.operationalEvent.create({
      data: {
        type: "optimization-run-completed",
        source: "optimization-engine",
        title: run.title,
        message: run.summary || null,
        severity: run.healthScore < 50 ? "high" : "medium",
        entityType: "OptimizationRun",
        entityId: run.id,
        payload: {
          runId: run.id,
          actionCount: savedActions.length,
          healthScore: run.healthScore,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      run,
      actions: savedActions,
    })
  } catch (error) {
    console.error("Optimization run failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Optimization run failed",
      },
      { status: 500 }
    )
  }
}