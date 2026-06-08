import { NextResponse } from "next/server"
import { buildDailyBriefing } from "@/lib/executive/daily-briefing"
import { getExecutivePlatformSnapshot } from "@/lib/executive/platform-snapshot"
import { buildExecutiveRecommendations } from "@/lib/executive/recommendations"

export async function GET() {
  try {
    const snapshot = await getExecutivePlatformSnapshot()
    const recommendations = buildExecutiveRecommendations(snapshot)
    const briefing = buildDailyBriefing(snapshot, recommendations)

    return NextResponse.json({
      ok: true,
      briefing,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Executive daily briefing failed",
      },
      { status: 500 }
    )
  }
}
