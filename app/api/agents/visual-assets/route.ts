import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { visualAssetAgent } from "../../../../lib/agents/visual-asset-agent"

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

    const result = await visualAssetAgent({
      script,
      persona: body.persona || "creators",
      style: body.style || "cinematic",
    })

    let updatedPost = null

    if (body.youtubePostId) {
      updatedPost = await prisma.youTubePost.update({
        where: {
          id: body.youtubePostId,
        },
        data: {
          status: "visual_assets_generated",
        },
      })
    }

    return NextResponse.json({
      ok: true,
      result,
      updatedPost,
    })
  } catch (error) {
    console.error("Visual asset generation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Visual asset generation failed",
      },
      {
        status: 500,
      }
    )
  }
}
