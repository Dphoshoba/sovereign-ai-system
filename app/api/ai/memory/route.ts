import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const memories = await prisma.aiMemory.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({
      ok: true,
      memories,
    })
  } catch (error) {
    console.error("Memory fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch memories" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const memory = await prisma.aiMemory.create({
      data: {
        type: body.type || "general",
        title: body.title,
        content: body.content,
        source: body.source || null,
        tags: body.tags || null,
      },
    })

    return NextResponse.json({
      ok: true,
      memory,
    })
  } catch (error) {
    console.error("Memory save failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to save memory" },
      { status: 500 }
    )
  }
}