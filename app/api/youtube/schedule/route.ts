import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { youtubePostId, scheduledFor } = await req.json()

    if (!youtubePostId || !scheduledFor) {
      return NextResponse.json(
        { ok: false, error: "Missing youtubePostId or scheduledFor" },
        { status: 400 }
      )
    }

    const updated = await prisma.youTubePost.update({
      where: { id: youtubePostId },
      data: {
        scheduledFor: new Date(scheduledFor),
      },
    })

    return NextResponse.json({
      ok: true,
      post: updated,
    })
  } catch (error) {
    console.error("YouTube schedule failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to schedule upload",
      },
      { status: 500 }
    )
  }
}
