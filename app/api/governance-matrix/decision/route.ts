import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.type || !body.id || !body.action) {
      return NextResponse.json(
        { ok: false, error: "type, id and action are required" },
        { status: 400 }
      )
    }

    if (body.type === "approval") {
      const updated = await prisma.governanceApproval.update({
        where: { id: body.id },
        data: {
          status: body.action === "approve" ? "approved" : "rejected",
          decisionNotes: body.notes || null,
          approvedAt:
            body.action === "approve" ? new Date() : null,
          rejectedAt:
            body.action === "reject" ? new Date() : null,
        },
      })

      await prisma.operationalEvent.create({
        data: {
          type: "governance-approval-decision",
          source: "governance-matrix",
          title: updated.title,
          message: `Approval ${updated.status}`,
          severity: "medium",
          entityType: "GovernanceApproval",
          entityId: updated.id,
        },
      })

      return NextResponse.json({
        ok: true,
        item: updated,
      })
    }

    if (body.type === "arbitration") {
      const updated = await prisma.governanceArbitration.update({
        where: { id: body.id },
        data: {
          status: body.action === "resolve" ? "resolved" : "dismissed",
          resolution: {
            notes: body.notes || null,
            action: body.action,
          },
        },
      })

      await prisma.operationalEvent.create({
        data: {
          type: "governance-arbitration-decision",
          source: "governance-matrix",
          title: updated.title,
          message: `Arbitration ${updated.status}`,
          severity:
            updated.severity === "critical"
              ? "critical"
              : "medium",
          entityType: "GovernanceArbitration",
          entityId: updated.id,
        },
      })

      return NextResponse.json({
        ok: true,
        item: updated,
      })
    }

    if (body.type === "risk") {
      const updated = await prisma.governanceRiskSignal.update({
        where: { id: body.id },
        data: {
          status:
            body.action === "close"
              ? "closed"
              : body.action === "escalate"
                ? "escalated"
                : "monitoring",
        },
      })

      await prisma.operationalEvent.create({
        data: {
          type: "governance-risk-decision",
          source: "governance-matrix",
          title: updated.title,
          message: `Risk signal ${updated.status}`,
          severity:
            updated.severity === "critical"
              ? "critical"
              : "medium",
          entityType: "GovernanceRiskSignal",
          entityId: updated.id,
        },
      })

      return NextResponse.json({
        ok: true,
        item: updated,
      })
    }

    return NextResponse.json(
      { ok: false, error: "Unsupported governance type" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Governance decision failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Governance decision failed",
      },
      { status: 500 }
    )
  }
}