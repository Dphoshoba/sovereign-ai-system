import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.retryJobId) {
      return NextResponse.json(
        { ok: false, error: "retryJobId is required" },
        { status: 400 }
      )
    }

    const job = await prisma.infrastructureRetryJob.findUnique({
      where: { id: body.retryJobId },
    })

    if (!job) {
      return NextResponse.json(
        { ok: false, error: "Retry job not found" },
        { status: 404 }
      )
    }

    const nextAttempts = job.attempts + 1
    const maxReached = nextAttempts >= job.maxAttempts

    const updated = await prisma.infrastructureRetryJob.update({
      where: { id: job.id },
      data: {
        attempts: nextAttempts,
        status: maxReached ? "max-attempts-reached" : "retried",
        nextRunAt: maxReached ? null : new Date(Date.now() + 30 * 60 * 1000),
      },
    })

    await prisma.governanceAuditTrail.create({
      data: {
        eventType: "infrastructure-retry-attempt",
        actor: "infrastructure-resilience",
        actorRole: "system",
        targetType: job.source,
        targetId: job.sourceId || null,
        action: "retry",
        outcome: updated.status,
        severity: job.priority,
        details: {
          retryJobId: job.id,
          attempts: updated.attempts,
          maxAttempts: updated.maxAttempts,
        },
      },
    })

    await prisma.operationalEvent.create({
      data: {
        type: "infrastructure-retry-attempt",
        source: "infrastructure-resilience",
        title: job.title,
        message: job.lastError || null,
        severity: job.priority === "high" ? "high" : "medium",
        entityType: "InfrastructureRetryJob",
        entityId: job.id,
        payload: {
          attempts: updated.attempts,
          status: updated.status,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      retryJob: updated,
    })
  } catch (error) {
    console.error("Infrastructure retry failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Infrastructure retry failed",
      },
      { status: 500 }
    )
  }
}