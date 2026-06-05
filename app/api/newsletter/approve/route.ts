import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { newsletterId, approvedBy } = await req.json()

    if (!newsletterId) {
      return NextResponse.json(
        { ok: false, error: "Missing newsletterId" },
        { status: 400 }
      )
    }

    const newsletter = await prisma.newsletter.update({
      where: { id: newsletterId },
      data: {
        status: "approved",
        approvedAt: new Date(),
        approvedBy: approvedBy || "system",
      },
    })

    return NextResponse.json({
      ok: true,
      newsletter,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Approval failed",
      },
      { status: 500 }
    )
  }
}
