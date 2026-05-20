import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function logActivity({
  type,
  title,
  message,
  status = "info",
  metadata = {},
}: {
  type: string
  title: string
  message?: string
  status?: string
  metadata?: Record<string, unknown>
}) {
  await prisma.aiActivityEvent.create({
    data: {
      type,
      title,
      message: message || null,
      status,
      metadata,
    },
  })
}

async function runJob(job: any) {
  if (job.type === "publish-scheduled") {
    const now = new Date()

    const result = await prisma.article.updateMany({
      where: {
        status: "scheduled",
        scheduledFor: {
          lte: now,
        },
      },
      data: {
        status: "published",
        publishedAt: now,
      },
    })

    return {
      message: "Scheduled publishing checked",
      published: result.count,
    }
  }

  if (job.type === "embed-published-articles") {
    return {
      message:
        "Embedding job queued. Use /api/ai/embed-articles manually for now.",
    }
  }

  return {
    message: `No handler implemented for job type: ${job.type}`,
  }
}

export async function POST() {
  try {
    const now = new Date()

    const job = await prisma.aiJob.findFirst({
      where: {
        status: "queued",
        scheduledAt: {
          lte: now,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    if (!job) {
      await logActivity({
        type: "queue",
        title: "No queued jobs ready",
        message: "The worker checked the queue and found no ready jobs.",
        status: "info",
      })

      return NextResponse.json({
        ok: true,
        message: "No queued jobs ready",
      })
    }

    await logActivity({
      type: "job",
      title: `Job started: ${job.type}`,
      message: `Job ${job.id} started running.`,
      status: "running",
      metadata: { jobId: job.id, jobType: job.type },
    })

    await prisma.aiJob.update({
      where: { id: job.id },
      data: {
        status: "running",
        startedAt: new Date(),
        attempts: job.attempts + 1,
      },
    })

    try {
      const result = await runJob(job)

      const completed = await prisma.aiJob.update({
        where: { id: job.id },
        data: {
          status: "completed",
          result,
          completedAt: new Date(),
        },
      })

      await logActivity({
        type: "job",
        title: `Job completed: ${job.type}`,
        message: result.message,
        status: "success",
        metadata: { jobId: job.id, result },
      })

      return NextResponse.json({
        ok: true,
        job: completed,
      })
    } catch (error) {
      const failed = await prisma.aiJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          error:
            error instanceof Error ? error.message : "Unknown job failure",
        },
      })

      await logActivity({
        type: "job",
        title: `Job failed: ${job.type}`,
        message:
          error instanceof Error ? error.message : "Unknown job failure",
        status: "error",
        metadata: { jobId: job.id },
      })

      return NextResponse.json(
        {
          ok: false,
          job: failed,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Job runner failed:", error)

    await logActivity({
      type: "system",
      title: "Job runner failed",
      message: error instanceof Error ? error.message : "Unknown failure",
      status: "error",
    })

    return NextResponse.json(
      { ok: false, error: "Job runner failed" },
      { status: 500 }
    )
  }
}