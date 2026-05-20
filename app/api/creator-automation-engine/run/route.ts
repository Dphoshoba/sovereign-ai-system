import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function runAction(action: any) {
  const payload = action.payload || {}

  if (action.actionType === "follow_up_lead") {
    return prisma.creatorNurtureEvent.create({
      data: {
        leadId: action.leadId,
        type: "follow-up",
        subject: payload.subject || "Following up on your Creator Automation Starter Pack",
        body:
          payload.body ||
          "Thanks again for downloading the Creator Automation Starter Pack. The next wise step is to review your current workflow and identify where automation can help without weakening your voice.",
        status: "draft",
        metadata: payload,
      },
    })
  }

  if (action.actionType === "mark_hot_lead") {
    return prisma.creatorLead.update({
      where: { id: action.leadId },
      data: {
        readiness: "urgent",
        leadScore: 90,
        status: "contacted",
      },
    })
  }

  if (action.actionType === "schedule_audit_reminder") {
    return prisma.creatorNurtureEvent.create({
      data: {
        leadId: action.leadId,
        type: "audit-reminder",
        subject: payload.subject || "Ready to map your creator automation system?",
        body:
          payload.body ||
          "Your starter pack gives the blueprint. The audit helps identify which system your creator work needs first.",
        status: "draft",
        metadata: payload,
      },
    })
  }

  if (action.actionType === "advance_audit_stage") {
    return prisma.creatorAuditRequest.update({
      where: { id: action.auditId },
      data: {
        status: payload.status || "strategy-ready",
      },
    })
  }

  if (action.actionType === "generate_proposal_task") {
    return prisma.creatorAutomationAction.create({
      data: {
        source: "audit",
        title: payload.title || "Prepare creator automation proposal",
        description:
          payload.description ||
          "Review the audit summary and prepare a Creator Automation Package proposal.",
        actionType: "log_activity",
        priority: "high",
        leadId: action.leadId || null,
        auditId: action.auditId || null,
        payload,
        status: "pending",
      },
    })
  }

  if (action.actionType === "send_nurture_reminder") {
    return prisma.creatorNurtureEvent.update({
      where: { id: payload.eventId },
      data: {
        status: "approved",
      },
    })
  }

  if (action.actionType === "log_activity") {
    return prisma.aiActivityEvent.create({
      data: {
        type: "creator-automation",
        title: action.title,
        message: action.description || null,
        status: "info",
        metadata: {
          actionId: action.id,
          payload,
        },
      },
    })
  }

  throw new Error(`Unsupported action type: ${action.actionType}`)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const actionId = body.actionId as string

    if (!actionId) {
      return NextResponse.json(
        { ok: false, error: "actionId is required" },
        { status: 400 }
      )
    }

    const action = await prisma.creatorAutomationAction.findUnique({
      where: { id: actionId },
    })

    if (!action) {
      return NextResponse.json(
        { ok: false, error: "Automation action not found" },
        { status: 404 }
      )
    }

    if (action.status !== "pending" && action.status !== "approved") {
      return NextResponse.json(
        { ok: false, error: "Action cannot run in current status" },
        { status: 400 }
      )
    }

    const result = await runAction(action)

    const updatedAction = await prisma.creatorAutomationAction.update({
      where: { id: action.id },
      data: {
        status: "completed",
        result,
      },
    })

    return NextResponse.json({
      ok: true,
      action: updatedAction,
      result,
    })
  } catch (error) {
    console.error("Automation action failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Automation action failed",
      },
      { status: 500 }
    )
  }
}