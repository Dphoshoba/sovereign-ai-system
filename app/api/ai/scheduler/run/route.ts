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

function mapOperationToJobType(operationType: string) {
  if (operationType === "publish_scheduled_articles") {
    return "publish-scheduled"
    if (operationType === "run_discovery_cycle") {
      return "run-discovery-cycle"
    }

  }

  if (operationType === "embed_published_articles") {
    return "embed-published-articles"
  }

  if (operationType === "run_executive_brain") {
    return "run-executive-brain"
  }

  if (operationType === "run_growth_intelligence") {
    return "run-growth-intelligence"
  }

  if (operationType === "run_self_improvement") {
    return "run-self-improvement"
  }

  return operationType
}

export async function POST() {
  try {
    const now = new Date()

    const operations = await prisma.aiScheduledOperation.findMany({
      where: {
        status: "active",
        nextRunAt: {
          lte: now,
        },
      },
      orderBy: {
        nextRunAt: "asc",
      },
      take: 10,
    })

    if (operations.length === 0) {
      await prisma.aiActivityEvent.create({
        data: {
          type: "scheduler",
          title: "Scheduler checked",
          message: "No scheduled operations were due.",
          status: "info",
        },
      })

      return NextResponse.json({
        ok: true,
        queued: 0,
        message: "No scheduled operations due",
      })
    }

    let queued = 0

    for (const operation of operations) {
      const jobType = mapOperationToJobType(operation.type)

      await prisma.aiJob.create({
        data: {
          type: jobType,
          payload: {
            operationId: operation.id,
            operationName: operation.name,
            originalPayload: operation.payload || {},
          },
          scheduledAt: new Date(),
        },
      })

      await prisma.aiScheduledOperation.update({
        where: { id: operation.id },
        data: {
          lastRunAt: now,
          nextRunAt: getNextRunDate(operation.frequency),
        },
      })

      await prisma.aiActivityEvent.create({
        data: {
          type: "scheduler",
          title: `Operation queued: ${operation.name}`,
          message: `Queued job type: ${jobType}`,
          status: "success",
          metadata: {
            operationId: operation.id,
            jobType,
          },
        },
      })

      queued++
    }

    return NextResponse.json({
      ok: true,
      queued,
    })
  } catch (error) {
    console.error("Scheduler runner failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Scheduler runner failed",
      },
      { status: 500 }
    )
  }
}