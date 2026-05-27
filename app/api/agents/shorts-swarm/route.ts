import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { shortsSwarmAgent } from "../../../../lib/agents/shorts-swarm-agent"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    let script = body.script || ""

    if (!script && body.youtubePostId) {
      const post = await prisma.youTubePost.findUnique({
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

    const result = await shortsSwarmAgent({
      script,
      persona: body.persona || "creators",
      style: body.style || "viral cinematic",
      count: Number(body.count || 10),
    })

    let updatedPost = null

    if (body.youtubePostId) {
      updatedPost = await prisma.youTubePost.update({
        where: {
          id: body.youtubePostId,
        },
        data: {
          status: "shorts_swarm_generated",
        },
      })
    }

    return NextResponse.json({
      ok: true,
      result,
      updatedPost,
    })
  } catch (error) {
    console.error("Shorts swarm failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Shorts swarm failed",
      },
      {
        status: 500,
      }
    )
  }
}