import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

export async function GET() {
  try {
    const [
      cycles,
      observations,
      proposals,
      mutations,
      memories,
    ] = await Promise.all([
      prisma.recursiveEvolutionCycle.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.architectureObservation.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
      prisma.selfOptimizationProposal.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
      prisma.institutionalMutation.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      prisma.evolutionMemory.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
    ])

    return NextResponse.json({
      ok: true,
      cycles,
      observations,
      proposals,
      mutations,
      memories,
    })
  } catch (error) {
    console.error("Recursive evolution fetch failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch recursive evolution runtime",
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const [
      federationSessions,
      temporalRuns,
      economicRuns,
      executiveCampaigns,
      cognitiveInsights,
      governanceRisks,
      orchestrationDecisions,
      optimizationActions,
      operationalEvents,
      strategicPlans,
      initiatives,
      runtimeObjectives,
      memories,
    ] = await Promise.all([
      prisma.federationCouncilSession.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.temporalSimulationRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 60,
      }),
      prisma.economicIntelligenceRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 60,
      }),
      prisma.executiveOperationCampaign.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.cognitiveInsight.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
      prisma.governanceRiskSignal.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      prisma.orchestrationDecision.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      prisma.optimizationAction.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      prisma.operationalEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 250,
      }),
      prisma.strategicPlan.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.strategicInitiative.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
      prisma.runtimeObjective.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
      prisma.evolutionMemory.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ])

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Recursive Self-Evolution Engine for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Analyze institutional architecture, identify systemic weaknesses, optimize cognition and propose safe recursive evolution strategies. " +
        "Never recommend unsafe autonomy escalation. Governance must remain supreme. Return valid JSON only.",
      input:
        "Run a recursive institutional evolution cycle.\n\n" +
        "Return JSON only in this exact format:\n" +
        `{
          "title":"...",
          "summary":"...",
          "architectureHealth":82,
          "optimizationScore":78,
          "governanceCoherence":88,
          "operationalEfficiency":76,
          "cognitiveAlignment":84,
          "findings":{
            "architectureStrengths":["..."],
            "systemicWeaknesses":["..."],
            "cognitiveBottlenecks":["..."],
            "governancePressures":["..."],
            "optimizationPathways":["..."]
          },
          "observations":[
            {
              "observationType":"bottleneck|risk|optimization|coordination|governance",
              "title":"...",
              "severity":"low|medium|high|critical",
              "affectedLayer":"...",
              "description":"...",
              "recommendation":"..."
            }
          ],
          "proposals":[
            {
              "proposalType":"architecture|governance|operations|cognition|economics",
              "title":"...",
              "rationale":"...",
              "expectedBenefit":"...",
              "implementationRisk":"low|medium|high",
              "targetSystem":"...",
              "payload":{},
              "executionPlan":[]
            }
          ],
          "mutations":[
            {
              "mutationType":"structural|governance|memory|coordination|optimization",
              "title":"...",
              "description":"...",
              "targetLayer":"...",
              "strategicImpact":"...",
              "riskLevel":"low|medium|high",
              "payload":{}
            }
          ],
          "memories":[
            {
              "memoryType":"evolution-insight|governance-learning|optimization-pattern",
              "title":"...",
              "insight":"...",
              "confidence":0.75,
              "priority":"low|medium|high"
            }
          ]
        }` +
        "\n\nFederation Sessions:\n" + JSON.stringify(federationSessions) +
        "\n\nTemporal Runs:\n" + JSON.stringify(temporalRuns) +
        "\n\nEconomic Runs:\n" + JSON.stringify(economicRuns) +
        "\n\nExecutive Campaigns:\n" + JSON.stringify(executiveCampaigns) +
        "\n\nCognitive Insights:\n" + JSON.stringify(cognitiveInsights) +
        "\n\nGovernance Risks:\n" + JSON.stringify(governanceRisks) +
        "\n\nOrchestration Decisions:\n" + JSON.stringify(orchestrationDecisions) +
        "\n\nOptimization Actions:\n" + JSON.stringify(optimizationActions) +
        "\n\nOperational Events:\n" + JSON.stringify(operationalEvents) +
        "\n\nStrategic Plans:\n" + JSON.stringify(strategicPlans) +
        "\n\nInitiatives:\n" + JSON.stringify(initiatives) +
        "\n\nRuntime Objectives:\n" + JSON.stringify(runtimeObjectives) +
        "\n\nEvolution Memories:\n" + JSON.stringify(memories),
    })

    const parsed = JSON.parse(response.output_text)

    const cycle = await prisma.recursiveEvolutionCycle.create({
      data: {
        title: parsed.title || "Recursive Evolution Cycle",
        cycleType: "institutional-self-evolution",
        architectureHealth: parsed.architectureHealth || 75,
        optimizationScore: parsed.optimizationScore || 75,
        governanceCoherence: parsed.governanceCoherence || 75,
        operationalEfficiency: parsed.operationalEfficiency || 75,
        cognitiveAlignment: parsed.cognitiveAlignment || 75,
        summary: parsed.summary || null,
        findings: parsed.findings || {},
        status: "completed",
      },
    })

    const savedObservations = []

    for (const item of parsed.observations || []) {
      const observation = await prisma.architectureObservation.create({
        data: {
          evolutionCycleId: cycle.id,
          observationType: item.observationType || "optimization",
          title: item.title,
          severity: item.severity || "medium",
          affectedLayer: item.affectedLayer || null,
          description: item.description || null,
          recommendation: item.recommendation || null,
          metadata: {},
        },
      })

      savedObservations.push(observation)
    }

    const savedProposals = []

    for (const item of parsed.proposals || []) {
      const proposal = await prisma.selfOptimizationProposal.create({
        data: {
          evolutionCycleId: cycle.id,
          proposalType: item.proposalType || "architecture",
          title: item.title,
          rationale: item.rationale || null,
          expectedBenefit: item.expectedBenefit || null,
          implementationRisk: item.implementationRisk || "medium",
          targetSystem: item.targetSystem || null,
          payload: item.payload || {},
          executionPlan: item.executionPlan || [],
          status: "proposed",
        },
      })

      savedProposals.push(proposal)
    }

    const savedMutations = []

    for (const item of parsed.mutations || []) {
      const mutation = await prisma.institutionalMutation.create({
        data: {
          mutationType: item.mutationType || "optimization",
          title: item.title,
          description: item.description || null,
          targetLayer: item.targetLayer || null,
          strategicImpact: item.strategicImpact || null,
          riskLevel: item.riskLevel || "medium",
          payload: item.payload || {},
          status: "simulated",
        },
      })

      savedMutations.push(mutation)
    }

    const savedMemories = []

    for (const item of parsed.memories || []) {
      const memory = await prisma.evolutionMemory.create({
        data: {
          memoryType: item.memoryType || "evolution-insight",
          title: item.title,
          insight: item.insight,
          confidence: item.confidence || 0.7,
          priority: item.priority || "medium",
          sourceCycleId: cycle.id,
          metadata: {},
        },
      })

      savedMemories.push(memory)
    }

    await prisma.operationalEvent.create({
      data: {
        type: "recursive-evolution-cycle",
        source: "recursive-evolution-engine",
        title: cycle.title,
        message: cycle.summary || null,
        severity:
          cycle.architectureHealth <= 45 ? "critical" : "medium",
        entityType: "RecursiveEvolutionCycle",
        entityId: cycle.id,
        payload: {
          cycleId: cycle.id,
          proposalCount: savedProposals.length,
          mutationCount: savedMutations.length,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      cycle,
      observations: savedObservations,
      proposals: savedProposals,
      mutations: savedMutations,
      memories: savedMemories,
    })
  } catch (error) {
    console.error("Recursive evolution cycle failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Recursive evolution cycle failed",
      },
      { status: 500 }
    )
  }
}