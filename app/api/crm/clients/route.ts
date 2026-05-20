import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const clients = await prisma.clientProfile.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({ ok: true, clients })
  } catch (error) {
    console.error("Client fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch clients" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const client = await prisma.clientProfile.create({
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        type: body.type || "lead",
        status: body.status || "new",
        source: body.source || null,
        interests: body.interests || null,
        notes: body.notes || null,
        tags: body.tags || null,
      },
    })

    return NextResponse.json({ ok: true, client })
  } catch (error) {
    console.error("Client save failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to save client" },
      { status: 500 }
    )
  }
}