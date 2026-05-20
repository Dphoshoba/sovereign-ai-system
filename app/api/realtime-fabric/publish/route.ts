import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.streamName || !body.eventType || !body.title) {
      return NextResponse.json(
        { ok: false, error: "streamName, eventType and title are required" },
        { status: 400 }
      )
    }

    const message = await prisma.realtimeEventMessage.create({
      data: {
        streamName: body.streamName,
        eventType: body.eventType,
        source: body.source || "manual",
        title: body.title,
        message: body.message || null,
        priority: body.priority || "medium",
        payload: body.payload || {},
        status: "pending",
      },
    })

    await prisma.operationalEvent.create({
      data: {
        type: "realtime-event-published",
        source: "realtime-fabric",
        title: message.title,
        message: message.message || null,
        severity:
          message.priority === "critical"
            ? "critical"
            : message.priority === "high"
              ? "high"
              : "medium",
        entityType: "RealtimeEventMessage",
        entityId: message.id,
        payload: {
          streamName: message.streamName,
          eventType: message.eventType,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      message,
    })
  } catch (error) {
    console.error("Realtime event publish failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Realtime event publish failed",
      },
      { status: 500 }
    )
  }
}