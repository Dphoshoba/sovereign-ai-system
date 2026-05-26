import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const HIGH_ENERGY = [
  "discover",
  "powerful",
  "amazing",
  "incredible",
  "transform",
  "breakthrough",
  "urgent",
  "revolution",
]

function detectEmotion(text: string) {
  const lower = text.toLowerCase()

  const high = HIGH_ENERGY.some((word) =>
    lower.includes(word)
  )

  if (high) {
    return "high"
  }

  if (
    lower.includes("heart") ||
    lower.includes("community") ||
    lower.includes("care")
  ) {
    return "warm"
  }

  return "calm"
}

export async function POST(req: Request) {
  try {
    const { youtubePostId } = await req.json()

    const post = await prisma.youTubePost.findUnique({
      where: {
        id: youtubePostId,
      },
    })

    if (!post) {
      return NextResponse.json(
        {
          ok: false,
          error: "Post not found",
        },
        { status: 404 }
      )
    }

    const timeline = Array.isArray(post.sceneTimeline)
      ? post.sceneTimeline
      : []

    const enhancedTimeline = timeline.map((item: any) => ({
      ...item,
      emotion: detectEmotion(item.text || ""),
      transition:
        detectEmotion(item.text || "") === "high"
          ? "fast-cut"
          : detectEmotion(item.text || "") === "warm"
          ? "crossfade"
          : "slow-fade",
    }))

    const updated = await prisma.youTubePost.update({
      where: {
        id: post.id,
      },
      data: {
        sceneTimeline: enhancedTimeline,
      },
    })

    return NextResponse.json({
      ok: true,
      timeline: enhancedTimeline,
      post: updated,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Emotion analysis failed",
      },
      { status: 500 }
    )
  }
}