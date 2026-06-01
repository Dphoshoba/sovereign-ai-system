import { NextRequest, NextResponse } from "next/server"
import { youtubeAnalyticsAgent } from "../../../../lib/agents/youtube-analytics-agent"
import { analyticsNormalizerAgent } from "../../../../lib/agents/analytics-normalizer-agent"
import { reinforcementAgent } from "../../../../lib/agents/reinforcement-agent"
import { savePerformanceMemory } from "../../../../lib/agents/performance-memory-agent"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.accessToken) {
      return NextResponse.json(
        { ok: false, error: "accessToken required" },
        { status: 400 }
      )
    }

    if (!body.videoId) {
      return NextResponse.json(
        { ok: false, error: "videoId required" },
        { status: 400 }
      )
    }

    const result = await youtubeAnalyticsAgent({
      accessToken: body.accessToken,
      videoId: body.videoId,
    })

    const normalized = analyticsNormalizerAgent(result)
    let reinforcement = null

    if (normalized.hasData && normalized.reinforcementInput) {
      reinforcement = reinforcementAgent(normalized.reinforcementInput)
    }
    let savedMemory = null

    if (normalized.hasData) {
      savedMemory = await savePerformanceMemory({
        videoId: body.videoId,
        title: body.title || "",
        metrics: normalized.metrics,
        reinforcement,
      })
    }

    return NextResponse.json({
      ok: true,
      result,
      normalized,
      reinforcement,
      savedMemory,
    })
  } catch (error) {
    console.error("YouTube analytics failed:", error)

    return NextResponse.json(
      { ok: false, error: "YouTube analytics failed" },
      { status: 500 }
    )
  }
}