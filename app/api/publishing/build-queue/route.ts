import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { queueId, status, scheduledAt } = await req.json()

    if (!queueId || !status) {
      return NextResponse.json(
        { ok: false, error: "Missing queueId or status" },
        { status: 400 }
      )
    }

    const updated = await prisma.publishingQueue.update({
      where: { id: queueId },
      data: {
        status,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        publishedAt: status === "published" ? new Date() : undefined,
      },
    })

    return NextResponse.json({
      ok: true,
      item: updated,
    })
  } catch (error) {
    console.error("Queue update failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to update queue",
      },
      { status: 500 }
    )
  }
}