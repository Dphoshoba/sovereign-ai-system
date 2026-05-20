import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [
      jobs,
      activity,
      agents,
      approvals,
      scheduledOperations,
      workflows,
    ] = await Promise.all([
      prisma.aiJob.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),

      prisma.aiActivityEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
      }),

      prisma.aiAgent.findMany({
        where: { status: "active" },
        include: { department: true },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),

      prisma.aiApprovalRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),

      prisma.aiScheduledOperation.findMany({
        orderBy: { nextRunAt: "asc" },
        take: 20,
      }),

      prisma.aiWorkflow.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ])

    const runningJobs = jobs.filter((job) => job.status === "running")
    const queuedJobs = jobs.filter((job) => job.status === "queued")
    const failedJobs = jobs.filter((job) => job.status === "failed")
    const pendingApprovals = approvals.filter(
      (approval) => approval.status === "pending"
    )
    const activeWorkflows = workflows.filter(
      (workflow) => workflow.status === "active"
    )
    const activeSchedules = scheduledOperations.filter(
      (operation) => operation.status === "active"
    )

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      metrics: {
        activeAgents: agents.length,
        runningJobs: runningJobs.length,
        queuedJobs: queuedJobs.length,
        failedJobs: failedJobs.length,
        pendingApprovals: pendingApprovals.length,
        activeWorkflows: activeWorkflows.length,
        activeSchedules: activeSchedules.length,
      },
      jobs,
      activity,
      agents,
      approvals,
      scheduledOperations,
      workflows,
    })
  } catch (error) {
    console.error("Live command center failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch live command center",
      },
      { status: 500 }
    )
  }
}