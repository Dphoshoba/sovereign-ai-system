import { NextResponse } from "next/server"
import { generateRecommendationImprovements } from "@/lib/executive/recommendation-improvement"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const improvement = await generateRecommendationImprovements()

    return NextResponse.json({
      ok: true,
      improvement,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate recommendation improvements",
      },
      { status: 500 }
    )
  }
}
