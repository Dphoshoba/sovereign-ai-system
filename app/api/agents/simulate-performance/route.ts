import { NextRequest, NextResponse } from "next/server"
import { reinforcementAgent } from "../../../../lib/agents/reinforcement-agent"
import { savePerformanceMemory } from "../../../../lib/agents/performance-memory-agent"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const metrics = {
      views: Number(body.views || 0),
      estimatedMinutesWatched: Number(body.estimatedMinutesWatched || 0),
      averageViewDuration: Number(body.averageViewDuration || 0),
      likes: Number(body.likes || 0),
      subscribersGained: Number(body.subscribersGained || 0),
    }

    const reinforcement = reinforcementAgent({
      ctr: Number(body.ctr || 0),
      retention: Number(body.retention || 0),
      avgWatchTime: metrics.averageViewDuration,
      views: metrics.views,
      subscribersGained: metrics.subscribersGained,
    })

    const savedMemory = await savePerformanceMemory({
      videoId: body.videoId || `simulated-${Date.now()}`,
      title: body.title || "Simulated Performance Test",
      metrics,
      reinforcement,
    })

    return NextResponse.json({
      ok: true,
      metrics,
      reinforcement,
      savedMemory,
    })
  } catch (error) {
    console.error("Performance simulation failed:", error)

    return NextResponse.json(
      { ok: false, error: "Performance simulation failed" },
      { status: 500 }
    )
  }
}