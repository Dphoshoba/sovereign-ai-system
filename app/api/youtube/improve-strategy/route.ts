import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type StrategyInput = {
  youtubePostId?: string
  views?: number
  ctr?: number
  avgWatchTime?: number
  retention?: number
}

function buildStrategy(input: Required<Omit<StrategyInput, "youtubePostId">>) {
  const actions: string[] = []
  const promptUpgrades: string[] = []

  if (input.ctr < 4) {
    actions.push("Generate stronger title and thumbnail variants.")
    promptUpgrades.push("Use more curiosity, contrast, urgency, and emotional stakes in titles.")
    promptUpgrades.push("Create thumbnails with fewer words, stronger contrast, and clearer visual tension.")
  }

  if (input.avgWatchTime < 45) {
    actions.push("Move the strongest hook into the first 5 seconds.")
    promptUpgrades.push("Start scripts with the biggest promise, problem, or surprising statement.")
  }

  if (input.retention < 50) {
    actions.push("Increase visual pacing and caption energy.")
    promptUpgrades.push("Use faster scene changes, shorter sentences, and chunked captions every 2–4 words.")
  }

  if (input.views < 200) {
    actions.push("Create more Shorts from this topic.")
    promptUpgrades.push("Generate 5–10 Shorts angles from each long-form video.")
  }

  if (actions.length === 0) {
    actions.push("Keep this format and create similar content.")
    promptUpgrades.push("Reuse this content structure as a winning pattern.")
  }

  return {
    actions,
    promptUpgrades,
    nextVideoStrategy: {
      intro: input.avgWatchTime < 45 ? "Open with the strongest hook immediately." : "Keep current intro structure.",
      title: input.ctr < 4 ? "Use curiosity and benefit-driven titles." : "Keep current title style.",
      thumbnail: input.ctr < 4 ? "Use bolder contrast and fewer words." : "Keep current thumbnail style.",
      shorts: input.views < 200 ? "Generate more Shorts from the strongest hook moments." : "Maintain current Shorts volume.",
      editing: input.retention < 50 ? "Increase pacing, B-roll variety, and caption rhythm." : "Maintain current pacing.",
    },
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as StrategyInput

    if (!body.youtubePostId) {
      return NextResponse.json(
        { ok: false, error: "youtubePostId required" },
        { status: 400 }
      )
    }

    const post = await prisma.youTubePost.findUnique({
      where: { id: body.youtubePostId },
    })

    if (!post) {
      return NextResponse.json(
        { ok: false, error: "Post not found" },
        { status: 404 }
      )
    }

    const metrics = {
      views: Number(body.views || 0),
      ctr: Number(body.ctr || 0),
      avgWatchTime: Number(body.avgWatchTime || 0),
      retention: Number(body.retention || 0),
    }

    const strategy = buildStrategy(metrics)

    return NextResponse.json({
      ok: true,
      postId: post.id,
      title: post.title,
      metrics,
      strategy,
    })
  } catch (error) {
    console.error("Improve strategy failed:", error)

    return NextResponse.json(
      { ok: false, error: "Improve strategy failed" },
      { status: 500 }
    )
  }
}