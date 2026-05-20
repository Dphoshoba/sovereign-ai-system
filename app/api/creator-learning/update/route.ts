import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json(
        { ok: false, error: "Memory ID is required" },
        { status: 400 }
      )
    }

    const memory = await prisma.creatorLearningMemory.update({
      where: { id: body.id },
      data: {
        status: body.status,
        priority: body.priority,
        confidence:
          typeof body.confidence === "number" ? body.confidence : undefined,
        insight: body.insight,
        title: body.title,
      },
    })

    return NextResponse.json({
      ok: true,
      memory,
    })
  } catch (error) {
    console.error("Learning memory update failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to update learning memory" },
      { status: 500 }
    )
  }
}