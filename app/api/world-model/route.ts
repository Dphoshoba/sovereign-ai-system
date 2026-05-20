import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET() {
  try {
    const [runs, signals, scenarios, recommendations] = await Promise.all([
      prisma.worldModelRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.planetarySignal.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
      prisma.civilizationScenario.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.worldModelRecommendation.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ])

    return NextResponse.json({
      ok: true,
      runs,
      signals,
      scenarios,
      recommendations,
    })
  } catch (error) {
    console.error("World model fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch world model" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const modelType = body.modelType || "planetary-strategic-simulation"
    const horizon = body.horizon || "12-months"

    const [
      externalSignals,
      federationSignals,
      temporalRuns,
      economicRuns,
      worldRuns,
      cognitiveInsights,
      strategicPlans,
      governanceRisks,
      opportunities,
    ] = await Promise.all([
      prisma.externalIntelligenceSignal.findMany({
        orderBy: { relevanceScore: "desc" },
        take: 150,
      }),
      prisma.federationSignal.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      prisma.temporalSimulationRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.economicIntelligenceRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.worldModelRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.cognitiveInsight.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
      prisma.strategicPlan.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.governanceRiskSignal.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      prisma.revenueOpportunity.findMany({
        orderBy: { estimatedValue: "desc" },
        take: 120,
      }),
    ])

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Sovereign World Model Engine for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Build macro strategic models using supplied internal and external signals. " +
        "Do not claim certainty. Do not invent current facts. Mark assumptions clearly. Return valid JSON only.",
      input:
        `Run a world model simulation. Model type: ${modelType}. Horizon: ${horizon}.\n\n` +
        "Return JSON only in this exact format:\n" +
        `{
          "title":"...",
          "summary":"...",
          "confidenceScore":0.68,
          "stabilityIndex":72,
          "opportunityIndex":80,
          "riskIndex":48,
          "assumptions":["..."],
          "findings":{
            "macroOpportunities":["..."],
            "macroRisks":["..."],
            "technologyShifts":["..."],
            "economicShifts":["..."],
            "creatorEconomyImplications":["..."],
            "strategicPositioning":["..."]
          },
          "signals":[
            {
              "signalType":"technology-shift|economic-shift|market-opportunity|governance-risk|social-shift|creator-economy-shift",
              "domain":"technology|economy|society|governance|creator-economy|ai-automation",
              "title":"...",
              "summary":"...",
              "severity":"low|medium|high|critical",
              "relevanceScore":80,
              "confidence":0.7,
              "source":"model-synthesis",
              "payload":{}
            }
          ],
          "scenarios":[
            {
              "title":"...",
              "scenarioType":"optimistic|balanced|risk-heavy|disruptive|transformational",
              "probability":0.55,
              "impactLevel":"low|medium|high|critical",
              "narrative":"...",
              "economicImpact":"...",
              "technologyImpact":"...",
              "socialImpact":"...",
              "governanceImpact":"...",
              "recommendations":["..."]
            }
          ],
          "recommendations":[
            {
              "title":"...",
              "recommendationType":"strategy|market-positioning|economic|governance|technology|creator-growth",
              "priority":"low|medium|high",
              "rationale":"...",
              "executionWindow":"...",
              "expectedBenefit":"...",
              "payload":{}
            }
          ]
        }` +
        "\n\nExternal Signals:\n" + JSON.stringify(externalSignals) +
        "\n\nFederation Signals:\n" + JSON.stringify(federationSignals) +
        "\n\nTemporal Runs:\n" + JSON.stringify(temporalRuns) +
        "\n\nEconomic Runs:\n" + JSON.stringify(economicRuns) +
        "\n\nPrevious World Runs:\n" + JSON.stringify(worldRuns) +
        "\n\nCognitive Insights:\n" + JSON.stringify(cognitiveInsights) +
        "\n\nStrategic Plans:\n" + JSON.stringify(strategicPlans) +
        "\n\nGovernance Risks:\n" + JSON.stringify(governanceRisks) +
        "\n\nRevenue Opportunities:\n" + JSON.stringify(opportunities),
    })

    const parsed = JSON.parse(response.output_text)

    const run = await prisma.worldModelRun.create({
      data: {
        title: parsed.title || "Sovereign World Model Run",
        modelType,
        horizon,
        confidenceScore: parsed.confidenceScore || 0.65,
        stabilityIndex: parsed.stabilityIndex || 70,
        opportunityIndex: parsed.opportunityIndex || 70,
        riskIndex: parsed.riskIndex || 45,
        summary: parsed.summary || null,
        assumptions: parsed.assumptions || [],
        findings: parsed.findings || {},
        status: "completed",
      },
    })

    const savedSignals = []

    for (const item of parsed.signals || []) {
      const signal = await prisma.planetarySignal.create({
        data: {
          signalType: item.signalType || "market-opportunity",
          domain: item.domain || "strategy",
          title: item.title,
          summary: item.summary || null,
          severity: item.severity || "medium",
          relevanceScore:
            typeof item.relevanceScore === "number" ? item.relevanceScore : 50,
          confidence:
            typeof item.confidence === "number" ? item.confidence : 0.65,
          source: item.source || "world-model",
          payload: item.payload || {},
          status: "new",
        },
      })

      savedSignals.push(signal)
    }

    const savedScenarios = []

    for (const item of parsed.scenarios || []) {
      const scenario = await prisma.civilizationScenario.create({
        data: {
          worldModelRunId: run.id,
          title: item.title,
          scenarioType: item.scenarioType || "balanced",
          probability:
            typeof item.probability === "number" ? item.probability : 0.5,
          impactLevel: item.impactLevel || "medium",
          narrative: item.narrative || null,
          economicImpact: item.economicImpact || null,
          technologyImpact: item.technologyImpact || null,
          socialImpact: item.socialImpact || null,
          governanceImpact: item.governanceImpact || null,
          recommendations: item.recommendations || [],
        },
      })

      savedScenarios.push(scenario)
    }

    const savedRecommendations = []

    for (const item of parsed.recommendations || []) {
      const recommendation = await prisma.worldModelRecommendation.create({
        data: {
          worldModelRunId: run.id,
          title: item.title,
          recommendationType: item.recommendationType || "strategy",
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
        type: "world-model-run-completed",
        source: "world-model",
        title: run.title,
        message: run.summary || null,
        severity: run.riskIndex >= 75 ? "critical" : "medium",
        entityType: "WorldModelRun",
        entityId: run.id,
        payload: {
          runId: run.id,
          signalCount: savedSignals.length,
          scenarioCount: savedScenarios.length,
          recommendationCount: savedRecommendations.length,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      run,
      signals: savedSignals,
      scenarios: savedScenarios,
      recommendations: savedRecommendations,
    })
  } catch (error) {
    console.error("World model simulation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "World model simulation failed",
      },
      { status: 500 }
    )
  }
}