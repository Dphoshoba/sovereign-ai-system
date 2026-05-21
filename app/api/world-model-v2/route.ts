import { NextResponse } from "next/server"
import OpenAI from "openai"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"
import {
  PLANETARY_DOMAINS,
  STRESS_SCENARIO_TYPES,
  STRATEGIC_SHOCK_TYPES,
  WORLD_MODEL_V2_JSON_SCHEMA,
  clampScore,
  computeCompositeScore,
  priorityFromScores,
  requiresPlanetaryApproval,
} from "@/lib/ai/world-model-v2"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function getDefaultTenant() {
  const org = await prisma.sovereignOrganization.findUnique({
    where: { slug: "echoes-visions" },
  })

  const workspace = org
    ? await prisma.organizationWorkspace.findFirst({
        where: { organizationId: org.id },
        orderBy: { createdAt: "asc" },
      })
    : null

  return { org, workspace }
}

async function persistKnowledgeFromRun(
  orgId: string | null | undefined,
  workspaceId: string | null | undefined,
  run: { id: string; title: string; summary: string | null; findings: unknown }
) {
  if (!orgId) return

  await prisma.semanticKnowledgeRecord.create({
    data: {
      organizationId: orgId,
      workspaceId: workspaceId || null,
      title: `World Model V2: ${run.title}`,
      content:
        run.summary ||
        "Planetary strategic simulation completed by Sovereign World Model V2.",
      recordType: "world-model-v2",
      sourceLayer: "world-model-v2",
      sourceType: "WorldModelV2Run",
      sourceId: run.id,
      importance: 78,
      confidence: 0.75,
      tags: ["planetary", "strategy", "world-model-v2"],
      metadata: {
        runId: run.id,
        findings: run.findings ?? null,
      } as Prisma.InputJsonValue,
      status: "active",
    },
  })

  await prisma.knowledgeGraphNode.create({
    data: {
      organizationId: orgId,
      workspaceId: workspaceId || null,
      nodeType: "world-model-run",
      name: run.title,
      summary: run.summary,
      importance: 78,
      status: "active",
      metadata: { runId: run.id, engine: "world-model-v2" },
    },
  })
}

