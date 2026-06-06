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
      where: { id: newsletterId },
    })

    if (!newsletter) {
      return NextResponse.json(
        { ok: false, error: "Newsletter not found" },
        { status: 404 }
      )
    }

    if (newsletter.status === "sent") {
      return NextResponse.json(
        { ok: false, error: "Sent newsletters cannot be deleted." },
        { status: 403 }
      )
    }

    await prisma.newsletter.delete({
      where: { id: newsletterId },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Delete failed",
      },
      { status: 500 }
    )
  }
}