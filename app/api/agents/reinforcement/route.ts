import { NextRequest, NextResponse } from "next/server"
import { reinforcementAgent } from "../../../../lib/agents/reinforcement-agent"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const result = reinforcementAgent({
      ctr: Number(body.ctr || 0),
      retention: Number(body.retention || 0),
      avgWatchTime: Number(body.avgWatchTime || 0),
      views: Number(body.views || 0),
      subscribersGained: Number(body.subscribersGained || 0),
    })

    return NextResponse.json({
      ok: true,
      result,
    })
  } catch (error) {
    console.error("Reinforcement agent failed:", error)

    return NextResponse.json(
      { ok: false, error: "Reinforcement agent failed" },
      { status: 500 }
    )
  }
}