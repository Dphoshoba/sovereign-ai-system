import { NextResponse } from "next/server"
import { buildRevenueIntelligence } from "@/lib/executive/revenue-intelligence"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const intelligence = await buildRevenueIntelligence()

    return NextResponse.json({
      ok: true,
      intelligence,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to build revenue intelligence",
      },
      { status: 500 }
    )
  }
}
