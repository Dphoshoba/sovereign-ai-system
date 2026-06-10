import { NextResponse } from "next/server"
import { buildExecutiveTimeline } from "@/lib/executive/timeline"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const items = await buildExecutiveTimeline()

    return NextResponse.json({
      ok: true,
      items,
      totalItems: items.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to build executive timeline",
      },
      { status: 500 }
    )
  }
}
