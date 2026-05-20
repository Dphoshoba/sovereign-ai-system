import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET() {
  try {
    const [entities, relations, runs, insights] = await Promise.all([
      prisma.cognitiveEntity.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.cognitiveRelation.findMany({
        orderBy: { createdAt: "desc" },
        take: 300,
      }),
      prisma.cognitiveSynthesisRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.cognitiveInsight.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
    ])

    return NextResponse.json({
      ok: true,
      entities,
      relations,
      runs,
      insights,
    })
  } catch (error) {
    console.error("Cognitive fabric fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch cognitive fabric" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const [
      events,
      workflows,
      workflowActions,
      missions,
      plans,
      initiatives,
      decisions,
      externalSignals,
      scans,
      governanceRisks,
      governanceApprovals,
      evolutionInsights,
      runtimeSnapshots,
      emails,
      forecasts,
      memories,
    ] = await Promise.all([
      prisma.operationalEvent.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.workflowExecution.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.workflowAction.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.autonomousMissionTask.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.strategicPlan.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
      prisma.strategicInitiative.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.strategicDecisionLog.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.externalIntelligenceSignal.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.externalWorldScan.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
      prisma.governanceRiskSignal.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.governanceApproval.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.evolutionInsight.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.runtimeMemorySnapshot.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
      prisma.emailExecution.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.predictiveForecast.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
      prisma.creatorLearningMemory.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ])

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Unified Cognitive Fabric for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Build a semantic intelligence graph across systems. Identify entities, relationships, causal chains and cross-system insights. Return valid JSON only.",
      input:
        "Synthesize this organization into a cross-system intelligence graph.\n\n" +
        "Return JSON only in this exact format:\n" +
        `{
          "title":"...",
          "summary":"...",
          "graphHealth":82,
          "findings":{
            "strongConnections":["..."],
            "weakConnections":["..."],
            "causalChains":["..."],
            "missingContext":["..."]
          },
          "entities":[
            {
              "entityType":"event|workflow|mission|strategy|initiative|signal|risk|email|forecast|memory|governance|runtime",
              "entityId":"...",
              "name":"...",
              "summary":"...",
              "importance":75,
              "metadata":{}
            }
          ],
          "relations":[
            {
              "sourceName":"...",
              "targetName":"...",
              "relationType":"causes|supports|blocks|escalates|depends-on|informs|mitigates|triggers|contradicts",
              "strength":0.8,
              "summary":"...",
              "evidence":{}
            }
          ],
          "insights":[
            {
              "title":"...",
              "insight":"...",
              "insightType":"causal|strategic|risk|opportunity|coordination|memory-gap",
              "priority":"low|medium|high",
              "confidence":0.75,
              "relatedEntities":["..."]
            }
          ]
        }` +
        "\n\nEvents:\n" + JSON.stringify(events) +
        "\n\nWorkflows:\n" + JSON.stringify(workflows) +
        "\n\nWorkflow Actions:\n" + JSON.stringify(workflowActions) +
        "\n\nMissions:\n" + JSON.stringify(missions) +
        "\n\nStrategic Plans:\n" + JSON.stringify(plans) +
        "\n\nInitiatives:\n" + JSON.stringify(initiatives) +
        "\n\nStrategic Decisions:\n" + JSON.stringify(decisions) +
        "\n\nExternal Signals:\n" + JSON.stringify(externalSignals) +
        "\n\nExternal Scans:\n" + JSON.stringify(scans) +
        "\n\nGovernance Risks:\n" + JSON.stringify(governanceRisks) +
        "\n\nGovernance Approvals:\n" + JSON.stringify(governanceApprovals) +
        "\n\nEvolution Insights:\n" + JSON.stringify(evolutionInsights) +
        "\n\nRuntime Snapshots:\n" + JSON.stringify(runtimeSnapshots) +
        "\n\nEmails:\n" + JSON.stringify(emails) +
        "\n\nForecasts:\n" + JSON.stringify(forecasts) +
        "\n\nStrategic Memories:\n" + JSON.stringify(memories),
    })

    const parsed = JSON.parse(response.output_text)

    const run = await prisma.cognitiveSynthesisRun.create({
      data: {
        title: parsed.title || "Cognitive Fabric Synthesis",
        summary: parsed.summary || null,
        graphHealth:
          typeof parsed.graphHealth === "number" ? parsed.graphHealth : 75,
        findings: parsed.findings || {},
        status: "completed",
      },
    })

    const entityMap = new Map<string, string>()

    for (const item of parsed.entities || []) {
      const entity = await prisma.cognitiveEntity.create({
        data: {
          entityType: item.entityType || "unknown",
          entityId: item.entityId || null,
          name: item.name,
          summary: item.summary || null,
          importance:
            typeof item.importance === "number" ? item.importance : 50,
          metadata: item.metadata || {},
          status: "active",
        },
      })

      entityMap.set(item.name, entity.id)
    }

    for (const item of parsed.relations || []) {
      const sourceEntityId = entityMap.get(item.sourceName)
      const targetEntityId = entityMap.get(item.targetName)

      if (!sourceEntityId || !targetEntityId) continue

      await prisma.cognitiveRelation.create({
        data: {
          sourceEntityId,
          targetEntityId,
          relationType: item.relationType || "informs",
          strength:
            typeof item.strength === "number" ? item.strength : 0.5,
          summary: item.summary || null,
          evidence: item.evidence || {},
        },
      })
    }

    const savedInsights = []

    for (const item of parsed.insights || []) {
      const insight = await prisma.cognitiveInsight.create({
        data: {
          runId: run.id,
          title: item.title,
          insight: item.insight,
          insightType: item.insightType || "strategic",
          priority: item.priority || "medium",
          confidence:
            typeof item.confidence === "number" ? item.confidence : 0.7,
          relatedEntities: item.relatedEntities || [],
          status: "active",
        },
      })

      savedInsights.push(insight)
    }

    await prisma.operationalEvent.create({
      data: {
        type: "cognitive-fabric-synthesis",
        source: "cognitive-fabric",
        title: run.title,
        message: run.summary || null,
        severity: run.graphHealth < 55 ? "high" : "medium",
        entityType: "CognitiveSynthesisRun",
        entityId: run.id,
        payload: {
          runId: run.id,
          graphHealth: run.graphHealth,
          insightCount: savedInsights.length,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      run,
      insights: savedInsights,
    })
  } catch (error) {
    console.error("Cognitive fabric synthesis failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Cognitive fabric synthesis failed",
      },
      { status: 500 }
    )
  }
}