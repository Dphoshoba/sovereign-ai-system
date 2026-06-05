import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { newsletterId } = await req.json()

    if (!newsletterId) {
      return NextResponse.json(
        { ok: false, error: "Missing newsletterId" },
        { status: 400 }
      )
    }

    const newsletter = await prisma.newsletter.update({
      where: { id: newsletterId },
      data: {
        status: "rejected",
        approvedAt: null,
        approvedBy: null,
      },
    })

    return NextResponse.json({ ok: true, newsletter })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Rejection failed",
      },
      { status: 500 }
    )
  }
}
