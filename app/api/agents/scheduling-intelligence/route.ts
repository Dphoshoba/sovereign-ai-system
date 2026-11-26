import { NextRequest, NextResponse } from "next/server"

import { schedulingIntelligenceAgent } from "../../../../lib/agents/scheduling-intelligence-agent"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function POST(req: NextRequest) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const body = await req.json()

    const result = schedulingIntelligenceAgent({
      audienceRegion: body.audienceRegion,

      audienceType: body.audienceType,

      contentType: body.contentType,
    })

    return NextResponse.json({
      ok: true,
      result,
    })
  } catch (error) {
    console.error("Scheduling intelligence failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Scheduling intelligence failed",
      },
      {
        status: 500,
      }
    )
  }
}