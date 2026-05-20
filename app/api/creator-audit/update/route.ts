import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json(
        { ok: false, error: "Audit ID is required" },
        { status: 400 }
      )
    }

    const audit = await prisma.creatorAuditRequest.update({
      where: { id: body.id },
      data: {
        status: body.status,
        opportunityScore:
          typeof body.opportunityScore === "number"
            ? body.opportunityScore
            : undefined,
        auditSummary: body.auditSummary,
        recommendedSystems: body.recommendedSystems,
        nextActions: body.nextActions,
        proposalDraft: body.proposalDraft,
      },
    })

    return NextResponse.json({ ok: true, audit })
  } catch (error) {
    console.error("Creator audit update failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to update creator audit" },
      { status: 500 }
    )
  }
}