import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type PerformanceInput = {
  youtubePostId?: string
  views?: number
  ctr?: number
  avgWatchTime?: number
  retention?: number
}

function scorePerformance({
  views = 0,
  ctr = 0,
  avgWatchTime = 0,
  retention = 0,
}: Required<Omit<PerformanceInput, "youtubePostId">>) {
  let score = 0

  score += Math.min(views / 100, 25)
  score += Math.min(ctr * 5, 25)
  score += Math.min(avgWatchTime / 4, 25)
  score += Math.min(retention / 4, 25)

  return Math.round(Math.min(score, 100))
}

function buildRecommendations(score: number, input: PerformanceInput) {
  const recommendations: string[] = []

  if ((input.ctr || 0) < 4) {
    recommendations.push("Improve title curiosity and thumbnail contrast.")
  }

  if ((input.avgWatchTime || 0) < 30) {
    recommendations.push("Shorten the intro and bring the strongest hook earlier.")
  }

  if ((input.retention || 0) < 40) {
    recommendations.push("Use faster cuts, stronger captions, and clearer early payoff.")
  }

  if ((input.views || 0) < 100) {
    recommendations.push("Test a stronger topic angle and publish more Shorts from this video.")
  }

  if (score >= 80) {
    recommendations.push("This format is strong. Reuse the structure for future videos.")
  }

  return recommendations
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PerformanceInput

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

    const views = Number(body.views || 0)
    const ctr = Number(body.ctr || 0)
    const avgWatchTime = Number(body.avgWatchTime || 0)
    const retention = Number(body.retention || 0)

    const performanceScore = scorePerformance({
      views,
      ctr,
      avgWatchTime,
      retention,
    })

    const recommendations = buildRecommendations(performanceScore, {
      youtubePostId: body.youtubePostId,
      views,
      ctr,
      avgWatchTime,
      retention,
    })

    return NextResponse.json({
      ok: true,
      postId: post.id,
      title: post.title,
      metrics: {
        views,
        ctr,
        avgWatchTime,
        retention,
      },
      performanceScore,
      recommendations,
    })
  } catch (error) {
    console.error("Analyze performance failed:", error)

    return NextResponse.json(
      { ok: false, error: "Analyze performance failed" },
      { status: 500 }
    )
  }
}