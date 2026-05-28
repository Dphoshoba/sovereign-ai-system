import { NextRequest, NextResponse } from "next/server"
import { youtubeAnalyticsAgent } from "../../../../lib/agents/youtube-analytics-agent"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.accessToken) {
      return NextResponse.json(
        { ok: false, error: "accessToken required" },
        { status: 400 }
      )
    }

    if (!body.videoId) {
      return NextResponse.json(
        { ok: false, error: "videoId required" },
        { status: 400 }
      )
    }

    const result = await youtubeAnalyticsAgent({
      accessToken: body.accessToken,
      videoId: body.videoId,
    })

    return NextResponse.json({
      ok: true,
      result,
    })
  } catch (error) {
    console.error("YouTube analytics failed:", error)

    return NextResponse.json(
      { ok: false, error: "YouTube analytics failed" },
      { status: 500 }
    )
  }
}
