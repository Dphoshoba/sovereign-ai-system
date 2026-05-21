import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function executeTask(task: any) {
  if (task.ownerSystem === "workflow") {
    return prisma.operationalEvent.create({
      data: {
        type: "executive-workflow-action",
        source: "executive-operations",
        title: task.title,
        message: task.description || null,
        severity:
          task.priority === "critical"
            ? "critical"
            : task.priority === "high"
              ? "high"
              : "medium",
        entityType: "ExecutiveOperationTask",
        entityId: task.id,
        payload: {
          executiveTaskId: task.id,
          ownerSystem: task.ownerSystem,
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

  return prisma.operationalEvent.create({
    data: {
      type: "executive-operation",
      source: "executive-operations",
      title: task.title,
      message: task.description || null,
      severity:
        task.priority === "critical"
          ? "critical"
          : task.priority === "high"
            ? "high"
            : "medium",
      entityType: "ExecutiveOperationTask",
      entityId: task.id,
      payload: {
        executiveTaskId: task.id,
        ownerSystem: task.ownerSystem,
      },
    },
  })
}