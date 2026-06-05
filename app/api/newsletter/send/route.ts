import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { newsletterId } = await req.json()

    if (!newsletterId) {
      return NextResponse.json(
        { ok: false, error: "Missing newsletterId" },
        { status: 400 }
      )
    }

    const newsletter = await prisma.newsletter.findUnique({
      where: {
        id: newsletterId,
      },
    })

    if (!newsletter) {
      return NextResponse.json(
        { ok: false, error: "Newsletter not found" },
        { status: 404 }
      )
    }

    if (newsletter.status !== "approved") {
      return NextResponse.json(
        { ok: false, error: "Newsletter must be approved first" },
        { status: 403 }
      )
    }

    const updated = await prisma.newsletter.update({
      where: {
        id: newsletter.id,
      },
      data: {
        status: "sent",
        sentAt: new Date(),
      },
    })

    return NextResponse.json({
      ok: true,
      message: "Newsletter marked as sent",
      newsletter: updated,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Send failed",
      },
      { status: 500 }
    )
  }
}