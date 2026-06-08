import { NextResponse } from "next/server"
import { getExecutivePlatformSnapshot } from "@/lib/executive/platform-snapshot"
import { buildExecutiveRecommendations } from "@/lib/executive/recommendations"

export async function GET() {
  try {
    const snapshot = await getExecutivePlatformSnapshot()
    const recommendations = buildExecutiveRecommendations(snapshot)

    return NextResponse.json({
      ok: true,
      recommendations,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Executive recommendations failed",
      },
      { status: 500 }
    )
  }
}
