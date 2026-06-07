import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const result = await prisma.subscriber.updateMany({
      where: {
        source: null,
      },
      data: {
        source: "legacy",
      },
    })

    return NextResponse.json({
      ok: true,
      updated: result.count,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Backfill failed",
      },
      { status: 500 }
    )
  }
}