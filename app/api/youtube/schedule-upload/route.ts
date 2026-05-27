import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function getNextBestPublishTime() {
  const now = new Date()

  const publish = new Date(now)

  publish.setHours(18)
  publish.setMinutes(0)
  publish.setSeconds(0)

  if (publish <= now) {
    publish.setDate(publish.getDate() + 1)
  }

  return publish
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { youtubePostId } = body

    if (!youtubePostId) {
      return NextResponse.json(
        {
          ok: false,
          error: "youtubePostId required",
        },
        {
          status: 400,
        }
      )
    }

    const scheduledFor = getNextBestPublishTime()

    const updatedPost = await prisma.youTubePost.update({
      where: {
        id: youtubePostId,
      },
      data: {
        scheduledFor,
        uploadStatus: "scheduled",
      },
    })

    return NextResponse.json({
      ok: true,
      scheduledFor,
      post: updatedPost,
    })
  } catch (error) {
    console.error("Schedule upload failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Schedule upload failed",
      },
      {
        status: 500,
      }
    )
  }
}
