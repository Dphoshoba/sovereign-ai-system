import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

export async function GET() {
  try {
    const [runs, scenarios, timelineEvents, recommendations] =
      await Promise.all([
        prisma.temporalSimulationRun.findMany({
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        prisma.futureScenario.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        prisma.strategicTimelineEvent.findMany({
          orderBy: { createdAt: "desc" },
          take: 120,
        }),
        prisma.temporalRecommendation.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
      ])

    return NextResponse.json({
      ok: true,
      runs,
      scenarios,
      timelineEvents,
      recommendations,
    })
  } catch (error) {
    console.error("Temporal intelligence fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch temporal intelligence" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))

    const simulationType =
      body.simulationType || "strategic-future-projection"

    const horizon = body.timelineHorizon || "12-months"

    const [
      forecasts,
      executiveCampaigns,
      economicRuns,
      opportunities,
      cognitiveInsights,
      governanceRisks,
      externalSignals,
      strategicPlans,
      initiatives,
      runtimeObjectives,
      operationalEvents,
      optimizationActions,
      orchestrationDecisions,
    ] = await Promise.all([
      prisma.predictiveForecast.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      prisma.executiveOperationCampaign.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.economicIntelligenceRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 60,
      }),
      prisma.revenueOpportunity.findMany({
        orderBy: { estimatedValue: "desc" },
        take: 120,
      }),
      prisma.cognitiveInsight.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      prisma.governanceRiskSignal.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      prisma.externalIntelligenceSignal.findMany({
        orderBy: { relevanceScore: "desc" },
        take: 120,
      }),
      prisma.strategicPlan.findMany({
        orderBy: { createdAt: "desc" },
        take: 60,
      }),
      prisma.strategicInitiative.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      prisma.runtimeObjective.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      prisma.operationalEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.optimizationAction.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      prisma.orchestrationDecision.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
    ])

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Temporal Intelligence Engine for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Simulate future organizational trajectories, economic evolution, strategic outcomes and systemic stability. " +
        "Do not present speculation as certainty. Mark uncertainty clearly. Return valid JSON only.",
      input:
        `Run a future simulation for ${simulationType} with a horizon of ${horizon}.\n\n` +
        "Return JSON only in this exact format:\n" +
        `{
          "title":"...",
          "summary":"...",
          "confidenceScore":0.76,
          "stabilityScore":78,
          "strategicHealth":82,
          "economicProjection":250000,
          "findings":{
            "futureStrengths":["..."],
            "futureRisks":["..."],
            "economicTrajectories":["..."],
            "strategicPressures":["..."],
            "criticalDependencies":["..."]
          },
          "scenarios":[
            {
              "title":"...",
              "scenarioType":"optimistic|balanced|risk-heavy|expansion|disruption",
              "probability":0.65,
              "impactLevel":"low|medium|high|critical",
              "strategicOutcome":"...",
              "economicOutcome":"...",
              "operationalOutcome":"...",
              "governanceOutcome":"...",
              "narrative":"...",
              "recommendations":["..."]
            }
          ],
          "timelineEvents":[
            {
              "title":"...",
              "eventType":"growth|risk|market-shift|governance|economic|execution",
              "projectedDate":"Q1 2027",
              "severity":"low|medium|high|critical",
              "confidence":0.74,
              "implications":[]
            }
          ],
          "recommendations":[
            {
              "title":"...",
              "recommendationType":"strategy|economics|operations|governance|execution",
              "priority":"low|medium|high",
              "rationale":"...",
              "executionWindow":"...",
              "expectedBenefit":"...",
              "payload":{}
            }
          ]
        }` +
        "\n\nForecasts:\n" + JSON.stringify(forecasts) +
        "\n\nExecutive Campaigns:\n" + JSON.stringify(executiveCampaigns) +
        "\n\nEconomic Runs:\n" + JSON.stringify(economicRuns) +
        "\n\nRevenue Opportunities:\n" + JSON.stringify(opportunities) +
        "\n\nCognitive Insights:\n" + JSON.stringify(cognitiveInsights) +
        "\n\nGovernance Risks:\n" + JSON.stringify(governanceRisks) +
        "\n\nExternal Signals:\n" + JSON.stringify(externalSignals) +
        "\n\nStrategic Plans:\n" + JSON.stringify(strategicPlans) +
        "\n\nStrategic Initiatives:\n" + JSON.stringify(initiatives) +
        "\n\nRuntime Objectives:\n" + JSON.stringify(runtimeObjectives) +
        "\n\nOperational Events:\n" + JSON.stringify(operationalEvents) +
        "\n\nOptimization Actions:\n" + JSON.stringify(optimizationActions) +
        "\n\nOrchestration Decisions:\n" + JSON.stringify(orchestrationDecisions),
    })

    const parsed = JSON.parse(response.output_text)

    const run = await prisma.temporalSimulationRun.create({
      data: {
        title: parsed.title || "Temporal Strategic Simulation",
        simulationType,
        timelineHorizon: horizon,
        confidenceScore: parsed.confidenceScore || 0.7,
        stabilityScore: parsed.stabilityScore || 70,
        strategicHealth: parsed.strategicHealth || 75,
        economicProjection: parsed.economicProjection || 0,
        summary: parsed.summary || null,
        findings: parsed.findings || {},
        status: "completed",
      },
    })

    const savedScenarios = []

    for (const item of parsed.scenarios || []) {
      const scenario = await prisma.futureScenario.create({
        data: {
          simulationRunId: run.id,
          title: item.title,
          scenarioType: item.scenarioType || "balanced",
          probability: item.probability || 0.5,
          impactLevel: item.impactLevel || "medium",
          strategicOutcome: item.strategicOutcome || null,
          economicOutcome: item.economicOutcome || null,
          operationalOutcome: item.operationalOutcome || null,
          governanceOutcome: item.governanceOutcome || null,
          narrative: item.narrative || null,
          recommendations: item.recommendations || [],
        },
      })

      savedScenarios.push(scenario)
    }

    const savedEvents = []

    for (const item of parsed.timelineEvents || []) {
      const event = await prisma.strategicTimelineEvent.create({
        data: {
          simulationRunId: run.id,
          title: item.title,
          eventType: item.eventType || "growth",
          projectedDate: item.projectedDate,
          severity: item.severity || "medium",
          confidence: item.confidence || 0.7,
          implications: item.implications || [],
        },
      })

      savedEvents.push(event)
    }

    const savedRecommendations = []

    for (const item of parsed.recommendations || []) {
      const recommendation = await prisma.temporalRecommendation.create({
        data: {
          simulationRunId: run.id,
          title: item.title,
          recommendationType:
            item.recommendationType || "strategy",
          priority: item.priority || "medium",
          rationale: item.rationale || null,
          executionWindow: item.executionWindow || null,
          expectedBenefit: item.expectedBenefit || null,
          payload: item.payload || {},
          status: "proposed",
        },
      })

      savedRecommendations.push(recommendation)
    }

    await prisma.operationalEvent.create({
      data: {
        type: "temporal-simulation-completed",
        source: "temporal-intelligence",
        title: run.title,
        message: run.summary || null,
        severity:
          run.stabilityScore <= 45 ? "critical" : "medium",
        entityType: "TemporalSimulationRun",
        entityId: run.id,
        payload: {
          runId: run.id,
          scenarioCount: savedScenarios.length,
          recommendationCount: savedRecommendations.length,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      run,
      scenarios: savedScenarios,
      timelineEvents: savedEvents,
      recommendations: savedRecommendations,
    })
  } catch (error) {
    console.error("Temporal simulation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Temporal simulation failed",
      },
      { status: 500 }
    )
  }
}