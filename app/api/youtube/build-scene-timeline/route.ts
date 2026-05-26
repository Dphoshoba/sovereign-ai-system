import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const SCENES = [
  "/backgrounds/scenes/scene-1.mp4",
  "/backgrounds/scenes/scene-2.mp4",
  "/backgrounds/scenes/scene-3.mp4",
]

function chooseBroll(text: string) {
  const lower = text.toLowerCase()

  if (lower.includes("ai") || lower.includes("automation")) {
    return "/broll/ai/ai-1.mp4"
  }

  if (lower.includes("community") || lower.includes("family")) {
    return "/broll/community/community-1.mp4"
  }

  if (lower.includes("prayer") || lower.includes("spiritual")) {
    return "/broll/prayer/prayer-1.mp4"
  }

  if (lower.includes("church") || lower.includes("ministry")) {
    return "/broll/church/church-1.mp4"
  }

  return "/broll/technology/tech-1.mp4"
}

export async function POST(req: Request) {
  try {
    const { youtubePostId } = await req.json()

    const post = await prisma.youTubePost.findUnique({
      where: { id: youtubePostId },
    })

    if (!post) {
      return NextResponse.json(
        { ok: false, error: "Post not found" },
        { status: 404 }
      )
    }

    const script =
      post.fullScript ||
      post.description ||
      post.title

    const segments = script
      .split(/[.!?]\s+/)
      .map((s) => s.trim())
      .filter(Boolean)

    let currentTime = 0

    const timeline = segments.map((segment, index) => {
      const lower = segment.toLowerCase()

      const emotion =
        lower.includes("powerful") ||
        lower.includes("discover") ||
        lower.includes("transform") ||
        lower.includes("breakthrough")
          ? "high"
          : lower.includes("heart") ||
              lower.includes("community") ||
              lower.includes("care") ||
              lower.includes("serve")
            ? "warm"
            : "calm"

      const duration =
        emotion === "high" ? 3 : emotion === "warm" ? 5 : 6

      const item = {
        start: currentTime,
        end: currentTime + duration,
        duration,
        scene: SCENES[index % SCENES.length],
        broll: chooseBroll(segment),
        text: segment,
        emotion,
        transition:
          emotion === "high"
            ? "fast-cut"
            : emotion === "warm"
              ? "crossfade"
              : "slow-fade",
      }

      currentTime += duration

      return item
    })
    const updated = await prisma.youTubePost.update({
      where: { id: post.id },
      data: {
        sceneTimeline: timeline,
      },
    })

    return NextResponse.json({
      ok: true,
      timeline,
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
            : "Timeline generation failed",
      },
      { status: 500 }
    )
  }
}