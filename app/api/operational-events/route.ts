import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const events = await prisma.operationalEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    })

    return NextResponse.json({
      ok: true,
      events,
    })
  } catch (error) {
    console.error("Operational events fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch operational events" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.type || !body.source || !body.title) {
      return NextResponse.json(
        { ok: false, error: "type, source and title are required" },
        { status: 400 }
      )
    }

    const event = await prisma.operationalEvent.create({
      data: {
        type: body.type,
        source: body.source,
        title: body.title,
        message: body.message || null,
        severity: body.severity || "info",
        status: body.status || "new",
        entityType: body.entityType || null,
        entityId: body.entityId || null,
        payload: body.payload || {},
      },
    })

    return NextResponse.json({
      ok: true,
      event,
    })
  } catch (error) {
    console.error("Operational event create failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to create operational event" },
      { status: 500 }
    )
  }
}