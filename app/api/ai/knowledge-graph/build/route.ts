import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function upsertNode({
  type,
  label,
  entityId,
  summary,
  metadata = {},
}: {
  type: string
  label: string
  entityId?: string | null
  summary?: string | null
  metadata?: Record<string, unknown>
}) {
  const existing = entityId
    ? await prisma.knowledgeNode.findFirst({
        where: { type, entityId },
      })
    : await prisma.knowledgeNode.findFirst({
        where: { type, label },
      })

  if (existing) {
    return prisma.knowledgeNode.update({
      where: { id: existing.id },
      data: {
        label,
        summary: summary || existing.summary,
        metadata,
      },
    })
  }

  return prisma.knowledgeNode.create({
    data: {
      type,
      label,
      entityId: entityId || null,
      summary: summary || null,
      metadata,
    },
  })
}

async function createEdge({
  fromNodeId,
  toNodeId,
  relation,
  weight = 1,
  metadata = {},
}: {
  fromNodeId: string
  toNodeId: string
  relation: string
  weight?: number
  metadata?: Record<string, unknown>
}) {
  const existing = await prisma.knowledgeEdge.findFirst({
    where: {
      fromNodeId,
      toNodeId,
      relation,
    },
  })

  if (existing) {
    return prisma.knowledgeEdge.update({
      where: { id: existing.id },
      data: {
        weight,
        metadata,
      },
    })
  }

  return prisma.knowledgeEdge.create({
    data: {
      fromNodeId,
      toNodeId,
      relation,
      weight,
      metadata,
    },
  })
}

export async function POST() {
  try {
    const [
      articles,
      agents,
      departments,
      memories,
      clients,
      workflows,
      revenueRecords,
      insights,
    ] = await Promise.all([
      prisma.article.findMany({ take: 100 }),
      prisma.aiAgent.findMany({ include: { department: true }, take: 100 }),
      prisma.aiDepartment.findMany({ take: 100 }),
      prisma.aiMemory.findMany({ take: 100 }),
      prisma.clientProfile.findMany({ take: 100 }),
      prisma.aiWorkflow.findMany({ take: 100 }),
      prisma.revenueRecord.findMany({ take: 100 }),
      prisma.revenueInsight.findMany({ take: 100 }),
    ])

    let nodeCount = 0
    let edgeCount = 0

    const orgNode = await upsertNode({
      type: "organization",
      label: "Echoes & Visions",
      entityId: "echoes-visions",
      summary: "AI-native media, ministry, business and strategy platform.",
    })

    nodeCount++

    const departmentNodes: Record<string, string> = {}

    for (const department of departments) {
      const node = await upsertNode({
        type: "department",
        label: department.name,
        entityId: department.id,
        summary: department.description,
        metadata: { status: department.status },
      })

      departmentNodes[department.id] = node.id
      nodeCount++

      await createEdge({
        fromNodeId: orgNode.id,
        toNodeId: node.id,
        relation: "HAS_DEPARTMENT",
      })

      edgeCount++
    }

    for (const agent of agents) {
      const node = await upsertNode({
        type: "agent",
        label: agent.name,
        entityId: agent.id,
        summary: agent.role,
        metadata: {
          status: agent.status,
          tools: agent.tools,
          tags: agent.tags,
        },
      })

      nodeCount++

      await createEdge({
        fromNodeId: orgNode.id,
        toNodeId: node.id,
        relation: "HAS_AGENT",
      })

      edgeCount++

      if (agent.departmentId && departmentNodes[agent.departmentId]) {
        await createEdge({
          fromNodeId: departmentNodes[agent.departmentId],
          toNodeId: node.id,
          relation: "OWNS_AGENT",
        })

        edgeCount++
      }
    }

    for (const article of articles) {
      const articleNode = await upsertNode({
        type: "article",
        label: article.title,
        entityId: article.id,
        summary: article.excerpt,
        metadata: {
          status: article.status,
          category: article.category,
          slug: article.slug,
          seoKeywords: article.seoKeywords,
        },
      })

      nodeCount++

      await createEdge({
        fromNodeId: orgNode.id,
        toNodeId: articleNode.id,
        relation: "PUBLISHED_CONTENT",
      })

      edgeCount++

      if (article.category) {
        const categoryNode = await upsertNode({
          type: "category",
          label: article.category,
          entityId: `category:${article.category}`,
          summary: `Content category: ${article.category}`,
        })

        nodeCount++

        await createEdge({
          fromNodeId: articleNode.id,
          toNodeId: categoryNode.id,
          relation: "BELONGS_TO_CATEGORY",
        })

        edgeCount++
      }
    }

    for (const memory of memories) {
      const node = await upsertNode({
        type: "memory",
        label: memory.title,
        entityId: memory.id,
        summary: memory.content.slice(0, 240),
        metadata: {
          memoryType: memory.type,
          tags: memory.tags,
        },
      })

      nodeCount++

      await createEdge({
        fromNodeId: orgNode.id,
        toNodeId: node.id,
        relation: "REMEMBERS",
      })

      edgeCount++
    }

    for (const client of clients) {
      const node = await upsertNode({
        type: "client",
        label: client.name,
        entityId: client.id,
        summary: client.notes || client.interests,
        metadata: {
          type: client.type,
          status: client.status,
          source: client.source,
          tags: client.tags,
        },
      })

      nodeCount++

      await createEdge({
        fromNodeId: orgNode.id,
        toNodeId: node.id,
        relation: "HAS_RELATIONSHIP",
      })

      edgeCount++
    }

    for (const workflow of workflows) {
      const node = await upsertNode({
        type: "workflow",
        label: workflow.name,
        entityId: workflow.id,
        summary: workflow.description,
        metadata: {
          trigger: workflow.trigger,
          action: workflow.action,
          status: workflow.status,
        },
      })

      nodeCount++

      await createEdge({
        fromNodeId: orgNode.id,
        toNodeId: node.id,
        relation: "RUNS_WORKFLOW",
      })

      edgeCount++
    }

    for (const record of revenueRecords) {
      const node = await upsertNode({
        type: "revenue",
        label: `${record.category} - ${record.currency} ${record.amount}`,
        entityId: record.id,
        summary: record.notes,
        metadata: {
          source: record.source,
          category: record.category,
          amount: record.amount,
          currency: record.currency,
          recurring: record.recurring,
          status: record.status,
        },
      })

      nodeCount++

      await createEdge({
        fromNodeId: orgNode.id,
        toNodeId: node.id,
        relation: "GENERATED_REVENUE",
        weight: record.amount,
      })

      edgeCount++
    }

    for (const insight of insights) {
      const node = await upsertNode({
        type: "insight",
        label: insight.title,
        entityId: insight.id,
        summary: insight.insight,
        metadata: {
          priority: insight.priority,
          confidence: insight.confidence,
          source: insight.source,
        },
      })

      nodeCount++

      await createEdge({
        fromNodeId: orgNode.id,
        toNodeId: node.id,
        relation: "HAS_INSIGHT",
      })

      edgeCount++
    }

    await prisma.aiActivityEvent.create({
      data: {
        type: "knowledge-graph",
        title: "Knowledge graph rebuilt",
        message: `Graph updated with ${nodeCount} nodes and ${edgeCount} edges processed.`,
        status: "success",
        metadata: {
          nodeCount,
          edgeCount,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      nodeCount,
      edgeCount,
    })
  } catch (error) {
    console.error("Knowledge graph build failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Knowledge graph build failed",
      },
      { status: 500 }
    )
  }
}