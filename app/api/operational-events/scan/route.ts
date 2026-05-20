import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const [leads, audits, proposals, invoices, automations, missions] =
      await Promise.all([
        prisma.creatorLead.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
        prisma.creatorAuditRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
        prisma.creatorProposal.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
        prisma.creatorInvoice.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
        prisma.creatorAutomationAction.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
        prisma.autonomousMissionTask.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      ])

    const createdEvents = []

    for (const lead of leads) {
      if (lead.leadScore >= 85 || ["ready", "urgent"].includes(lead.readiness)) {
        const event = await prisma.operationalEvent.create({
          data: {
            type: "hot-lead-detected",
            source: "creator-crm",
            title: `Hot creator lead detected: ${lead.name}`,
            message: `${lead.name} has score ${lead.leadScore} and readiness ${lead.readiness}.`,
            severity: "high",
            entityType: "CreatorLead",
            entityId: lead.id,
            payload: { leadId: lead.id },
          },
        })

        createdEvents.push(event)
      }
    }

    for (const audit of audits) {
      if (audit.opportunityScore >= 80 && audit.status !== "closed") {
        const event = await prisma.operationalEvent.create({
          data: {
            type: "high-opportunity-audit",
            source: "creator-audit",
            title: `High-opportunity audit: ${audit.name}`,
            message: `${audit.name} has opportunity score ${audit.opportunityScore}.`,
            severity: "high",
            entityType: "CreatorAuditRequest",
            entityId: audit.id,
            payload: { auditId: audit.id },
          },
        })

        createdEvents.push(event)
      }
    }

    for (const invoice of invoices) {
      if (invoice.status === "sent") {
        const event = await prisma.operationalEvent.create({
          data: {
            type: "invoice-awaiting-payment",
            source: "creator-revenue",
            title: `Invoice awaiting payment: ${invoice.invoiceNumber}`,
            message: `Invoice ${invoice.invoiceNumber} for AUD ${invoice.amount} is currently sent.`,
            severity: "medium",
            entityType: "CreatorInvoice",
            entityId: invoice.id,
            payload: { invoiceId: invoice.id },
          },
        })

        createdEvents.push(event)
      }
    }

    for (const action of automations) {
      if (action.priority === "high" && action.status === "pending") {
        const event = await prisma.operationalEvent.create({
          data: {
            type: "high-priority-automation",
            source: "creator-automation-engine",
            title: `High-priority automation pending: ${action.title}`,
            message: action.description || null,
            severity: "high",
            entityType: "CreatorAutomationAction",
            entityId: action.id,
            payload: { actionId: action.id },
          },
        })

        createdEvents.push(event)
      }
    }

    for (const mission of missions) {
      if (mission.priority === "high" && mission.status === "pending") {
        const event = await prisma.operationalEvent.create({
          data: {
            type: "mission-task-pending",
            source: "autonomous-missions",
            title: `High-priority mission pending: ${mission.agentName}`,
            message: mission.task,
            severity: "high",
            entityType: "AutonomousMissionTask",
            entityId: mission.id,
            payload: { taskId: mission.id },
          },
        })

        createdEvents.push(event)
      }
    }

    return NextResponse.json({
      ok: true,
      events: createdEvents,
      count: createdEvents.length,
    })
  } catch (error) {
    console.error("Operational scan failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Operational scan failed",
      },
      { status: 500 }
    )
  }
}