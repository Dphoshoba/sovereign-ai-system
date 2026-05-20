import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const rules = await prisma.aiPermissionRule.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    const approvals = await prisma.aiApprovalRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({
      ok: true,
      rules,
      approvals,
    })
  } catch (error) {
    console.error("Governance fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch governance data" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const rule = await prisma.aiPermissionRule.create({
      data: {
        agentId: body.agentId || null,
        department: body.department || null,
        action: body.action,
        allowed: Boolean(body.allowed),
        requiresApproval:
          typeof body.requiresApproval === "boolean"
            ? body.requiresApproval
            : true,
        notes: body.notes || null,
      },
    })

    await prisma.aiActivityEvent.create({
      data: {
        type: "governance",
        title: `Permission rule created: ${rule.action}`,
        message: rule.allowed ? "Action allowed" : "Action blocked",
        status: "success",
        metadata: rule,
      },
    })

    return NextResponse.json({
      ok: true,
      rule,
    })
  } catch (error) {
    console.error("Governance save failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to save permission rule" },
      { status: 500 }
    )
  }
}