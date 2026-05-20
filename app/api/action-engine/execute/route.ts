import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function executeStep(step: any) {
  const payload = step.payload || {}

  if (["approval-required", "blocked"].includes(step.status)) {
    return prisma.executionAuthorizationRequest.create({
      data: {
        title: `Approve Action Step: ${step.title}`,
        targetType: "ActionExecutionStep",
        targetId: step.id,
        requestedBy: "action-engine",
        requestedRole: "system",
        actionType: step.stepType,
        targetLayer: step.targetLayer || "operations",
        riskLevel:
          step.priority === "critical"
            ? "critical"
            : step.priority === "high"
              ? "high"
              : "medium",
        status: "pending",
        rationale: step.instruction || null,
        payload,
      },
    })
  }

  if (step.stepType === "create-governance-request") {
    return prisma.executionAuthorizationRequest.create({
      data: {
        title: payload.title || step.title,
        targetType: payload.targetType || "ActionMission",
        targetId: payload.targetId || step.missionId,
        requestedBy: "action-engine",
        requestedRole: "system",
        actionType: payload.actionType || "mission-execution",
        targetLayer: step.targetLayer || "governance",
        riskLevel:
          step.priority === "critical"
            ? "critical"
            : step.priority === "high"
              ? "high"
              : "medium",
        status: "pending",
        rationale: step.instruction || null,
        payload,
      },
    })
  }

  if (step.stepType === "create-runtime-job") {
    return prisma.distributedExecutionJob.create({
      data: {
        jobType: payload.jobType || "create-operational-event",
        title: payload.title || step.title,
        targetLayer: step.targetLayer || "operations",
        priority: step.priority,
        status: "queued",
        assignedWorker: payload.assignedWorker || "Execution Worker",
        payload,
        scheduledAt: new Date(),
      },
    })
  }

  if (step.stepType === "store-memory") {
    return prisma.semanticKnowledgeRecord.create({
      data: {
        organizationId: payload.organizationId || null,
        workspaceId: payload.workspaceId || null,
        title: payload.title || step.title,
        content: payload.content || step.instruction || step.title,
        recordType: payload.recordType || "action-memory",
        sourceLayer: "action-engine",
        importance: payload.importance || 70,
        confidence: payload.confidence || 0.8,
        tags: payload.tags || ["action-engine"],
        metadata: {
          stepId: step.id,
          missionId: step.missionId,
        },
      },
    })
  }

  if (step.stepType === "create-record") {
    return prisma.tenantIntelligenceRecord.create({
      data: {
        organizationId: payload.organizationId,
        workspaceId: payload.workspaceId || null,
        recordType: payload.recordType || "action-record",
        title: payload.title || step.title,
        summary: payload.summary || step.instruction || null,
        sourceLayer: "action-engine",
        priority: step.priority === "critical" ? "high" : step.priority,
        payload,
      },
    })
  }

  if (step.stepType === "send-email-draft") {
    return prisma.emailExecution.create({
      data: {
        to: payload.to || "davidoshoba@gmail.com",
        subject: payload.subject || step.title,
        body: payload.body || step.instruction || "",
        status: "approval-required",
        approved: false,
        source: "action-engine",
        riskLevel:
          step.priority === "critical"
            ? "critical"
            : step.priority === "high"
              ? "high"
              : "medium",
        metadata: {
          stepId: step.id,
          missionId: step.missionId,
        },
      },
    })
  }

  return prisma.operationalEvent.create({
    data: {
      type: "action-step-executed",
      source: "action-engine",
      title: step.title,
      message: step.instruction || null,
      severity:
        step.priority === "critical"
          ? "critical"
          : step.priority === "high"
            ? "high"
            : "medium",
      entityType: "ActionExecutionStep",
      entityId: step.id,
      payload,
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.stepId) {
      return NextResponse.json(
        { ok: false, error: "stepId is required" },
        { status: 400 }
      )
    }

    const step = await prisma.actionExecutionStep.findUnique({
      where: { id: body.stepId },
    })

    if (!step) {
      return NextResponse.json(
        { ok: false, error: "Action step not found" },
        { status: 404 }
      )
    }

    await prisma.actionExecutionStep.update({
      where: { id: step.id },
      data: {
        status: "running",
        startedAt: new Date(),
      },
    })

    try {
      const result = await executeStep(step)

      const updated = await prisma.actionExecutionStep.update({
        where: { id: step.id },
        data: {
          status:
            ["approval-required", "blocked"].includes(step.status)
              ? "approval-requested"
              : "completed",
          completedAt: new Date(),
          result,
        },
      })

      if (step.missionId) {
        const total = await prisma.actionExecutionStep.count({
          where: { missionId: step.missionId },
        })

        const completed = await prisma.actionExecutionStep.count({
          where: {
            missionId: step.missionId,
            status: {
              in: ["completed", "approval-requested"],
            },
          },
        })

        await prisma.actionMission.update({
          where: { id: step.missionId },
          data: {
            progressScore: total > 0 ? Math.round((completed / total) * 100) : 0,
            status: completed === total ? "completed" : "in-progress",
          },
        })
      }

      return NextResponse.json({
        ok: true,
        step: updated,
        result,
      })
    } catch (executionError) {
      const failed = await prisma.actionExecutionStep.update({
        where: { id: step.id },
        data: {
          status: "failed",
          error:
            executionError instanceof Error
              ? executionError.message
              : "Step execution failed",
        },
      })

      return NextResponse.json(
        {
          ok: false,
          step: failed,
          error:
            executionError instanceof Error
              ? executionError.message
              : "Step execution failed",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Action step execution failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Action step execution failed",
      },
      { status: 500 }
    )
  }
}