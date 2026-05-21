import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET() {
  try {
    const [runs, insights, policies] = await Promise.all([
      prisma.evolutionRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.evolutionInsight.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
      prisma.evolutionPolicyRecommendation.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
    ])

    return NextResponse.json({
      ok: true,
      runs,
      insights,
      policies,
    })
  } catch (error) {
    console.error("Adaptive evolution fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch adaptive evolution data" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const [
      workflows,
      executions,
      workflowActions,
      missions,
      agents,
      delegations,
      events,
      emails,
      toolActions,
      runtimeHeartbeats,
      snapshots,
      retries,
      forecasts,
      optimizations,
      memories,
    ] = await Promise.all([
      prisma.runtimeHeartbeat.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.workflowDefinition.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.workflowExecution.findMany({ orderBy: { createdAt: "desc" }, take: 150 }),
      prisma.workflowAction.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.autonomousMissionTask.findMany({ orderBy: { createdAt: "desc" }, take: 150 }),
      prisma.executiveAgent.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.agentDelegation.findMany({ orderBy: { createdAt: "desc" }, take: 150 }),
      prisma.operationalEvent.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.emailExecution.findMany({ orderBy: { createdAt: "desc" }, take: 150 }),
      Promise.resolve([]),
      prisma.runtimeHeartbeat.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.runtimeMemorySnapshot.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.runtimeRetryQueue.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.predictiveForecast.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.optimizationRun.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.creatorLearningMemory.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
    ])

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Adaptive Intelligence Evolution Engine for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Study operational history, identify what is improving or failing, and recommend safe evolutionary changes. Do not invent outcomes. Return valid JSON only.",
      input:
        "Analyze this autonomous organization and produce evolutionary learning.\n\n" +
        "Return JSON only in this exact format:\n" +
        `{
          "title":"...",
          "summary":"...",
          "maturityScore":78,
          "findings":{
            "whatImproved":["..."],
            "whatIsWeak":["..."],
            "patterns":["..."],
            "systemsNeedingEvolution":["..."]
          },
          "insights":[
            {
              "type":"workflow|agent|runtime|email|forecast|optimization|governance|strategy",
              "title":"...",
              "insight":"...",
              "priority":"low|medium|high",
              "confidence":0.75,
              "targetSystem":"...",
              "evidence":{}
            }
          ],
          "policies":[
            {
              "title":"...",
              "policyArea":"workflow|agent|runtime|retry|email|governance|forecasting|optimization",
              "recommendation":"...",
              "priority":"low|medium|high",
              "riskLevel":"low|medium|high",
              "payload":{}
            }
          ]
        }` +
        "\n\nWorkflows:\n" +
        JSON.stringify(workflows) +
        "\n\nWorkflow Executions:\n" +
        JSON.stringify(executions) +
        "\n\nWorkflow Actions:\n" +
        JSON.stringify(workflowActions) +
        "\n\nMissions:\n" +
        JSON.stringify(missions) +
        "\n\nAgents:\n" +
        JSON.stringify(agents) +
        "\n\nDelegations:\n" +
        JSON.stringify(delegations) +
        "\n\nOperational Events:\n" +
        JSON.stringify(events) +
        "\n\nEmails:\n" +
        JSON.stringify(emails) +
        "\n\nTool Actions:\n" +
        JSON.stringify(toolActions) +
        "\n\nRuntime Heartbeats:\n" +
        JSON.stringify(runtimeHeartbeats) +
        "\n\nRuntime Memory Snapshots:\n" +
        JSON.stringify(snapshots) +
        "\n\nRetry Queue:\n" +
        JSON.stringify(retries) +
        "\n\nForecasts:\n" +
        JSON.stringify(forecasts) +
        "\n\nOptimization Runs:\n" +
        JSON.stringify(optimizations) +
        "\n\nStrategic Memories:\n" +
        JSON.stringify(memories),
    })

    const parsed = JSON.parse(response.output_text)

    const run = await prisma.evolutionRun.create({
      data: {
        title: parsed.title || "Adaptive Evolution Run",
        summary: parsed.summary || null,
        maturityScore:
          typeof parsed.maturityScore === "number" ? parsed.maturityScore : 70,
        findings: parsed.findings || {},
        status: "completed",
      },
    })

    const savedInsights = []

    for (const item of parsed.insights || []) {
      const insight = await prisma.evolutionInsight.create({
        data: {
          runId: run.id,
          type: item.type || "strategy",
          title: item.title,
          insight: item.insight,
          priority: item.priority || "medium",
          confidence:
            typeof item.confidence === "number" ? item.confidence : 0.7,
          targetSystem: item.targetSystem || null,
          evidence: item.evidence || {},
          status: "active",
        },
      })

      savedInsights.push(insight)
    }

    const savedPolicies = []

    for (const item of parsed.policies || []) {
      const policy = await prisma.evolutionPolicyRecommendation.create({
        data: {
          runId: run.id,
          title: item.title,
          policyArea: item.policyArea || "strategy",
          recommendation: item.recommendation,
          priority: item.priority || "medium",
          riskLevel: item.riskLevel || "medium",
          payload: item.payload || {},
          status: "proposed",
        },
      })

      savedPolicies.push(policy)
    }

    await prisma.operationalEvent.create({
      data: {
        type: "adaptive-evolution-run",
        source: "adaptive-evolution",
        title: run.title,
        message: run.summary || null,
        severity: run.maturityScore < 55 ? "high" : "medium",
        entityType: "EvolutionRun",
        entityId: run.id,
        payload: {
          runId: run.id,
          maturityScore: run.maturityScore,
          insightCount: savedInsights.length,
          policyCount: savedPolicies.length,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      run,
      insights: savedInsights,
      policies: savedPolicies,
    })
  } catch (error) {
    console.error("Adaptive evolution run failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Adaptive evolution run failed",
      },
      { status: 500 }
    )
  }
}