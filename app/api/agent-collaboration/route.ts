import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [agents, delegations, sessions] = await Promise.all([
      prisma.executiveAgent.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "asc" },
      }),
      prisma.agentDelegation.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.agentCollaborationSession.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ])

    return NextResponse.json({
      ok: true,
      agents,
      delegations,
      sessions,
    })
  } catch (error) {
    console.error("Agent collaboration fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch collaboration data" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const fromAgent = await prisma.executiveAgent.findUnique({
      where: { id: body.fromAgentId },
    })

    const toAgent = await prisma.executiveAgent.findUnique({
      where: { id: body.toAgentId },
    })

    if (!fromAgent || !toAgent) {
      return NextResponse.json(
        { ok: false, error: "Both agents are required" },
        { status: 400 }
      )
    }

    const delegation = await prisma.agentDelegation.create({
      data: {
        fromAgentId: fromAgent.id,
        fromAgentName: fromAgent.name,
        toAgentId: toAgent.id,
        toAgentName: toAgent.name,
        task: body.task,
        context: body.context || null,
        priority: body.priority || "medium",
        status: "pending",
      },
    })

    await prisma.aiActivityEvent.create({
      data: {
        type: "agent-collaboration",
        title: `${fromAgent.name} delegated to ${toAgent.name}`,
        message: body.task,
        status: "info",
        metadata: { delegationId: delegation.id },
      },
    })

    return NextResponse.json({
      ok: true,
      delegation,
    })
  } catch (error) {
    console.error("Agent delegation failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to create delegation" },
      { status: 500 }
    )
  }
}