export async function GET() {
  try {
    const [
      runs,
      domainSignals,
      scenarios,
      stressTests,
      shocks,
      postures,
      recommendations,
    ] = await Promise.all([
      prisma.worldModelV2Run.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.planetaryDomainSignal.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.planetaryScenarioV2.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      prisma.planetaryStressTest.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      prisma.strategicShockModel.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.strategicPostureModel.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.planetaryRecommendationV2.findMany({
        orderBy: { updatedAt: "desc" },
        take: 150,
      }),
    ])

    return NextResponse.json({
      ok: true,
      runs,
      domainSignals,
      scenarios,
      stressTests,
      shocks,
      postures,
      recommendations,
      domains: PLANETARY_DOMAINS,
      stressTypes: STRESS_SCENARIO_TYPES,
      shockTypes: STRATEGIC_SHOCK_TYPES,
    })
  } catch (error) {
    console.error("World model V2 fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch world model V2" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const horizon = body.horizon || "12-months"
    const focusDomains: string[] = body.focusDomains || []

    const { org, workspace } = await getDefaultTenant()

    const [
      graphNodes,
      graphEdges,
      semanticRecords,
      reasoningRuns,
      reasoningRecommendations,
      actionMissions,
      actionOutcomes,
      evolutionRuns,
      evolutionProposals,
      meshNodes,
      meshPackets,
      billingRuns,
      governanceRisks,
      authRequests,
      worldV1Runs,
      planetarySignals,
      operationalEvents,
    ] = await Promise.all([
      prisma.knowledgeGraphNode.findMany({
        where: { organizationId: org?.id || undefined, status: "active" },
        orderBy: { importance: "desc" },
        take: 140,
      }),
      prisma.knowledgeGraphEdge.findMany({
        where: { organizationId: org?.id || undefined, status: "active" },
        orderBy: { strength: "desc" },
        take: 180,
      }),
      prisma.semanticKnowledgeRecord.findMany({
        where: { organizationId: org?.id || undefined, status: "active" },
        orderBy: [{ importance: "desc" }, { createdAt: "desc" }],
        take: 140,
      }),
      prisma.reasoningSimulationRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 60,
      }),
      prisma.reasoningRecommendation.findMany({
        orderBy: { updatedAt: "desc" },
        take: 80,
      }),
      prisma.actionMission.findMany({
        orderBy: { updatedAt: "desc" },
        take: 80,
      }),
      prisma.actionOutcomeRecord.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.evolutionOptimizationRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 60,
      }),
      prisma.evolutionImprovementProposal.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.federatedMeshNode.findMany({
        orderBy: { trustScore: "desc" },
        take: 40,
      }),
      prisma.federatedIntelligencePacket.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.billingIntelligenceRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 60,
      }),
      prisma.governanceRiskSignal.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.executionAuthorizationRequest.findMany({
        where: { status: "pending" },
        orderBy: { createdAt: "desc" },
        take: 60,
      }),
      prisma.worldModelRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.planetarySignal.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.operationalEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ])

    const domainList =
      focusDomains.length > 0
        ? focusDomains.join(", ")
        : PLANETARY_DOMAINS.join(", ")

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Sovereign World Model Engine V2 for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Model planetary domains, stress scenarios, strategic shocks, and scored recommendations using supplied intelligence layers. " +
        "Cover all eight planetary domains, eight stress scenario types, and seven strategic shock types. " +
        "High planetary risk or governance-sensitive recommendations must set requiredApproval to true. " +
        "Do not invent current facts. Mark assumptions clearly. Return valid JSON only.",
      input:
        `Run a planetary world model V2 simulation. Horizon: ${horizon}. Focus domains: ${domainList}.\n\n` +
        "Return JSON only in this exact format:\n" +
        WORLD_MODEL_V2_JSON_SCHEMA +
        "\n\nKnowledge Graph Nodes:\n" +
        JSON.stringify(graphNodes) +
        "\n\nKnowledge Graph Edges:\n" +
        JSON.stringify(graphEdges) +
        "\n\nSemantic Memory:\n" +
        JSON.stringify(semanticRecords) +
        "\n\nReasoning Runs:\n" +
        JSON.stringify(reasoningRuns) +
        "\n\nReasoning Recommendations:\n" +
        JSON.stringify(reasoningRecommendations) +
        "\n\nAction Missions:\n" +
        JSON.stringify(actionMissions) +
        "\n\nAction Outcomes:\n" +
        JSON.stringify(actionOutcomes) +
        "\n\nEvolution Runs:\n" +
        JSON.stringify(evolutionRuns) +
        "\n\nEvolution Proposals:\n" +
        JSON.stringify(evolutionProposals) +
        "\n\nFederated Mesh Nodes:\n" +
        JSON.stringify(meshNodes) +
        "\n\nFederation Packets:\n" +
        JSON.stringify(meshPackets) +
        "\n\nBilling Intelligence:\n" +
        JSON.stringify(billingRuns) +
        "\n\nGovernance Risks:\n" +
        JSON.stringify(governanceRisks) +
        "\n\nPending Authorizations:\n" +
        JSON.stringify(authRequests) +
        "\n\nWorld Model V1 Runs:\n" +
        JSON.stringify(worldV1Runs) +
        "\n\nPlanetary Signals V1:\n" +
        JSON.stringify(planetarySignals) +
        "\n\nOperational Events:\n" +
        JSON.stringify(operationalEvents),
    })

    const parsed = JSON.parse(response.output_text)

    const run = await prisma.worldModelV2Run.create({
      data: {
        title: parsed.title || "Sovereign World Model V2 Run",
        horizon,
        confidenceScore: parsed.confidenceScore || 0.7,
        planetaryStability: parsed.planetaryStability || 70,
        opportunityIndex: parsed.opportunityIndex || 75,
        systemicRiskIndex: parsed.systemicRiskIndex || 40,
        strategicReadiness: parsed.strategicReadiness || 70,
        summary: parsed.summary || null,
        assumptions: parsed.assumptions || [],
        findings: parsed.findings || {},
        status: "completed",
      },
    })

    const savedDomainSignals = []
    for (const item of parsed.domainSignals || []) {
      const signal = await prisma.planetaryDomainSignal.create({
        data: {
          runId: run.id,
          domain: item.domain || "ai-economy",
          signalType: item.signalType || "shift",
          title: item.title,
          summary: item.summary || null,
          severity: item.severity || "medium",
          probability: typeof item.probability === "number" ? item.probability : 0.5,
          impactScore: clampScore(item.impactScore, 50),
          sourceLayer: item.sourceLayer || "synthesis",
          payload: item.payload || {},
        },
      })
      savedDomainSignals.push(signal)
    }

    const savedScenarios = []
    for (const item of parsed.scenarios || []) {
      const scenario = await prisma.planetaryScenarioV2.create({
        data: {
          runId: run.id,
          title: item.title,
          scenarioType: item.scenarioType || "balanced",
          probability: typeof item.probability === "number" ? item.probability : 0.5,
          impactLevel: item.impactLevel || "medium",
          narrative: item.narrative || null,
          risks: item.risks || [],
          opportunities: item.opportunities || [],
          strategicMoves: item.strategicMoves || [],
        },
      })
      savedScenarios.push(scenario)
    }

    const savedStressTests = []
    for (const item of parsed.stressTests || []) {
      const test = await prisma.planetaryStressTest.create({
        data: {
          runId: run.id,
          title: item.title,
          stressType: item.stressType || "balanced",
          severity: item.severity || "medium",
          resilienceScore: clampScore(item.resilienceScore, 70),
          description: item.description || null,
          mitigation: item.mitigation || null,
          payload: item.payload || {},
        },
      })
      savedStressTests.push(test)
    }

    const savedShocks = []
    for (const item of parsed.shocks || []) {
      const shock = await prisma.strategicShockModel.create({
        data: {
          runId: run.id,
          title: item.title,
          shockType: item.shockType || "regulation-change",
          severity: item.severity || "medium",
          probability: typeof item.probability === "number" ? item.probability : 0.5,
          impactScore: clampScore(item.impactScore, 50),
          timeHorizon: item.timeHorizon || "near-term",
          narrative: item.narrative || null,
          responsePlan: item.responsePlan || null,
          payload: item.payload || {},
        },
      })
      savedShocks.push(shock)
    }

    const savedPostures = []
    for (const item of parsed.postures || []) {
      const posture = await prisma.strategicPostureModel.create({
        data: {
          runId: run.id,
          title: item.title,
          postureType: item.postureType || "balanced",
          readinessScore: clampScore(item.readinessScore, 70),
          riskExposure: clampScore(item.riskExposure, 40),
          upsidePotential: clampScore(item.upsidePotential, 75),
          recommendation: item.recommendation || null,
          payload: item.payload || {},
        },
      })
      savedPostures.push(posture)
    }

    const savedRecommendations = []
    for (const item of parsed.recommendations || []) {
      const scores = {
        urgencyScore: item.urgencyScore,
        opportunityScore: item.opportunityScore,
        riskScore: item.riskScore,
        costPressureScore: item.costPressureScore,
        executionDifficultyScore: item.executionDifficultyScore,
        governanceSensitivityScore: item.governanceSensitivityScore,
        confidenceScore: item.confidenceScore,
      }

      const compositeScore = computeCompositeScore(scores)
      const needsApproval = requiresPlanetaryApproval(
        scores,
        typeof item.requiredApproval === "boolean" ? item.requiredApproval : undefined
      )

      const recommendation = await prisma.planetaryRecommendationV2.create({
        data: {
          runId: run.id,
          title: item.title,
          recommendationType: item.recommendationType || "strategy",
          priority:
            item.priority || priorityFromScores(scores, compositeScore),
          rationale: item.rationale || null,
          expectedOutcome: item.expectedOutcome || null,
          urgencyScore: clampScore(scores.urgencyScore, 50),
          opportunityScore: clampScore(scores.opportunityScore, 50),
          riskScore: clampScore(scores.riskScore, 40),
          costPressureScore: clampScore(scores.costPressureScore, 40),
          executionDifficultyScore: clampScore(scores.executionDifficultyScore, 50),
          governanceSensitivityScore: clampScore(
            scores.governanceSensitivityScore,
            40
          ),
          confidenceScore:
            typeof item.confidenceScore === "number"
              ? item.confidenceScore
              : 0.7,
          compositeScore,
          requiredApproval: needsApproval,
          payload: item.payload || {},
          status: "proposed",
        },
      })

      savedRecommendations.push(recommendation)
    }

    await persistKnowledgeFromRun(org?.id, workspace?.id, run)

    await prisma.operationalEvent.create({
      data: {
        type: "world-model-v2-run-completed",
        source: "world-model-v2",
        title: run.title,
        message: run.summary || null,
        severity:
          run.systemicRiskIndex >= 75
            ? "critical"
            : run.systemicRiskIndex >= 55
              ? "high"
              : "medium",
        entityType: "WorldModelV2Run",
        entityId: run.id,
        payload: {
          runId: run.id,
          domainSignalCount: savedDomainSignals.length,
          scenarioCount: savedScenarios.length,
          stressTestCount: savedStressTests.length,
          shockCount: savedShocks.length,
          recommendationCount: savedRecommendations.length,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      run,
      domainSignals: savedDomainSignals,
      scenarios: savedScenarios,
      stressTests: savedStressTests,
      shocks: savedShocks,
      postures: savedPostures,
      recommendations: savedRecommendations,
    })
  } catch (error) {
    console.error("World model V2 simulation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "World model V2 simulation failed",
      },
      { status: 500 }
    )
  }
}
