import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.incidentId || !body.action) {
      return NextResponse.json(
        { ok: false, error: "incidentId and action are required" },
        { status: 400 }
      )
    }

    const incident = await prisma.resilienceIncident.findUnique({
      where: { id: body.incidentId },
    })

    if (!incident) {
      return NextResponse.json(
        { ok: false, error: "Incident not found" },
        { status: 404 }
      )
    }

    let status = incident.status

    if (body.action === "resolve") status = "resolved"
    if (body.action === "monitor") status = "monitoring"
    if (body.action === "escalate") status = "escalated"

    const updated = await prisma.resilienceIncident.update({
      where: { id: incident.id },
      data: {
        status,
        resolution: body.notes || incident.resolution,
      },
    })

    if (body.action === "escalate") {
      await prisma.governanceRiskSignal.create({
        data: {
          title: `Infrastructure escalation: ${incident.title}`,
          signalType: "infrastructure-risk",
          severity: incident.severity,
          affectedArea: incident.source || "infrastructure",
          description: incident.description || null,
          recommendation: "Review infrastructure incident and define recovery path.",
          status: "open",
          metadata: {
            incidentId: incident.id,
          },
        },
      })
    }

    await prisma.governanceAuditTrail.create({
      data: {
        eventType: "infrastructure-incident-decision",
        actor: "infrastructure-resilience",
        actorRole: "system",
        targetType: "ResilienceIncident",
        targetId: incident.id,
        action: body.action,
        outcome: status,
        severity: incident.severity,
        details: {
          notes: body.notes || null,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      incident: updated,
    })
  } catch (error) {
    console.error("Incident decision failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Incident decision failed",
      },
      { status: 500 }
    )
  }
}