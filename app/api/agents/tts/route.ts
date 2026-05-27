import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ttsAgent } from "../../../../lib/agents/tts-agent"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    let text = body.text || ""

    if (!text && body.youtubePostId) {
      const post = await prisma.youTubePost.findUnique({
        where: {
          id: body.youtubePostId,
        },
      })

      text = post?.fullScript || ""
    }

    if (!text) {
      return NextResponse.json(
        {
          ok: false,
          error: "Text required",
        },
        {
          status: 400,
        }
      )
    }

    const result = await ttsAgent({
      text,
      filename: body.filename || `voiceover-${Date.now()}.mp3`,
      voice: body.voice || "alloy",
    })

    return NextResponse.json({
      ok: true,
      result,
    })
  } catch (error) {
    console.error("TTS generation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "TTS generation failed",
      },
      {
        status: 500,
      }
    )
  }
}
