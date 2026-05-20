import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type ToolAction =
  | "save_memory"
  | "create_job"
  | "log_activity"
  | "create_crm_client"

async function executeTool(action: ToolAction, payload: any) {
  if (action === "save_memory") {
    return prisma.aiMemory.create({
      data: {
        type: payload.type || "general",
        title: payload.title,
        content: payload.content,
        source: payload.source || "tool-execution",
        tags: payload.tags || null,
      },
    })
  }

  if (action === "create_job") {
    return prisma.aiJob.create({
      data: {
        type: payload.type,
        payload: payload.payload || {},
        scheduledAt: payload.scheduledAt
          ? new Date(payload.scheduledAt)
          : new Date(),
      },
    })
  }

  if (action === "log_activity") {
    return prisma.aiActivityEvent.create({
      data: {
        type: payload.type || "agent-action",
        title: payload.title,
        message: payload.message || null,
        status: payload.status || "info",
        metadata: payload.metadata || {},
      },
    })
  }

  if (action === "create_crm_client") {
    return prisma.clientProfile.create({
      data: {
        name: payload.name,
        email: payload.email || null,
        phone: payload.phone || null,
        type: payload.type || "lead",
        status: payload.status || "new",
        source: payload.source || "agent-action",
        interests: payload.interests || null,
        notes: payload.notes || null,
        tags: payload.tags || null,
      },
    })
  }

  throw new Error(`Unsupported tool action: ${action}`)
}

async function checkGovernance(action: ToolAction, payload: any) {
  const agentId = payload.agentId || null
  const department = payload.department || null

  const rule = await prisma.aiPermissionRule.findFirst({
    where: {
      action,
      OR: [
        agentId ? { agentId } : {},
        department ? { department } : {},
        { agentId: null, department: null },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  if (!rule) {
    return {
      allowed: false,
      requiresApproval: true,
      reason: "No permission rule exists for this action.",
    }
  }

  return {
    allowed: rule.allowed,
    requiresApproval: rule.requiresApproval,
    reason: rule.notes || null,
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const action = body.action as ToolAction
    const payload = body.payload || {}

    const allowedActions: ToolAction[] = [
      "save_memory",
      "create_job",
      "log_activity",
      "create_crm_client",
    ]

    if (!allowedActions.includes(action)) {
      return NextResponse.json(
        { ok: false, error: "Unsupported or unsafe tool action" },
        { status: 400 }
      )
    }

    const governance = await checkGovernance(action, payload)

    if (!governance.allowed) {
      const approval = await prisma.aiApprovalRequest.create({
        data: {
          action,
          payload,
          status: "pending",
          reason: governance.reason || "Action requires review.",
        },
      })

      await prisma.aiActivityEvent.create({
        data: {
          type: "governance",
          title: `Tool blocked pending approval: ${action}`,
          message: governance.reason,
          status: "warning",
          metadata: { approvalId: approval.id, action, payload },
        },
      })

      return NextResponse.json({
        ok: false,
        needsApproval: true,
        approval,
        error: "This action is blocked or requires approval.",
      })
    }

    if (governance.requiresApproval) {
      const approval = await prisma.aiApprovalRequest.create({
        data: {
          action,
          payload,
          status: "pending",
          reason: governance.reason || "Approval required before execution.",
        },
      })

      return NextResponse.json({
        ok: false,
        needsApproval: true,
        approval,
        error: "Approval required before execution.",
      })
    }

    const result = await executeTool(action, payload)

    await prisma.aiActivityEvent.create({
      data: {
        type: "tool-execution",
        title: `Tool executed: ${action}`,
        message: "Approved internal tool action executed.",
        status: "success",
        metadata: {
          action,
          payload,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      action,
      result,
    })
  } catch (error) {
    console.error("Tool execution failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Tool execution failed",
      },
      { status: 500 }
    )
  }
}