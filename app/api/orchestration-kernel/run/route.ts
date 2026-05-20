import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function executeDecision(decision: any) {
  const payload = decision.payload || {}

  if (decision.decisionType === "trigger_workflow") {
    const workflow = await prisma.workflowDefinition.findFirst({
      where: {
        enabled: true,
        triggerType: payload.triggerType || "hot-lead-detected",
      },
    })

    if (!workflow) throw new Error("Matching workflow not found")

    return prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        workflowName: workflow.name,
        triggerType: workflow.triggerType,
        triggerSource: "orchestration-kernel",
        status: "queued",
        currentStep: null,
        completedSteps: [],
        payload,
      },
    })
  }

  if (decision.decisionType === "create_mission") {
    return prisma.autonomousMissionTask.create({
      data: {
        cycleId: payload.cycleId || "orchestration-kernel",
        agentName: payload.agentName || "Operations Monitoring Agent",
        task: payload.task || decision.reason || decision.title,
        priority: decision.priority,
        status: "pending",
      },
    })
  }

  if (decision.decisionType === "create_tool_action") {
    return prisma.toolExecutionAction.create({
      data: {
        toolName: payload.toolName || "create-operational-event",
        title: payload.title || decision.title,
        description: payload.description || decision.reason || null,
        status: decision.priority === "high" ? "approval-required" : "queued",
        riskLevel: decision.priority,
        requiresApproval: decision.priority === "high",
        approved: decision.priority !== "high",
        payload,
      },
    })
  }

  if (decision.decisionType === "send_email_review") {
    return prisma.emailExecution.create({
      data: {
        to: payload.to || "dphogeorge@gmail.com",
        subject: payload.subject || decision.title,
        body:
          payload.body ||
          "The orchestration kernel prepared this email for review.",
        status: "approval-required",
        approved: false,
        source: "orchestration-kernel",
        riskLevel: decision.priority,
        metadata: payload,
      },
    })
  }

  if (decision.decisionType === "create_delegation") {
    const fromAgent = await prisma.executiveAgent.findFirst({
      where: { name: payload.fromAgent || "Operations Monitoring Agent" },
    })

    const toAgent = await prisma.executiveAgent.findFirst({
      where: { name: payload.toAgent || "Executive Strategist" },
    })

    if (!fromAgent || !toAgent) throw new Error("Agent not found")

    return prisma.agentDelegation.create({
      data: {
        fromAgentId: fromAgent.id,
        fromAgentName: fromAgent.name,
        toAgentId: toAgent.id,
        toAgentName: toAgent.name,
        task: payload.task || decision.reason || decision.title,
        context: payload.context || null,
        priority: decision.priority,
        status: "pending",
      },
    })
  }

  if (decision.decisionType === "create_operational_event") {
    return prisma.operationalEvent.create({
      data: {
        type: payload.type || "orchestration-decision",
        source: "orchestration-kernel",
        title: payload.title || decision.title,
        message: payload.message || decision.reason || null,
        severity: decision.priority === "high" ? "high" : "medium",
        entityType: "OrchestrationDecision",
        entityId: decision.id,
        payload,
      },
    })
  }

  if (decision.decisionType === "run_optimization") {
    return prisma.optimizationAction.create({
      data: {
        title: payload.title || decision.title,
        description: payload.description || decision.reason || null,
        actionType: payload.actionType || "recommend_process_change",
        targetSystem: payload.targetSystem || "optimization",
        priority: decision.priority,
        riskLevel: decision.priority,
        status: "proposed",
        payload,
      },
    })
  }

  if (decision.decisionType === "manual_review") {
    return prisma.operationalEvent.create({
      data: {
        type: "manual-review-required",
        source: "orchestration-kernel",
        title: decision.title,
        message: decision.reason || null,
        severity: decision.priority === "high" ? "high" : "medium",
        entityType: "OrchestrationDecision",
        entityId: decision.id,
        payload,
      },
    })
  }

  throw new Error(`Unsupported decision type: ${decision.decisionType}`)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.decisionId) {
      return NextResponse.json(
        { ok: false, error: "decisionId is required" },
        { status: 400 }
      )
    }

    const decision = await prisma.orchestrationDecision.findUnique({
      where: { id: body.decisionId },
    })

    if (!decision) {
      return NextResponse.json(
        { ok: false, error: "Decision not found" },
        { status: 404 }
      )
    }

    if (!["proposed", "approved"].includes(decision.status)) {
      return NextResponse.json(
        { ok: false, error: "Decision cannot execute in current status" },
        { status: 400 }
      )
    }

    try {
      const result = await executeDecision(decision)

      const updated = await prisma.orchestrationDecision.update({
        where: { id: decision.id },
        data: {
          status: "completed",
          result,
        },
      })

      await prisma.operationalEvent.create({
        data: {
          type: "orchestration-decision-completed",
          source: "orchestration-kernel",
          title: decision.title,
          message: decision.reason || null,
          severity: "info",
          entityType: "OrchestrationDecision",
          entityId: decision.id,
          payload: { result },
        },
      })

      return NextResponse.json({
        ok: true,
        decision: updated,
        result,
      })
    } catch (executionError) {
      const failed = await prisma.orchestrationDecision.update({
        where: { id: decision.id },
        data: {
          status: "failed",
          error:
            executionError instanceof Error
              ? executionError.message
              : "Decision execution failed",
        },
      })

      return NextResponse.json(
        {
          ok: false,
          decision: failed,
          error:
            executionError instanceof Error
              ? executionError.message
              : "Decision execution failed",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Orchestration decision runner failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Orchestration decision runner failed",
      },
      { status: 500 }
    )
  }
}