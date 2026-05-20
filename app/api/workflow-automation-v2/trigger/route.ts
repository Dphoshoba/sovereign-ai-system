import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function runAction(action: any, event: any, runId: string) {
  const payload = event.payload || {}

  if (action.actionType === "create-follow-up-task") {
    return prisma.creatorAutomationAction.create({
      data: {
        source: "workflow-automation-v2",
        title: action.title || "Follow up with creator lead",
        description: event.message || "Workflow-generated follow-up task.",
        actionType: "follow_up_lead",
        priority: "high",
        leadId: payload.leadId || event.entityId || null,
        status: "pending",
        payload: {
          eventId: event.id,
          runId,
          sourceEventType: event.type,
        },
      },
    })
  }

  if (action.actionType === "create-email-draft") {
    const lead = payload.leadId || event.entityId
      ? await prisma.creatorLead.findUnique({
          where: { id: payload.leadId || event.entityId },
        })
      : null

    if (!lead?.email) {
      throw new Error("No lead email found for email draft")
    }

    return prisma.emailExecution.create({
      data: {
        to: lead.email,
        subject: "Your Creator Automation Audit",
        body:
          `Hello