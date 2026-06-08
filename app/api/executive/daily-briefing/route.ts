import { NextResponse } from "next/server"
import { generateDailyBriefing } from "@/lib/executive/daily-briefing"

export async function GET() {
  try {
    const briefing = await generateDailyBriefing()

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
