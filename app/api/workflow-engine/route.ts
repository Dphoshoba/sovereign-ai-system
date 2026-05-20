import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const starterWorkflows = [
  {
    name: "Hot Lead Recovery Workflow",
    description:
      "Escalates and follows up high-value creator leads automatically.",
    triggerType: "hot-lead-detected",
    riskLevel: "medium",
    config: {
      steps: [
        "create-operational-event",
        "create-follow-up-task",
        "draft-email",
        "assign-agent",
        "create-mission",
      ],
    },
  },
  {
    name: "Proposal Recovery Workflow",
    description:
      "Detects stalled proposals and initiates recovery outreach.",
    triggerType: "proposal-stalled",
    riskLevel: "medium",
    config: {
      steps: [
        "notify-revenue-ops",
        "draft-followup-email",
        "create-operational-event",
      ],
    },
  },
]

export async function GET() {
  try {
    let workflows = await prisma.workflowDefinition.findMany({
      orderBy: { createdAt: "asc" },
    })

    if (workflows.length === 0) {
      await prisma.workflowDefinition.createMany({
        data: starterWorkflows,
      })

      workflows = await prisma.workflowDefinition.findMany({
        orderBy: { createdAt: "asc" },
      })
    }

    const executions = await prisma.workflowExecution.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    const actions = await prisma.workflowAction.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    })

    return NextResponse.json({
      ok: true,
      workflows,
      executions,
      actions,
    })
  } catch (error) {
    console.error("Workflow engine fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch workflow engine" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.triggerType) {
      return NextResponse.json(
        { ok: false, error: "triggerType is required" },
        { status: 400 }
      )
    }

    const workflows = await prisma.workflowDefinition.findMany({
      where: {
        enabled: true,
        triggerType: body.triggerType,
      },
    })

    const createdExecutions = []

    for (const workflow of workflows) {
      const config = workflow.config as any

      const execution = await prisma.workflowExecution.create({
        data: {
          workflowId: workflow.id,
          workflowName: workflow.name,
          triggerType: workflow.triggerType,
          triggerSource: body.source || "manual",
          status: "running",
          currentStep: config?.steps?.[0] || null,
          completedSteps: [],
          payload: body.payload || {},
        },
      })

      const steps = config?.steps || []

      for (const step of steps) {
        const action = await prisma.workflowAction.create({
          data: {
            executionId: execution.id,
            actionType: step,
            title: `${workflow.name} → ${step}`,
            status: "completed",
            executedAt: new Date(),
            payload: body.payload || {},
            result: {
              simulated: true,
              executedBy: "workflow-engine-v2",
            },
          },
        })

        if (step === "create-operational-event") {
          await prisma.operationalEvent.create({
            data: {
              type: "workflow-action-executed",
              source: "workflow-engine",
              title: `${workflow.name}: ${step}`,
              message: `Workflow action executed successfully.`,
              severity: "medium",
              entityType: "WorkflowAction",
              entityId: action.id,
              payload: {
                executionId: execution.id,
                workflowName: workflow.name,
              },
            },
          })
        }

        if (step.includes("email")) {
          await prisma.emailExecution.create({
            data: {
              to: body.payload?.email || "dphogeorge@gmail.com",
              subject: `[Workflow] ${workflow.name}`,
              body:
                "This automated workflow detected a strategic operational event and generated a workflow communication.",
              status: "approval-required",
              approved: false,
              source: "workflow-engine-v2",
              metadata: {
                executionId: execution.id,
                workflow: workflow.name,
              },
            },
          })
        }

        if (step === "assign-agent") {
          const agent = await prisma.executiveAgent.findFirst({
            where: { status: "active" },
          })

          if (agent) {
            await prisma.agentDelegation.create({
              data: {
                agentId: agent.id,
                title: `${workflow.name} delegation`,
                description:
                  "Workflow engine assigned operational delegation.",
                status: "assigned",
                priority: "high",
              },
            })
          }
        }

        if (step === "create-mission") {
          await prisma.autonomousMissionTask.create({
            data: {
              title: `${workflow.name} mission`,
              description:
                "Workflow-generated mission task from event-driven automation.",
              status: "queued",
              priority: "high",
            },
          })
        }
      }

      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: "completed",
          currentStep: null,
          completedAt: new Date(),
          completedSteps: steps,
        },
      })

      createdExecutions.push(execution)
    }

    return NextResponse.json({
      ok: true,
      executions: createdExecutions,
    })
  } catch (error) {
    console.error("Workflow execution failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Workflow execution failed",
      },
      { status: 500 }
    )
  }
}