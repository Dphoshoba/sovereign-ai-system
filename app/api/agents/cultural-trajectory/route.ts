import { NextRequest, NextResponse } from "next/server"

import { narrativeGravityAgent } from "../../../../lib/agents/narrative-gravity-agent"
import { beliefMomentumAgent } from "../../../../lib/agents/belief-momentum-agent"
import { culturalTrajectoryAgent } from "../../../../lib/agents/cultural-trajectory-agent"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const narrative = narrativeGravityAgent({
      niche: body.niche || "AI + Faith",
    })

    const belief = beliefMomentumAgent({
      dominantNarrative: narrative.dominantNarrative.narrative,
    })

    const result = culturalTrajectoryAgent({
      dominantBelief: belief.dominantBelief.belief,
    })

    return NextResponse.json({
      ok: true,
      narrative,
      belief,
      result,
    })
  } catch (error) {
    console.error("Cultural trajectory failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Cultural trajectory failed",
      },
      {
        status: 500,
      }
    )
  }
}
