import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { scenePlannerAgent } from "../../../../lib/agents/scene-planner-agent"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    let script = body.script || ""

    if (
      !script &&
      body.youtubePostId
    ) {
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
      await scenePlannerAgent({
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
      updatedPost =
        await prisma.youTubePost.update({
          where: {
            id: body.youtubePostId,
          },
          data: {
            sceneTimeline:
              result.scenePlan,
            status:
              "scene_planned",
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
      "Scene planner failed:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          "Scene planner failed",
      },
      {
        status: 500,
      }
    )
  }
}