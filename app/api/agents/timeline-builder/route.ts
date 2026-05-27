import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { timelineBuilderAgent } from "../../../../lib/agents/timeline-builder-agent"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    let scenePlan = body.scenePlan

    // Load scene plan from database if not passed directly
    if (!scenePlan && body.youtubePostId) {
      const post = await prisma.youTubePost.findUnique({
        where: {
          id: body.youtubePostId,
        },
      })

      scenePlan = post?.sceneTimeline
    }

    // Validation
    if (!scenePlan) {
      return NextResponse.json(
        {
          ok: false,
          error: "scenePlan required",
        },
        {
          status: 400,
        }
      )
    }

    // Build timeline
    const result = timelineBuilderAgent({
      scenePlan,
    })

    let updatedPost = null

    // Save timeline back to database
    if (body.youtubePostId) {
      updatedPost = await prisma.youTubePost.update({
        where: {
          id: body.youtubePostId,
        },
        data: {
          sceneTimeline: result.renderTimeline as any,
          status: "timeline_built",
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
      "Timeline builder failed:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error: "Timeline builder failed",
      },
      {
        status: 500,
      }
    )
  }
}