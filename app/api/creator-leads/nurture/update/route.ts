import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json(
        { ok: false, error: "Event ID is required" },
        { status: 400 }
      )
    }

    const event = await prisma.creatorNurtureEvent.update({
      where: { id: body.id },
      data: {
        status: body.status,
        sentAt: body.status === "sent" ? new Date() : undefined,
      },
    })

    return NextResponse.json({
      ok: true,
      event,
    })
  } catch (error) {
    console.error("Nurture event update failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to update nurture event" },
      { status: 500 }
    )
  }
}