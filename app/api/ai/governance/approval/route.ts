import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const approval = await prisma.aiApprovalRequest.update({
      where: { id: body.id },
      data: {
        status: body.status,
        reason: body.reason || null,
      },
    })

    await prisma.aiActivityEvent.create({
      data: {
        type: "governance",
        title: `Approval ${body.status}: ${approval.action}`,
        message: body.reason || null,
        status: body.status === "approved" ? "success" : "warning",
        metadata: approval,
      },
    })

    return NextResponse.json({
      ok: true,
      approval,
    })
  } catch (error) {
    console.error("Approval update failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to update approval" },
      { status: 500 }
    )
  }
}