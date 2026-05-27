import { NextRequest, NextResponse } from "next/server"

type CompetitorVideo = {
  title: string
  views?: number
  likes?: number
  comments?: number
  durationSeconds?: number
  thumbnailStyle?: string
}

type CompetitorInput = {
  niche?: string
  competitors?: {
    channelName: string
    videos: CompetitorVideo[]
  }[]
}

function scoreVideo(video: CompetitorVideo) {
  let score = 0

  score += Math.min((video.views || 0) / 1000, 40)
  score += Math.min((video.likes || 0) / 100, 20)
  score += Math.min((video.comments || 0) / 20, 15)

  const title = video.title.toLowerCase()

  if (title.includes("how")) score += 5
  if (title.includes("why")) score += 5
  if (title.includes("mistake")) score += 8
  if (title.includes("secret")) score += 8
  if (title.includes("future")) score += 8
  if (title.includes("ai")) score += 5

  if (
    video.durationSeconds &&
    video.durationSeconds >= 300 &&
    video.durationSeconds <= 900
  ) {
    score += 10
  }

  return Math.round(Math.min(score, 100))
}

function identifyPatterns(videos: CompetitorVideo[]) {
  const patterns: string[] = []

  const titles = videos.map((v) => v.title.toLowerCase()).join(" ")

  if (titles.includes("how")) {
    patterns.push("How-to titles are appearing frequently.")
  }

  if (titles.includes("why")) {
    patterns.push("Why-based curiosity titles are common.")
  }

  if (titles.includes("mistake") || titles.includes("wrong")) {
    patterns.push("Mistake-based angles may perform well.")
  }

  if (titles.includes("future") || titles.includes("trend")) {
    patterns.push("Future/trend framing is present in this niche.")
  }

  if (titles.includes("ai")) {
    patterns.push("AI-led positioning is central to this niche.")
  }

  return patterns.length > 0
    ? patterns
    : ["No strong repeated pattern detected yet."]
}

function buildRecommendations(topVideos: (CompetitorVideo & { score: number })[]) {
  const recommendations: string[] = []

  const topTitles = topVideos.map((v) => v.title.toLowerCase()).join(" ")

  if (topTitles.includes("how")) {
    recommendations.push("Create more practical how-to videos.")
  }

  if (topTitles.includes("mistake") || topTitles.includes("wrong")) {
    recommendations.push("Use mistake/problem-based hooks for Shorts and thumbnails.")
  }

  if (topTitles.includes("future")) {
    recommendations.push("Create future-focused trend videos.")
  }

  if (topTitles.includes("ai")) {
    recommendations.push("Keep AI clearly visible in titles, thumbnails, and intros.")
  }

  recommendations.push("Extract Shorts from the strongest problem/solution moments.")
  recommendations.push("Use bold thumbnail text with 2–5 words max.")

  return recommendations
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CompetitorInput

    const niche = body.niche || "AI Automation"
    const competitors = body.competitors || []

    const allVideos = competitors.flatMap((competitor) =>
      competitor.videos.map((video) => ({
        ...video,
        channelName: competitor.channelName,
        score: scoreVideo(video),
      }))
    )

    const rankedVideos = allVideos.sort((a, b) => b.score - a.score)
    const topVideos = rankedVideos.slice(0, 5)

    const patterns = identifyPatterns(allVideos)
    const recommendations = buildRecommendations(topVideos)

    return NextResponse.json({
      ok: true,
      niche,
      summary: {
        competitorsAnalyzed: competitors.length,
        videosAnalyzed: allVideos.length,
      },
      topVideos,
      patterns,
      recommendations,
    })
  } catch (error) {
    console.error("Competitor analysis failed:", error)

    return NextResponse.json(
      { ok: false, error: "Competitor analysis failed" },
      { status: 500 }
    )
  }
}