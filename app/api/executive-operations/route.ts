import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET() {
  try {
    const [campaigns, tasks, decisions, pulses] = await Promise.all([
      prisma.executiveOperationCampaign.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.executiveOperationTask.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
      prisma.executiveCommandDecision.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.executiveOperationalPulse.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ])

    return NextResponse.json({
      ok: true,
      campaigns,
      tasks,
      decisions,
      pulses,
    })
  } catch (error) {
    console.error("Executive operations fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch executive operations grid" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const [
      plans,
      initiatives,
      cognitiveInsights,
      governanceRisks,
      externalSignals,
      forecasts,
      workflows,
      missions,
      runtimeObjectives,
      operationalEvents,
      optimizationActions,
      orchestrationDecisions,
    ] = await Promise.all([
      prisma.strategicPlan.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
      prisma.strategicInitiative.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.cognitiveInsight.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.governanceRiskSignal.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.externalIntelligenceSignal.findMany({
        orderBy: { relevanceScore: "desc" },
        take: 80,
      }),
      prisma.predictiveForecast.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.workflowExecution.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.autonomousMissionTask.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.runtimeObjective.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.operationalEvent.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.optimizationAction.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.orchestrationDecision.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
    ])

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Autonomous Executive Operations Grid for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Coordinate enterprise execution, operational tempo, campaign orchestration and strategic synchronization. Return valid JSON only.",
      input:
        "Generate autonomous executive operations.\n\n" +
        "Return JSON only in this exact format:\n" +
        `{
          "pulse":{
            "title":"...",
            "operationalHealth":82,
            "executionVelocity":76,
            "coordinationScore":80,
            "strategicAlignment":85,
            "riskPressure":45,
            "summary":"...",
            "recommendations":["..."]
          },
          "campaigns":[
            {
              "title":"...",
              "description":"...",
              "campaignType":"growth|operations|governance|market-expansion|optimization|risk-response",
              "priority":"low|medium|high",
              "strategicGoal":"...",
              "executionTempo":"slow|normal|fast|critical",
              "targetSystems":["..."],
              "riskLevel":"low|medium|high"
            }
          ],
          "tasks":[
            {
              "campaignTitle":"...",
              "title":"...",
              "description":"...",
              "ownerSystem":"workflow|strategy|runtime|governance|agents|email|optimization",
              "taskType":"execution|analysis|coordination|review|response",
              "priority":"low|medium|high",
              "executionMode":"manual|semi-autonomous|autonomous"
            }
          ],
          "decisions":[
            {
              "title":"...",
              "decisionType":"resource-allocation|priority-shift|risk-escalation|tempo-adjustment",
              "rationale":"...",
              "impactLevel":"low|medium|high",
              "executionPlan":[]
            }
          ]
        }` +
        "\n\nStrategic Plans:\n" + JSON.stringify(plans) +
        "\n\nInitiatives:\n" + JSON.stringify(initiatives) +
        "\n\nCognitive Insights:\n" + JSON.stringify(cognitiveInsights) +
        "\n\nGovernance Risks:\n" + JSON.stringify(governanceRisks) +
        "\n\nExternal Signals:\n" + JSON.stringify(externalSignals) +
        "\n\nForecasts:\n" + JSON.stringify(forecasts) +
        "\n\nWorkflows:\n" + JSON.stringify(workflows) +
        "\n\nMissions:\n" + JSON.stringify(missions) +
        "\n\nRuntime Objectives:\n" + JSON.stringify(runtimeObjectives) +
        "\n\nOperational Events:\n" + JSON.stringify(operationalEvents) +
        "\n\nOptimization Actions:\n" + JSON.stringify(optimizationActions) +
        "\n\nOrchestration Decisions:\n" + JSON.stringify(orchestrationDecisions),
    })

    const parsed = JSON.parse(response.output_text)

    const pulse = await prisma.executiveOperationalPulse.create({
      data: {
        title: parsed.pulse?.title || "Executive Operational Pulse",
        operationalHealth: parsed.pulse?.operationalHealth || 75,
        executionVelocity: parsed.pulse?.executionVelocity || 70,
        coordinationScore: parsed.pulse?.coordinationScore || 70,
        strategicAlignment: parsed.pulse?.strategicAlignment || 70,
        riskPressure: parsed.pulse?.riskPressure || 40,
        summary: parsed.pulse?.summary || null,
        recommendations: parsed.pulse?.recommendations || [],
      },
    })

    const campaignMap = new Map<string, string>()
    const savedCampaigns = []

    for (const item of parsed.campaigns || []) {
      const campaign = await prisma.executiveOperationCampaign.create({
        data: {
          title: item.title,
          description: item.description || null,
          campaignType: item.campaignType || "operations",
          priority: item.priority || "medium",
          strategicGoal: item.strategicGoal || null,
          executionTempo: item.executionTempo || "normal",
          targetSystems: item.targetSystems || [],
          riskLevel: item.riskLevel || "medium",
          orchestrationPlan: {},
          progressScore: 0,
          status: "active",
        },
      })

      campaignMap.set(item.title, campaign.id)
      savedCampaigns.push(campaign)
    }

    const savedTasks = []

    for (const item of parsed.tasks || []) {
      const campaignId = campaignMap.get(item.campaignTitle)

      const task = await prisma.executiveOperationTask.create({
        data: {
          campaignId: campaignId || null,
          title: item.title,
          description: item.description || null,
          ownerSystem: item.ownerSystem || "operations",
          taskType: item.taskType || "execution",
          priority: item.priority || "medium",
          executionMode: item.executionMode || "semi-autonomous",
          status: "queued",
          progress: 0,
        },
      })

      savedTasks.push(task)
    }

    const savedDecisions = []

    for (const item of parsed.decisions || []) {
      const decision = await prisma.executiveCommandDecision.create({
        data: {
          title: item.title,
          decisionType: item.decisionType || "priority-shift",
          rationale: item.rationale || null,
          impactLevel: item.impactLevel || "medium",
          executionPlan: item.executionPlan || [],
          status: "active",
        },
      })

      savedDecisions.push(decision)
    }

    await prisma.operationalEvent.create({
      data: {
        type: "executive-operations-cycle",
        source: "executive-operations-grid",
        title: pulse.title,
        message: pulse.summary || null,
        severity:
          pulse.riskPressure >= 75 ? "critical" : "medium",
        entityType: "ExecutiveOperationalPulse",
        entityId: pulse.id,
        payload: {
          pulseId: pulse.id,
          campaignCount: savedCampaigns.length,
          taskCount: savedTasks.length,
          decisionCount: savedDecisions.length,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      pulse,
      campaigns: savedCampaigns,
      tasks: savedTasks,
      decisions: savedDecisions,
    })
  } catch (error) {
    console.error("Executive operations cycle failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Executive operations cycle failed",
      },
      { status: 500 }
    )
  }
}