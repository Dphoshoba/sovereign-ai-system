import { NextResponse } from "next/server"
import { generateDailyBriefing } from "@/lib/executive/daily-briefing"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

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
