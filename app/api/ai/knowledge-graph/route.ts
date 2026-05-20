import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const nodes = await prisma.knowledgeNode.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
    })

    const edges = await prisma.knowledgeEdge.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        fromNode: true,
        toNode: true,
      },
    })

    return NextResponse.json({
      ok: true,
      nodes,
      edges,
    })
  } catch (error) {
    console.error("Knowledge graph fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch knowledge graph" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const node = await prisma.knowledgeNode.create({
      data: {
        type: body.type,
        label: body.label,
        entityId: body.entityId || null,
        summary: body.summary || null,
        metadata: body.metadata || {},
      },
    })

    await prisma.aiActivityEvent.create({
      data: {
        type: "knowledge-graph",
        title: `Knowledge node created: ${node.label}`,
        message: node.summary || null,
        status: "success",
        metadata: node,
      },
    })

    return NextResponse.json({
      ok: true,
      node,
    })
  } catch (error) {
    console.error("Knowledge graph node save failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to save knowledge node" },
      { status: 500 }
    )
  }
}