import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

export async function GET() {
  try {
    const [snapshots, priorities, actions, routes] = await Promise.all([
      prisma.sovereignRuntimeSnapshot.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.sovereignRuntimePriority.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      prisma.sovereignRuntimeAction.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      prisma.sovereignIntelligenceRoute.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
    ])

    return NextResponse.json({
      ok: true,
      snapshots,
      priorities,
      actions,
      routes,
    })
  } catch (error) {
    console.error("Sovereign runtime fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch sovereign runtime" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const [
      pulse,
      globalEvents,
      copilotMessages,
      strategicPlans,
      governanceRisks,
      governanceApprovals,
      cognitiveInsights,
      executiveCampaigns,
      economicRuns,
      temporalRuns,
      federationSessions,
      recursiveCycles,
      worldRuns,
      workflowExecutions,
      emailExecutions,
      runtimeHeartbeats,
    ] = await Promise.all([
      prisma.executiveOperationalPulse.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.operationalEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
      prisma.executiveCopilotMessage.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.strategicPlan.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.governanceRiskSignal.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.governanceApproval.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.cognitiveInsight.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.executiveOperationCampaign.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.economicIntelligenceRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.temporalSimulationRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.federationCouncilSession.findMany({
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
      prisma.recursiveEvolutionCycle.findMany({
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
      prisma.worldModelRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
      prisma.workflowExecution.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.emailExecution.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.runtimeHeartbeat.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ])

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Sovereign Unified Executive Runtime for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Consolidate all intelligence layers into one executive operating state. " +
        "Do not invent facts. Route attention safely. Keep execution governed. Return valid JSON only.",
      input:
        "Generate a unified sovereign runtime snapshot.\n\n" +
        "Return JSON only in this exact format:\n" +
        `{
          "title":"...",
          "summary":"...",
          "overallHealth":82,
          "intelligenceScore":84,
          "governanceScore":80,
          "executionScore":76,
          "economicScore":78,
          "futureReadinessScore":81,
          "executiveState":{
            "currentReality":"...",
            "mainTension":"...",
            "highestLeverageMove":"...",
            "stabilityWarning":"...",
            "economicFocus":"...",
            "governanceFocus":"...",
            "futureFocus":"..."
          },
          "priorities":[
            {
              "title":"...",
              "priority":"low|medium|high|critical",
              "area":"governance|execution|strategy|economics|cognition|runtime|federation|world-model",
              "rationale":"...",
              "payload":{}
            }
          ],
          "routes":[
            {
              "sourceLayer":"...",
              "targetLayer":"...",
              "routeType":"attention|risk|execution|memory|strategy|governance",
              "title":"...",
              "reason":"...",
              "priority":"low|medium|high|critical",
              "metadata":{}
            }
          ],
          "actions":[
            {
              "title":"...",
              "actionType":"create-governance-review|create-strategic-initiative|create-runtime-objective|create-economic-campaign|create-operational-event|store-memory|manual-review",
              "targetLayer":"governance|strategy|runtime|economics|operations|memory",
              "priority":"low|medium|high|critical",
              "rationale":"...",
              "payload":{}
            }
          ]
        }` +
        "\n\nExecutive Pulse:\n" + JSON.stringify(pulse) +
        "\n\nOperational Events:\n" + JSON.stringify(globalEvents) +
        "\n\nCopilot Messages:\n" + JSON.stringify(copilotMessages) +
        "\n\nStrategic Plans:\n" + JSON.stringify(strategicPlans) +
        "\n\nGovernance Risks:\n" + JSON.stringify(governanceRisks) +
        "\n\nGovernance Approvals:\n" + JSON.stringify(governanceApprovals) +
        "\n\nCognitive Insights:\n" + JSON.stringify(cognitiveInsights) +
        "\n\nExecutive Campaigns:\n" + JSON.stringify(executiveCampaigns) +
        "\n\nEconomic Runs:\n" + JSON.stringify(economicRuns) +
        "\n\nTemporal Runs:\n" + JSON.stringify(temporalRuns) +
        "\n\nFederation Sessions:\n" + JSON.stringify(federationSessions) +
        "\n\nRecursive Evolution Cycles:\n" + JSON.stringify(recursiveCycles) +
        "\n\nWorld Model Runs:\n" + JSON.stringify(worldRuns) +
        "\n\nWorkflow Executions:\n" + JSON.stringify(workflowExecutions) +
        "\n\nEmail Executions:\n" + JSON.stringify(emailExecutions) +
        "\n\nRuntime Heartbeats:\n" + JSON.stringify(runtimeHeartbeats),
    })

    const parsed = JSON.parse(response.output_text)

    const snapshot = await prisma.sovereignRuntimeSnapshot.create({
      data: {
        title: parsed.title || "Sovereign Runtime Snapshot",
        summary: parsed.summary || null,
        overallHealth: parsed.overallHealth || 75,
        intelligenceScore: parsed.intelligenceScore || 75,
        governanceScore: parsed.governanceScore || 75,
        executionScore: parsed.executionScore || 75,
        economicScore: parsed.economicScore || 75,
        futureReadinessScore: parsed.futureReadinessScore || 75,
        executiveState: parsed.executiveState || {},
        status: "completed",
      },
    })

    const savedPriorities = []

    for (const item of parsed.priorities || []) {
      const priority = await prisma.sovereignRuntimePriority.create({
        data: {
          snapshotId: snapshot.id,
          title: item.title,
          priority: item.priority || "medium",
          area: item.area || "strategy",
          rationale: item.rationale || null,
          payload: item.payload || {},
          status: "active",
        },
      })

      savedPriorities.push(priority)
    }

    const savedRoutes = []

    for (const item of parsed.routes || []) {
      const route = await prisma.sovereignIntelligenceRoute.create({
        data: {
          snapshotId: snapshot.id,
          sourceLayer: item.sourceLayer || "unknown",
          targetLayer: item.targetLayer || "unknown",
          routeType: item.routeType || "attention",
          title: item.title,
          reason: item.reason || null,
          priority: item.priority || "medium",
          metadata: item.metadata || {},
          status: "open",
        },
      })

      savedRoutes.push(route)
    }

    const savedActions = []

    for (const item of parsed.actions || []) {
      const action = await prisma.sovereignRuntimeAction.create({
        data: {
          snapshotId: snapshot.id,
          title: item.title,
          actionType: item.actionType || "manual-review",
          targetLayer: item.targetLayer || "operations",
          priority: item.priority || "medium",
          rationale: item.rationale || null,
          payload: item.payload || {},
          status: "proposed",
        },
      })

      savedActions.push(action)
    }

    await prisma.operationalEvent.create({
      data: {
        type: "sovereign-runtime-snapshot",
        source: "sovereign-runtime",
        title: snapshot.title,
        message: snapshot.summary || null,
        severity:
          snapshot.overallHealth <= 45
            ? "critical"
            : snapshot.overallHealth <= 65
              ? "high"
              : "medium",
        entityType: "SovereignRuntimeSnapshot",
        entityId: snapshot.id,
        payload: {
          snapshotId: snapshot.id,
          priorityCount: savedPriorities.length,
          routeCount: savedRoutes.length,
          actionCount: savedActions.length,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      snapshot,
      priorities: savedPriorities,
      routes: savedRoutes,
      actions: savedActions,
    })
  } catch (error) {
    console.error("Sovereign runtime cycle failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Sovereign runtime cycle failed",
      },
      { status: 500 }
    )
  }
}