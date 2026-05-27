import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { scriptGenerationAgent } from "../../../../lib/agents/script-generation-agent"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const result = await scriptGenerationAgent({
      topic: body.topic || "AI Automation",
      persona: body.persona || "creators",
      durationMinutes: Number(body.durationMinutes || 8),
      style: body.style || "cinematic educational",
    })

    let savedPost = null

    if (body.youtubePostId) {
      savedPost = await prisma.youTubePost.update({
        where: {
          id: body.youtubePostId,
        },
        data: {
          fullScript: result.generatedScript,
          title: result.topic,
          status: "script_generated",
        },
      })
    }

    return NextResponse.json({
      ok: true,
      result,
      savedPost,
    })
  } catch (error) {
    console.error(
      "Script generation failed:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          "Script generation failed",
      },
      {
        status: 500,
      }
    )
  }
}