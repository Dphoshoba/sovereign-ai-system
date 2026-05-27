import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { voiceoverDirectorAgent } from "../../../../lib/agents/voiceover-director-agent"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    let script = body.script || ""

    if (!script && body.youtubePostId) {
      const post =
        await prisma.youTubePost.findUnique({
          where: {
            id: body.youtubePostId,
          },
        })

      script = post?.fullScript || ""
    }

    if (!script) {
      return NextResponse.json(
        {
          ok: false,
          error: "Script required",
        },
        {
          status: 400,
        }
      )
    }

    const result =
      await voiceoverDirectorAgent({
        script,
        persona:
          body.persona ||
          "creators",
        style:
          body.style ||
          "cinematic",
      })

    let updatedPost = null

    if (body.youtubePostId) {
      updatedPost = await prisma.youTubePost.update({
        where: {
          id: body.youtubePostId,
        },
        data: {
          status: "voiceover_directed",
        },
      })
    }

    return NextResponse.json({
      ok: true,
      result,
      updatedPost,
    })
  } catch (error) {
    console.error(
      "Voiceover director failed:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          "Voiceover director failed",
      },
      {
        status: 500,
      }
    )
  }
}