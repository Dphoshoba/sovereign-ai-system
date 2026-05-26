import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

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

export async function GET() {
  try {
    const [runs, proposals, agents, workflows, memories] = await Promise.all([
      prisma.evolutionOptimizationRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.evolutionImprovementProposal.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.agentPerformanceProfile.findMany({
        orderBy: { updatedAt: "desc" },
        take: 100,
      }),
      prisma.workflowEvolutionPattern.findMany({
        orderBy: { updatedAt: "desc" },
        take: 100,
      }),
      prisma.institutionalEvolutionMemory.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
    ])

    return NextResponse.json({
      ok: true,
      runs,
      proposals,
      agents,
      workflows,
      memories,
    })
  } catch (error) {
    console.error("Evolution engine fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch evolution engine" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const { org, workspace } = await getDefaultTenant()

    const [
      missions,
      steps,
      assignments,
      outcomes,
      reasoningRuns,
      recommendations,
      semanticRecords,
      graphNodes,
      governanceRequests,
      billingRuns,
      operationalEvents,
    ] = await Promise.all([
      prisma.actionMission.findMany({
        orderBy: { updatedAt: "desc" },
        take: 120,
      }),
      prisma.actionExecutionStep.findMany({
        orderBy: { updatedAt: "desc" },
        take: 200,
      }),
      prisma.agentExecutionAssignment.findMany({
        orderBy: { updatedAt: "desc" },
        take: 200,
      }),
      prisma.actionOutcomeRecord.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      prisma.reasoningSimulationRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.reasoningRecommendation.findMany({
        orderBy: { updatedAt: "desc" },
        take: 120,
      }),
      prisma.semanticKnowledgeRecord.findMany({
        where: {
          organizationId: org?.id || undefined,
          status: "active",
        },
        orderBy: [{ importance: "desc" }, { createdAt: "desc" }],
        take: 160,
      }),
      prisma.knowledgeGraphNode.findMany({
        where: {
          organizationId: org?.id || undefined,
          status: "active",
        },
        orderBy: { importance: "desc" },
        take: 120,
      }),
      prisma.executionAuthorizationRequest.findMany({
        orderBy: { updatedAt: "desc" },
        take: 120,
      }),
      prisma.billingIntelligenceRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 60,
      }),
      prisma.operationalEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ])

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Recursive Self-Optimization Engine for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Analyze missions, workflows, agent assignments, governance pressure, operational outcomes and semantic memory to identify institutional inefficiencies and optimization opportunities. " +
        "Return valid JSON only.",
      input:
        "Run institutional self-optimization analysis.\n\n" +
        "Return JSON only in this exact format:\n" +
        `{
          "title":"...",
          "summary":"...",
          "optimizationHealth":82,
          "adaptationScore":78,
          "institutionalMaturity":58,
          "executionEfficiency":71,
          "governanceAlignment":80,
          "findings":{
            "highLeverageImprovements":["..."],
            "workflowBottlenecks":["..."],
            "agentWeaknesses":["..."],
            "systemStrengths":["..."],
            "governancePressure":["..."],
            "nextEvolutionMoves":["..."]
          },
          "proposals":[
            {
              "proposalType":"workflow|governance|memory|agent|billing|operations|reasoning|execution",
              "targetLayer":"...",
              "title":"...",
              "description":"...",
              "expectedImpact":"...",
              "riskLevel":"low|medium|high|critical",
              "optimizationValue":82,
              "implementationEffort":40,
              "payload":{}
            }
          ],
          "agents":[
            {
              "agentName":"...",
              "agentRole":"...",
              "coordinationScore":72,
              "reliabilityScore":68,
              "executionScore":75,
              "governanceScore":80,
              "adaptationScore":70,
              "strengths":["..."],
              "weaknesses":["..."],
              "recommendations":["..."]
            }
          ],
          "workflows":[
            {
              "workflowName":"...",
              "workflowType":"...",
              "bottleneckRisk":52,
              "efficiencyScore":61,
              "automationPotential":88,
              "governancePressure":44,
              "optimizationSuggestion":"...",
              "payload":{}
            }
          ],
          "memories":[
            {
              "evolutionType":"optimization|adaptation|governance|workflow|agent-learning",
              "title":"...",
              "summary":"...",
              "improvementDelta":12,
              "impactArea":"...",
              "payload":{}
            }
          ]
        }` +
        "\n\nMissions:\n" + JSON.stringify(missions) +
        "\n\nExecution Steps:\n" + JSON.stringify(steps) +
        "\n\nAssignments:\n" + JSON.stringify(assignments) +
        "\n\nOutcomes:\n" + JSON.stringify(outcomes) +
        "\n\nReasoning Runs:\n" + JSON.stringify(reasoningRuns) +
        "\n\nRecommendations:\n" + JSON.stringify(recommendations) +
        "\n\nSemantic Records:\n" + JSON.stringify(semanticRecords) +
        "\n\nGraph Nodes:\n" + JSON.stringify(graphNodes) +
        "\n\nGovernance Requests:\n" + JSON.stringify(governanceRequests) +
        "\n\nBilling Runs:\n" + JSON.stringify(billingRuns) +
        "\n\nOperational Events:\n" + JSON.stringify(operationalEvents),
    })

    const parsed = JSON.parse(response.output_text)

    const run = await prisma.evolutionOptimizationRun.create({
      data: {
        organizationId: org?.id || null,
        workspaceId: workspace?.id || null,
        title: parsed.title || "Institutional Evolution Run",
        summary: parsed.summary || null,
        optimizationHealth: parsed.optimizationHealth || 75,
        adaptationScore: parsed.adaptationScore || 75,
        institutionalMaturity: parsed.institutionalMaturity || 45,
        executionEfficiency: parsed.executionEfficiency || 60,
        governanceAlignment: parsed.governanceAlignment || 70,
        findings: parsed.findings || {},
        status: "completed",
      },
    })

    for (const item of parsed.proposals || []) {
      await prisma.evolutionImprovementProposal.create({
        data: {
          runId: run.id,
          proposalType: item.proposalType || "workflow",
          targetLayer: item.targetLayer || "operations",
          title: item.title,
          description: item.description || null,
          expectedImpact: item.expectedImpact || null,
          riskLevel: item.riskLevel || "medium",
          optimizationValue: item.optimizationValue || 70,
          implementationEffort: item.implementationEffort || 45,
          payload: item.payload || {},
          status: "proposed",
        },
      })
    }

    for (const item of parsed.agents || []) {
      const existing = await prisma.agentPerformanceProfile.findFirst({
        where: {
          agentName: item.agentName,
          agentRole: item.agentRole,
        },
      })

      if (existing) {
        await prisma.agentPerformanceProfile.update({
          where: { id: existing.id },
          data: {
            coordinationScore: item.coordinationScore || 70,
            reliabilityScore: item.reliabilityScore || 70,
            executionScore: item.executionScore || 70,
            governanceScore: item.governanceScore || 70,
            adaptationScore: item.adaptationScore || 70,
            strengths: item.strengths || [],
            weaknesses: item.weaknesses || [],
            recommendations: item.recommendations || [],
            lastEvaluatedAt: new Date(),
          },
        })
      } else {
        await prisma.agentPerformanceProfile.create({
          data: {
            agentName: item.agentName,
            agentRole: item.agentRole || "execution-agent",
            coordinationScore: item.coordinationScore || 70,
            reliabilityScore: item.reliabilityScore || 70,
            executionScore: item.executionScore || 70,
            governanceScore: item.governanceScore || 70,
            adaptationScore: item.adaptationScore || 70,
            strengths: item.strengths || [],
            weaknesses: item.weaknesses || [],
            recommendations: item.recommendations || [],
            lastEvaluatedAt: new Date(),
          },
        })
      }
    }

    for (const item of parsed.workflows || []) {
      const existing = await prisma.workflowEvolutionPattern.findFirst({
        where: {
          workflowName: item.workflowName,
        },
      })

      if (existing) {
        await prisma.workflowEvolutionPattern.update({
          where: { id: existing.id },
          data: {
            workflowType: item.workflowType || "operations",
            bottleneckRisk: item.bottleneckRisk || 40,
            efficiencyScore: item.efficiencyScore || 65,
            automationPotential: item.automationPotential || 75,
            governancePressure: item.governancePressure || 35,
            optimizationSuggestion: item.optimizationSuggestion || null,
            payload: item.payload || {},
          },
        })
      } else {
        await prisma.workflowEvolutionPattern.create({
          data: {
            workflowName: item.workflowName,
            workflowType: item.workflowType || "operations",
            bottleneckRisk: item.bottleneckRisk || 40,
            efficiencyScore: item.efficiencyScore || 65,
            automationPotential: item.automationPotential || 75,
            governancePressure: item.governancePressure || 35,
            optimizationSuggestion: item.optimizationSuggestion || null,
            payload: item.payload || {},
          },
        })
      }
    }

    for (const item of parsed.memories || []) {
      await prisma.institutionalEvolutionMemory.create({
        data: {
          evolutionType: item.evolutionType || "optimization",
          title: item.title,
          summary: item.summary || null,
          improvementDelta: item.improvementDelta || 0,
          impactArea: item.impactArea || "operations",
          payload: item.payload || {},
        },
      })
    }

    await prisma.operationalEvent.create({
      data: {
        type: "institutional-evolution-run",
        source: "evolution-engine",
        title: run.title,
        message: run.summary || null,
        severity:
          run.optimizationHealth <= 45
            ? "high"
            : run.optimizationHealth <= 65
              ? "medium"
              : "low",
        entityType: "EvolutionOptimizationRun",
        entityId: run.id,
        payload: {
          runId: run.id,
          adaptationScore: run.adaptationScore,
          institutionalMaturity: run.institutionalMaturity,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      run,
    })
  } catch (error) {
    console.error("Evolution optimization failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Evolution optimization failed",
      },
      { status: 500 }
    )
  }
}