import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const events = await prisma.aiActivityEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({
      ok: true,
      events,
    })
  } catch (error) {
    console.error("Failed to fetch activity:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch activity" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const event = await prisma.aiActivityEvent.create({
      data: {
        type: body.type || "system",
        title: body.title,
        message: body.message || null,
        status: body.status || "info",
        metadata: body.metadata || {},
      },
    })

    return NextResponse.json({
      ok: true,
      event,
    })
  } catch (error) {
    console.error("Failed to create activity:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to create activity" },
      { status: 500 }
    )
  }
}