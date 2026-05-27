import path from "path"
import { NextRequest, NextResponse } from "next/server"
import { youtubePublisherAgent } from "../../../../lib/agents/youtube-publisher-agent"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.accessToken) {
      return NextResponse.json(
        { ok: false, error: "accessToken required" },
        { status: 400 }
      )
    }

    if (!body.videoFile) {
      return NextResponse.json(
        { ok: false, error: "videoFile required" },
        { status: 400 }
      )
    }

    const videoPath = path.join(process.cwd(), "public", body.videoFile)

    const result = await youtubePublisherAgent({
      accessToken: body.accessToken,
      videoPath,
      title: body.title || "Untitled Video",
      description: body.description || "",
      tags: body.tags || [],
      privacyStatus: body.privacyStatus || "private",
    })

    return NextResponse.json({
      ok: true,
      result,
    })
  } catch (error) {
    console.error("YouTube publish failed:", error)

    return NextResponse.json(
      { ok: false, error: "YouTube publish failed" },
      { status: 500 }
    )
  }
}