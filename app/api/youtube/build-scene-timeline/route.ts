import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const SCENES = [
  "/backgrounds/scenes/scene-1.mp4",
  "/backgrounds/scenes/scene-2.mp4",
  "/backgrounds/scenes/scene-3.mp4",
]

const BROLL = {
  ai: ["/broll/ai/ai-1.mp4", "/broll/ai/ai-2.mp4", "/broll/ai/ai-3.mp4"],
  technology: [
    "/broll/technology/tech-1.mp4",
    "/broll/technology/tech-2.mp4",
    "/broll/technology/tech-3.mp4",
  ],
  community: [
    "/broll/community/community-1.mp4",
    "/broll/community/community-2.mp4",
  ],
  church: ["/broll/church/church-1.mp4", "/broll/church/church-2.mp4"],
}

function pick(items: string[], index: number) {
  return items[index % items.length]
}

function chooseBroll(text: string, index: number) {
  const lower = text.toLowerCase()

  if (lower.includes("ai") || lower.includes("automation")) {
    return pick(BROLL.ai, index)
  }

  if (lower.includes("community") || lower.includes("family")) {
    return pick(BROLL.community, index)
  }

  if (lower.includes("church") || lower.includes("ministry")) {
    return pick(BROLL.church, index)
  }

  return pick(BROLL.technology, index)
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
      .replace(/\n+/g, " ")
      .split(/(?<=[.!?])\s+|(?=\[)|(?=HOST:)|(?=SECTION)/)
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
        broll: chooseBroll(segment, index),
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