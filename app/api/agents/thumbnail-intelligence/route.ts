import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { thumbnailIntelligenceAgent } from "../../../../lib/agents/thumbnail-intelligence-agent"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    let title = body.title || ""

    if (!title && body.youtubePostId) {
      const post = await prisma.youTubePost.findUnique({
        where: {
          id: body.youtubePostId,
        },
      })

      title = post?.title || ""
    }

    if (!title) {
      return NextResponse.json(
        {
          ok: false,
          error: "Title required",
        },
        {
          status: 400,
        }
      )
    }

    const result = await thumbnailIntelligenceAgent({
      title,
      topic: body.topic || "",
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
          status: "thumbnail_intelligence_generated",
        },
      })
    }

    return NextResponse.json({
      ok: true,
      result,
      updatedPost,
    })
  } catch (error) {
    console.error("Thumbnail intelligence failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Thumbnail intelligence failed",
      },
      {
        status: 500,
      }
    )
  }
}