import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function activateInitiative(initiative: any) {
  const ownerSystem = initiative.ownerSystem || "operations"

  if (ownerSystem === "workflow") {
    return prisma.workflowDefinition.create({
      data: {
        name: `Strategic Workflow: ${initiative.title}`,
        description: initiative.description || initiative.targetOutcome || null,
        triggerType: "strategic-initiative",
        enabled: true,
        riskLevel: initiative.riskLevel,
        config: {
          initiativeId: initiative.id,
          executionPath: initiative.executionPath || [],
        },
      },
    })
  }

  if (ownerSystem === "agents") {
    const agent = await prisma.executiveAgent.findFirst({
      where: { status: "active" },
    })

    if (!agent) throw new Error("No active agent found")

    return prisma.agentDelegation.create({
      data: {
        fromAgentId: agent.id,
        fromAgentName: agent.name,
        toAgentId: agent.id,
        toAgentName: agent.name,
        task: initiative.targetOutcome || initiative.description || initiative.title,
        context: "Strategic initiative activated by Strategic Director.",
        priority: initiative.priority,
        status: "pending",
      },
    })
  }

  if (ownerSystem === "email") {
    return prisma.emailExecution.create({
      data: {
        to: "dphogeorge@gmail.com",
        subject: `Strategic Initiative: ${initiative.title}`,
        body:
          `Strategic initiative activated:\n\n${initiative.description || ""}\n\nTarget outcome:\n${initiative.targetOutcome || ""}`,
        status: "approval-required",
        approved: false,
        source: "strategic-director",
        riskLevel: initiative.riskLevel,
        metadata: {
          initiativeId: initiative.id,
        },
      },
    })
  }

  if (ownerSystem === "optimization") {
    return prisma.optimizationAction.create({
      data: {
        title: initiative.title,
        description: initiative.description || initiative.targetOutcome || null,
        actionType: "recommend_process_change",
        targetSystem: "strategic-optimization",
        priority: initiative.priority,
        riskLevel: initiative.riskLevel,
        status: "proposed",
        payload: {
          initiativeId: initiative.id,
          executionPath: initiative.executionPath || [],
        },
      },
    })
  }

  if (ownerSystem === "runtime") {
    return prisma.runtimeObjective.create({
      data: {
        title: initiative.title,
        description: initiative.description || initiative.targetOutcome || null,
        priority: initiative.priority,
        cadence: "daily",
        status: "active",
        metadata: {
          initiativeId: initiative.id,
          ownerSystem,
        },
      },
    })
  }

  return prisma.operationalEvent.create({
    data: {
      type: "strategic-initiative-activated",
      source: "strategic-director",
      title: initiative.title,
      message: initiative.description || initiative.targetOutcome || null,
      severity: initiative.priority === "high" ? "high" : "medium",
      entityType: "StrategicInitiative",
      entityId: initiative.id,
      payload: {
        initiativeId: initiative.id,
        ownerSystem,
      },
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.initiativeId) {
      return NextResponse.json(
        { ok: false, error: "initiativeId is required" },
        { status: 400 }
      )
    }

    const initiative = await prisma.strategicInitiative.findUnique({
      where: { id: body.initiativeId },
    })

    if (!initiative) {
      return NextResponse.json(
        { ok: false, error: "Initiative not found" },
        { status: 404 }
      )
    }

    if (!["proposed", "approved"].includes(initiative.status)) {
      return NextResponse.json(
        { ok: false, error: "Initiative cannot activate in current status" },
        { status: 400 }
      )
    }

    try {
      const result = await activateInitiative(initiative)

      const updated = await prisma.strategicInitiative.update({
        where: { id: initiative.id },
        data: {
          status: "active",
          result,
        },
      })

      await prisma.operationalEvent.create({
        data: {
          type: "strategic-initiative-activated",
          source: "strategic-director",
          title: initiative.title,
          message: initiative.targetOutcome || initiative.description || null,
          severity: initiative.priority === "high" ? "high" : "medium",
          entityType: "StrategicInitiative",
          entityId: initiative.id,
          payload: {
            initiativeId: initiative.id,
            result,
          },
        },
      })

      return NextResponse.json({
        ok: true,
        initiative: updated,
        result,
      })
    } catch (executionError) {
      const failed = await prisma.strategicInitiative.update({
        where: { id: initiative.id },
        data: {
          status: "failed",
          error:
            executionError instanceof Error
              ? executionError.message
              : "Initiative activation failed",
        },
      })

      return NextResponse.json(
        {
          ok: false,
          initiative: failed,
          error:
            executionError instanceof Error
              ? executionError.message
              : "Initiative activation failed",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Strategic initiative activation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Strategic initiative activation failed",
      },
      { status: 500 }
    )
  }
}