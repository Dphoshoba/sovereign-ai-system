import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const now = new Date()

    const result = await prisma.article.updateMany({
      where: {
        status: "scheduled",
        scheduledFor: {
          lte: now,
        },
      },
      data: {
        status: "published",
        publishedAt: now,
      },
    })

    return NextResponse.json({
      ok: true,
      published: result.count,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { ok: false, error: "Failed to publish scheduled articles" },
      { status: 500 }
    )
  }
}