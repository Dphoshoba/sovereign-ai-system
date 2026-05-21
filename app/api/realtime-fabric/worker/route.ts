import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function executeJob(job: any) {
  const payload = job.payload || {}

  if (job.jobType === "governance-review") {
    return prisma.governanceRiskSignal.create({
      data: {
        title: payload.title || job.title,
        signalType: "realtime-governance-review",
        severity:
          job.priority === "critical"
            ? "critical"
            : job.priority === "high"
              ? "high"
              : "medium",
        affectedArea: job.targetLayer || "runtime",
        description: payload.description || null,
        recommendation: payload.recommendation || "Review realtime event route.",
        status: "open",
      },
    })
  }

  if (job.jobType === "process-retry") {
    return prisma.resilienceRetryJob.create({
      data: {
        title: payload.title || job.title,
        source: "realtime-fabric",
        sourceId: job.id,
        status: "queued",
        priority: job.priority,
        attempts: 0,
        maxAttempts: 3,
        payload,
        nextRunAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    })
  }

  if (job.jobType === "store-memory") {
    return prisma.creatorLearningMemory.create({
      data: {
        type: "realtime-fabric",
        title: payload.title || job.title,
        insight: payload.insight || job.title,
        confidence: 0.78,
        priority: job.priority === "critical" ? "high" : job.priority,
        status: "active",
        evidence: {
          realtimeJobId: job.id,
        },
      },
    })
  }

  if (job.jobType === "tenant-sync") {
    return prisma.tenantIntelligenceRecord.create({
      data: {
        organizationId: payload.organizationId,
        workspaceId: payload.workspaceId || null,
        recordType: "realtime-sync",
        title: payload.title || job.title,
        summary: payload.summary || null,
        sourceLayer: "realtime-fabric",
        priority: job.priority === "critical" ? "high" : job.priority,
        payload,
        status: "active",
      },
    })
  }

  return prisma.operationalEvent.create({
    data: {
      type: "distributed-job-executed",
      source: "realtime-fabric-worker",
      title: job.title,
      message: payload.message || null,
      severity:
        job.priority === "critical"
          ? "critical"
          : job.priority === "high"
            ? "high"
            : "medium",
      entityType: "DistributedExecutionJob",
      entityId: job.id,
      payload,
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const workerName = body.workerName || null

    const where: any = {
      status: "queued",
    }

    if (workerName) {
      where.assignedWorker = workerName
    }

    const job = await prisma.distributedExecutionJob.findFirst({
      where,
      orderBy: [
        { priority: "desc" },
        { createdAt: "asc" },
      ],
    })

    if (!job) {
      return NextResponse.json({
        ok: true,
        message: "No queued jobs found",
      })
    }

    await prisma.distributedExecutionJob.update({
      where: { id: job.id },
      data: {
        status: "running",
        startedAt: new Date(),
        attempts: job.attempts + 1,
      },
    })

    try {
      const result = await executeJob(job)

      const updated = await prisma.distributedExecutionJob.update({
        where: { id: job.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          result,
        },
      })

      await prisma.distributedWorkerNode.updateMany({
        where: {
          name: job.assignedWorker || workerName || "Execution Worker",
        },
        data: {
          status: "online",
          lastHeartbeat: new Date(),
        },
      })

      return NextResponse.json({
        ok: true,
        job: updated,
        result,
      })
    } catch (executionError) {
      const failed = await prisma.distributedExecutionJob.update({
        where: { id: job.id },
        data: {
          status: job.attempts + 1 >= job.maxAttempts ? "failed" : "queued",
          error:
            executionError instanceof Error
              ? executionError.message
              : "Job execution failed",
        },
      })

      return NextResponse.json(
        {
          ok: false,
          job: failed,
          error:
            executionError instanceof Error
              ? executionError.message
              : "Job execution failed",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Distributed worker failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Distributed worker failed",
      },
      { status: 500 }
    )
  }
}