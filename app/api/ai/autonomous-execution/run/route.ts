import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function runAction(action: any) {
  const payload = action.payload || {}

  if (action.actionType === "create_job") {
    return prisma.aiJob.create({
      data: {
        type: payload.type || "run-executive-brain",
        payload,
        scheduledAt: new Date(),
      },
    })
  }

  if (action.actionType === "save_memory") {
    return prisma.aiMemory.create({
      data: {
        type: payload.type || "strategy",
        title: payload.title || action.title,
        content: payload.content || action.description || "",
        source: "autonomous-execution",
        tags: payload.tags || "autonomous",
      },
    })
  }

  if (action.actionType === "log_activity") {
    return prisma.aiActivityEvent.create({
      data: {
        type: payload.type || "autonomous-execution",
        title: payload.title || action.title,
        message: payload.message || action.description || null,
        status: payload.status || "info",
        metadata: payload,
      },
    })
  }

  if (action.actionType === "create_follow_up") {
    return prisma.aiJob.create({
      data: {
        type: "crm-follow-up",
        payload,
        scheduledAt: new Date(),
      },
    })
  }

  if (action.actionType === "run_kernel") {
    return prisma.aiJob.create({
      data: {
        type: "run-kernel",
        payload,
        scheduledAt: new Date(),
      },
    })
  }

  if (action.actionType === "run_mission_chain") {
    return prisma.aiJob.create({
      data: {
        type: "run-mission-chain",
        payload,
        scheduledAt: new Date(),
      },
    })
  }

  if (action.actionType === "run_simulation") {
    return prisma.aiJob.create({
      data: {
        type: "run-simulation",
        payload,
        scheduledAt: new Date(),
      },
    })
  }

  throw new Error(`Unsupported autonomous action type: ${action.actionType}`)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const actionId = body.actionId as string

    if (!actionId) {
      return NextResponse.json(
        { ok: false, error: "actionId is required" },
        { status: 400 }
      )
    }

    const action = await prisma.aiAutonomousAction.findUnique({
      where: { id: actionId },
    })

    if (!action) {
      return NextResponse.json(
        { ok: false, error: "Autonomous action not found" },
        { status: 404 }
      )
    }

    if (!["approved", "proposed"].includes(action.status)) {
      return NextResponse.json(
        { ok: false, error: "Action cannot be executed in its current status" },
        { status: 400 }
      )
    }

    const result = await runAction(action)

    const updated = await prisma.aiAutonomousAction.update({
      where: { id: action.id },
      data: {
        status: "completed",
        result,
      },
    })

    await prisma.aiActivityEvent.create({
      data: {
        type: "autonomous-execution",
        title: `Autonomous action executed: ${action.title}`,
        message: action.description || null,
        status: "success",
        metadata: {
          actionId: action.id,
          actionType: action.actionType,
          result,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      action: updated,
      result,
    })
  } catch (error) {
    console.error("Autonomous action run failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Autonomous action run failed",
      },
      { status: 500 }
    )
  }
}