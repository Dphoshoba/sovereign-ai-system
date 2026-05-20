import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function getNextRunDate(frequency: string) {
  const now = new Date()

  if (frequency === "hourly") {
    now.setHours(now.getHours() + 1)
    return now
  }

  if (frequency === "daily") {
    now.setDate(now.getDate() + 1)
    return now
  }

  if (frequency === "weekly") {
    now.setDate(now.getDate() + 7)
    return now
  }

  if (frequency === "monthly") {
    now.setMonth(now.getMonth() + 1)
    return now
  }

  now.setDate(now.getDate() + 1)
  return now
}

export async function GET() {
  try {
    const operations = await prisma.aiScheduledOperation.findMany({
      orderBy: { nextRunAt: "asc" },
      take: 100,
    })

    return NextResponse.json({
      ok: true,
      operations,
    })
  } catch (error) {
    console.error("Scheduler fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch scheduled operations" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const frequency = body.frequency || "daily"

    const operation = await prisma.aiScheduledOperation.create({
      data: {
        name: body.name,
        type: body.type,
        status: body.status || "active",
        frequency,
        payload: body.payload || {},
        nextRunAt: body.nextRunAt
          ? new Date(body.nextRunAt)
          : getNextRunDate(frequency),
      },
    })

    await prisma.aiActivityEvent.create({
      data: {
        type: "scheduler",
        title: `Scheduled operation created: ${operation.name}`,
        message: `Operation type: ${operation.type}`,
        status: "success",
        metadata: { operationId: operation.id },
      },
    })

    return NextResponse.json({
      ok: true,
      operation,
    })
  } catch (error) {
    console.error("Scheduler save failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to create scheduled operation" },
      { status: 500 }
    )
  }
}