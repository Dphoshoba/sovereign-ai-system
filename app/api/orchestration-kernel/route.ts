import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

export async function GET() {
  try {
    const [runs, decisions] = await Promise.all([
      prisma.orchestrationKernelRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.orchestrationDecision.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
    ])

    return NextResponse.json({
      ok: true,
      runs,
      decisions,
    })
  } catch (error) {
    console.error("Orchestration kernel fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch orchestration kernel data" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const [
      events,
      workflows,
      workflowExecutions,
      missions,
      toolActions,
      emails,
      externalLogs,
      agents,
      delegations,
      optimizationActions,
      forecasts,
      memories,
    ] = await Promise.all([
      prisma.operationalEvent.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.workflowDefinition.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.workflowExecution.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.autonomousMissionTask.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.toolExecutionAction.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.emailExecution.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.externalOperationLog.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.executiveAgent.findMany({ where: { status: "active" } }),
      prisma.agentDelegation.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.optimizationAction.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.predictiveForecast.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.creatorLearningMemory.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
    ])

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Autonomous Orchestration Kernel for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Coordinate workflows, agents, missions, tools, email, events, forecasts and optimization systems. Detect conflicts, prioritize execution and propose safe coordination decisions. Return valid JSON only.",
      input:
        "Analyze the full AI operating system and create orchestration decisions.\n\n" +
        "Return JSON only in this exact format:\n" +
        `{
          "title":"...",
          "summary":"...",
          "healthScore":85,
          "priority":"low|medium|high",
          "decisions":[
            {
              "title":"...",
              "decisionType":"trigger_workflow|create_mission|create_tool_action|send_email_review|create_delegation|create_operational_event|run_optimization|manual_review",
              "targetSystem":"workflow|missions|tool-gateway|email|agents|event-bus|optimization|governance",
              "priority":"low|medium|high",
              "reason":"...",
              "payload":{}
            }
          ]
        }` +
        "\n\nOperational Events:\n" +
        JSON.stringify(events) +
        "\n\nWorkflows:\n" +
        JSON.stringify(workflows) +
        "\n\nWorkflow Executions:\n" +
        JSON.stringify(workflowExecutions) +
        "\n\nMissions:\n" +
        JSON.stringify(missions) +
        "\n\nTool Actions:\n" +
        JSON.stringify(toolActions) +
        "\n\nEmails:\n" +
        JSON.stringify(emails) +
        "\n\nExternal Logs:\n" +
        JSON.stringify(externalLogs) +
        "\n\nAgents:\n" +
        JSON.stringify(agents) +
        "\n\nDelegations:\n" +
        JSON.stringify(delegations) +
        "\n\nOptimization Actions:\n" +
        JSON.stringify(optimizationActions) +
        "\n\nForecasts:\n" +
        JSON.stringify(forecasts) +
        "\n\nStrategic Memories:\n" +
        JSON.stringify(memories),
    })

    const parsed = JSON.parse(response.output_text)

    const run = await prisma.orchestrationKernelRun.create({
      data: {
        title: parsed.title || "Orchestration Kernel Run",
        summary: parsed.summary || null,
        healthScore:
          typeof parsed.healthScore === "number" ? parsed.healthScore : 80,
        priority: parsed.priority || "medium",
        decisions: parsed,
        status: "completed",
      },
    })

    const savedDecisions = []

    for (const item of parsed.decisions || []) {
      const decision = await prisma.orchestrationDecision.create({
        data: {
          runId: run.id,
          title: item.title,
          decisionType: item.decisionType,
          targetSystem: item.targetSystem,
          priority: item.priority || "medium",
          reason: item.reason || null,
          payload: item.payload || {},
          status: "proposed",
        },
      })

      savedDecisions.push(decision)
    }

    await prisma.operationalEvent.create({
      data: {
        type: "orchestration-kernel-run",
        source: "orchestration-kernel",
        title: run.title,
        message: run.summary || null,
        severity: run.priority === "high" ? "high" : "medium",
        entityType: "OrchestrationKernelRun",
        entityId: run.id,
        payload: {
          runId: run.id,
          decisionCount: savedDecisions.length,
          healthScore: run.healthScore,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      run,
      decisions: savedDecisions,
    })
  } catch (error) {
    console.error("Orchestration kernel run failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Orchestration kernel run failed",
      },
      { status: 500 }
    )
  }
}