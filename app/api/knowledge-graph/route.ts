import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

function hashText(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex")
}

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
    const [records, indexes, nodes, edges, queries, runs] = await Promise.all([
      prisma.semanticKnowledgeRecord.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.semanticEmbeddingIndex.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.knowledgeGraphNode.findMany({
        orderBy: { importance: "desc" },
        take: 200,
      }),
      prisma.knowledgeGraphEdge.findMany({
        orderBy: { strength: "desc" },
        take: 250,
      }),
      prisma.semanticMemoryQuery.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.knowledgeGraphSynthesisRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ])

    return NextResponse.json({
      ok: true,
      records,
      indexes,
      nodes,
      edges,
      queries,
      runs,
    })
  } catch (error) {
    console.error("Knowledge graph fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch knowledge graph" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const { org, workspace } = await getDefaultTenant()

    const [
      tenantRecords,
      cognitiveInsights,
      strategicPlans,
      sovereignSnapshots,
      billingRuns,
      governanceRisks,
      worldRuns,
      temporalRuns,
      realtimeMessages,
      operationalEvents,
    ] = await Promise.all([
      prisma.tenantIntelligenceRecord.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.cognitiveInsight.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.strategicPlan.findMany({
        orderBy: { createdAt: "desc" },
        take: 60,
      }),
      prisma.sovereignRuntimeSnapshot.findMany({
        orderBy: { createdAt: "desc" },
        take: 60,
      }),
      prisma.billingIntelligenceRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.governanceRiskSignal.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.worldModelRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.temporalSimulationRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.realtimeEventMessage.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.operationalEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
    ])

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Sovereign Knowledge Graph and Semantic Memory Fabric for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Convert institutional data into tenant-scoped knowledge records, semantic graph nodes, relationships and retrieval-ready memory. Return valid JSON only.",
      input:
        "Synthesize sovereign institutional memory.\n\n" +
        "Return JSON only in this exact format:\n" +
        `{
          "title":"...",
          "summary":"...",
          "graphHealth":82,
          "memoryHealth":80,
          "retrievalHealth":78,
          "findings":{
            "memoryStrengths":["..."],
            "memoryGaps":["..."],
            "importantEntities":["..."],
            "criticalRelationships":["..."],
            "retrievalRecommendations":["..."]
          },
          "records":[
            {
              "title":"...",
              "content":"...",
              "recordType":"strategy|governance|billing|runtime|tenant|world-model|temporal|event|memory",
              "sourceLayer":"...",
              "sourceType":"...",
              "sourceId":"...",
              "importance":75,
              "confidence":0.8,
              "tags":["..."],
              "metadata":{}
            }
          ],
          "nodes":[
            {
              "nodeType":"organization|system|risk|strategy|policy|event|market|billing|tenant|workflow|decision",
              "name":"...",
              "summary":"...",
              "importance":75,
              "sourceRecordTitle":"...",
              "metadata":{}
            }
          ],
          "edges":[
            {
              "sourceName":"...",
              "targetName":"...",
              "relationType":"causes|supports|depends-on|blocks|informs|governs|routes-to|monetizes|risks",
              "strength":0.75,
              "summary":"...",
              "evidence":{}
            }
          ]
        }` +
        "\n\nTenant Records:\n" + JSON.stringify(tenantRecords) +
        "\n\nCognitive Insights:\n" + JSON.stringify(cognitiveInsights) +
        "\n\nStrategic Plans:\n" + JSON.stringify(strategicPlans) +
        "\n\nSovereign Snapshots:\n" + JSON.stringify(sovereignSnapshots) +
        "\n\nBilling Runs:\n" + JSON.stringify(billingRuns) +
        "\n\nGovernance Risks:\n" + JSON.stringify(governanceRisks) +
        "\n\nWorld Runs:\n" + JSON.stringify(worldRuns) +
        "\n\nTemporal Runs:\n" + JSON.stringify(temporalRuns) +
        "\n\nRealtime Messages:\n" + JSON.stringify(realtimeMessages) +
        "\n\nOperational Events:\n" + JSON.stringify(operationalEvents),
    })

    const parsed = JSON.parse(response.output_text)

    const run = await prisma.knowledgeGraphSynthesisRun.create({
      data: {
        organizationId: org?.id || null,
        workspaceId: workspace?.id || null,
        title: parsed.title || "Knowledge Graph Synthesis",
        summary: parsed.summary || null,
        graphHealth: parsed.graphHealth || 75,
        memoryHealth: parsed.memoryHealth || 75,
        retrievalHealth: parsed.retrievalHealth || 75,
        findings: parsed.findings || {},
        status: "completed",
      },
    })

    const recordTitleToId = new Map<string, string>()

    for (const item of parsed.records || []) {
      const record = await prisma.semanticKnowledgeRecord.create({
        data: {
          organizationId: org?.id || null,
          workspaceId: workspace?.id || null,
          title: item.title,
          content: item.content,
          recordType: item.recordType || "memory",
          sourceLayer: item.sourceLayer || "knowledge-graph",
          sourceType: item.sourceType || null,
          sourceId: item.sourceId || null,
          importance: item.importance || 50,
          confidence: item.confidence || 0.75,
          tags: item.tags || [],
          metadata: item.metadata || {},
          status: "active",
        },
      })

      recordTitleToId.set(record.title, record.id)

      await prisma.semanticEmbeddingIndex.create({
        data: {
          knowledgeId: record.id,
          organizationId: org?.id || null,
          workspaceId: workspace?.id || null,
          embeddingModel: "text-embedding-3-small",
          vectorHash: hashText(record.content),
          dimensions: 1536,
          contentPreview: record.content.slice(0, 280),
          metadata: {
            note: "Vector hash placeholder. Replace with pgvector embedding in production.",
          },
          status: "indexed",
        },
      })
    }

    const nodeNameToId = new Map<string, string>()

    for (const item of parsed.nodes || []) {
      const node = await prisma.knowledgeGraphNode.create({
        data: {
          organizationId: org?.id || null,
          workspaceId: workspace?.id || null,
          nodeType: item.nodeType || "system",
          name: item.name,
          summary: item.summary || null,
          importance: item.importance || 50,
          sourceRecordId: item.sourceRecordTitle
            ? recordTitleToId.get(item.sourceRecordTitle) || null
            : null,
          metadata: item.metadata || {},
          status: "active",
        },
      })

      nodeNameToId.set(node.name, node.id)
    }

    for (const item of parsed.edges || []) {
      const sourceNodeId = nodeNameToId.get(item.sourceName)
      const targetNodeId = nodeNameToId.get(item.targetName)

      if (!sourceNodeId || !targetNodeId) continue

      await prisma.knowledgeGraphEdge.create({
        data: {
          organizationId: org?.id || null,
          workspaceId: workspace?.id || null,
          sourceNodeId,
          targetNodeId,
          relationType: item.relationType || "informs",
          strength: item.strength || 0.5,
          summary: item.summary || null,
          evidence: item.evidence || {},
          status: "active",
        },
      })
    }

    await prisma.operationalEvent.create({
      data: {
        type: "knowledge-graph-synthesis",
        source: "knowledge-graph",
        title: run.title,
        message: run.summary || null,
        severity: run.graphHealth <= 55 ? "high" : "medium",
        entityType: "KnowledgeGraphSynthesisRun",
        entityId: run.id,
        payload: {
          runId: run.id,
          organizationId: org?.id || null,
          workspaceId: workspace?.id || null,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      run,
    })
  } catch (error) {
    console.error("Knowledge graph synthesis failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Knowledge graph synthesis failed",
      },
      { status: 500 }
    )
  }
}