import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))

    if (!body.incidentId) {
      return NextResponse.json(
        {
          ok: false,
          error: "incidentId is required",
        },
        { status: 400 }
      )
    }

    const status = body.status || "resolved"

    const incident = await prisma.resilienceIncident.update({
      where: {
        id: body.incidentId,
      },
      data: {
        status,
      },
    })

    if (body.action === "escalate") {
      await prisma.governanceRiskSignal.create({
        data: {
          signalType: "infrastructure-incident",
          title: `Infrastructure incident escalated: ${incident.title}`,
          severity: "high",
          status: "open",
          description: body.notes || incident.summary || null,
        },
      })
    }

    return NextResponse.json({
      ok: true,
      incident,
    })
  } catch (error) {
    console.error("Infrastructure incident update failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Infrastructure incident update failed",
      },
      { status: 500 }
    )
  }
}