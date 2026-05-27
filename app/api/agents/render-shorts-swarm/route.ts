import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const youtubePostId = body.youtubePostId

    if (!youtubePostId) {
      return NextResponse.json(
        { ok: false, error: "youtubePostId required" },
        { status: 400 }
      )
    }

    const renderResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/youtube/generate-shorts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          youtubePostId,
        }),
      }
    )

    const renderResult = await renderResponse.json()

    if (!renderResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Shorts render failed",
          details: renderResult,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: "Shorts swarm render started/completed",
      renderResult,
    })
  } catch (error) {
    console.error("Render Shorts swarm failed:", error)

    return NextResponse.json(
      { ok: false, error: "Render Shorts swarm failed" },
      { status: 500 }
    )
  }
}