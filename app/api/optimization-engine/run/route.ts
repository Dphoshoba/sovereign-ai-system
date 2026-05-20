import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function runOptimizationAction(action: any) {
  const payload = action.payload || {}

  if (action.actionType === "create_tool_action") {
    return prisma.toolExecutionAction.create({
      data: {
        toolName: payload.toolName || "create-operational-event",
        title: payload.title || action.title,
        description: payload.description || action.description || null,
        status: payload.requiresApproval ? "approval-required" : "queued",
        riskLevel: payload.riskLevel || action.riskLevel,
        requiresApproval:
          typeof payload.requiresApproval === "boolean"
            ? payload.requiresApproval
            : action.riskLevel !== "low",
        approved:
          typeof payload.requiresApproval === "boolean"
            ? !payload.requiresApproval
            : action.riskLevel === "low",
        payload,
      },
    })
  }

  if (action.actionType === "create_mission_task") {
    return prisma.autonomousMissionTask.create({
      data: {
        cycleId: payload.cycleId || "manual-optimization",
        agentName: payload.agentName || "Operations Monitoring Agent",
        task: payload.task || action.description || action.title,
        priority: action.priority,
        status: "pending",
      },
    })
  }

  if (action.actionType === "create_delegation") {
    const fromAgent = await prisma.executiveAgent.findFirst({
      where: { name: payload.fromAgent || "Operations Monitoring Agent" },
    })

    const toAgent = await prisma.executiveAgent.findFirst({
      where: { name: payload.toAgent },
    })

    if (!fromAgent || !toAgent) {
      throw new Error("Delegation agents not found")
    }

    return prisma.agentDelegation.create({
      data: {
        fromAgentId: fromAgent.id,
        fromAgentName: fromAgent.name,
        toAgentId: toAgent.id,
        toAgentName: toAgent.name,
        task: payload.task || action.description || action.title,
        context: payload.context || null,
        priority: action.priority,
        status: "pending",
      },
    })
  }

  if (action.actionType === "create_learning_memory") {
    return prisma.creatorLearningMemory.create({
      data: {
        type: payload.type || "optimization",
        title: payload.title || action.title,
        insight: payload.insight || action.description || action.title,
        confidence:
          typeof payload.confidence === "number" ? payload.confidence : 0.75,
        priority: action.priority,
        status: "active",
        evidence: payload.evidence || {},
      },
    })
  }

  if (action.actionType === "create_operational_event") {
    return prisma.operationalEvent.create({
      data: {
        type: payload.type || "optimization-action",
        source: "optimization-engine",
        title: payload.title || action.title,
        message: payload.message || action.description || null,
        severity: action.riskLevel === "high" ? "high" : "medium",
        entityType: "OptimizationAction",
        entityId: action.id,
        payload,
      },
    })
  }

  if (action.actionType === "update_lead_status") {
    if (!payload.leadId) throw new Error("leadId is required")

    return prisma.creatorLead.update({
      where: { id: payload.leadId },
      data: {
        status: payload.status,
        readiness: payload.readiness,
        leadScore:
          typeof payload.leadScore === "number" ? payload.leadScore : undefined,
        notes: payload.notes,
      },
    })
  }

  if (action.actionType === "recommend_process_change") {
    return prisma.creatorLearningMemory.create({
      data: {
        type: "process-optimization",
        title: payload.title || action.title,
        insight:
          payload.recommendation ||
          action.description ||
          "Process improvement recommended.",
        confidence: 0.7,
        priority: action.priority,
        status: "active",
        evidence: {
          optimizationActionId: action.id,
          targetSystem: action.targetSystem,
        },
      },
    })
  }

  throw new Error(`Unsupported optimization action type: ${action.actionType}`)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.actionId) {
      return NextResponse.json(
        { ok: false, error: "actionId is required" },
        { status: 400 }
      )
    }

    const action = await prisma.optimizationAction.findUnique({
      where: { id: body.actionId },
    })

    if (!action) {
      return NextResponse.json(
        { ok: false, error: "Optimization action not found" },
        { status: 404 }
      )
    }

    if (!["proposed", "approved"].includes(action.status)) {
      return NextResponse.json(
        { ok: false, error: "Action cannot run in current status" },
        { status: 400 }
      )
    }

    try {
      const result = await runOptimizationAction(action)

      const updated = await prisma.optimizationAction.update({
        where: { id: action.id },
        data: {
          status: "completed",
          result,
        },
      })

      await prisma.operationalEvent.create({
        data: {
          type: "optimization-action-completed",
          source: "optimization-engine",
          title: action.title,
          message: action.description || null,
          severity: "info",
          entityType: "OptimizationAction",
          entityId: action.id,
          payload: { result },
        },
      })

      return NextResponse.json({
        ok: true,
        action: updated,
        result,
      })
    } catch (executionError) {
      const failed = await prisma.optimizationAction.update({
        where: { id: action.id },
        data: {
          status: "failed",
          error:
            executionError instanceof Error
              ? executionError.message
              : "Action failed",
        },
      })

      return NextResponse.json(
        {
          ok: false,
          action: failed,
          error:
            executionError instanceof Error
              ? executionError.message
              : "Action failed",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Optimization action runner failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Optimization action runner failed",
      },
      { status: 500 }
    )
  }
}