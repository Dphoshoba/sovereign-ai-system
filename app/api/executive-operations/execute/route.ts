import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function executeTask(task: any) {
  if (task.ownerSystem === "workflow") {
    return prisma.workflowAction.create({
      data: {
        workflowExecutionId: null,
        actionType: "executive-operation",
        title: task.title,
        description: task.description,
        status: "queued",
        payload: {
          executiveTaskId: task.id,
        },
      },
    })
  }

  if (task.ownerSystem === "runtime") {
    return prisma.runtimeObjective.create({
      data: {
        title: task.title,
        description: task.description,
        priority: task.priority,
        cadence: "daily",
        status: "active",
        metadata: {
          executiveTaskId: task.id,
        },
      },
    })
  }

  if (task.ownerSystem === "governance") {
    return prisma.governanceApproval.create({
      data: {
        title: task.title,
        targetType: "executive-operation",
        targetId: task.id,
        priority: task.priority,
        rationale: task.description,
        status: "pending",
      },
    })
  }

  if (task.ownerSystem === "optimization") {
    return prisma.optimizationAction.create({
      data: {
        title: task.title,
        description: task.description,
        actionType: "executive-optimization",
        targetSystem: "operations",
        priority: task.priority,
        riskLevel: "medium",
        status: "proposed",
      },
    })
  }

  return prisma.operationalEvent.create({
    data: {
      type: "executive-task-executed",
      source: "executive-operations-grid",
      title: task.title,
      message: task.description || null,
      severity: task.priority === "high" ? "high" : "medium",
      entityType: "ExecutiveOperationTask",
      entityId: task.id,
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.taskId) {
      return NextResponse.json(
        { ok: false, error: "taskId is required" },
        { status: 400 }
      )
    }

    const task = await prisma.executiveOperationTask.findUnique({
      where: { id: body.taskId },
    })

    if (!task) {
      return NextResponse.json(
        { ok: false, error: "Executive task not found" },
        { status: 404 }
      )
    }

    try {
      const result = await executeTask(task)

      const updated = await prisma.executiveOperationTask.update({
        where: { id: task.id },
        data: {
          status: "executed",
          progress: 100,
          result,
        },
      })

      return NextResponse.json({
        ok: true,
        task: updated,
      })
    } catch (executionError) {
      const failed = await prisma.executiveOperationTask.update({
        where: { id: task.id },
        data: {
          status: "failed",
          error:
            executionError instanceof Error
              ? executionError.message
              : "Task execution failed",
        },
      })

      return NextResponse.json(
        {
          ok: false,
          task: failed,
          error:
            executionError instanceof Error
              ? executionError.message
              : "Task execution failed",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Executive runtime execution failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Executive runtime execution failed",
      },
      { status: 500 }
    )
  }
}