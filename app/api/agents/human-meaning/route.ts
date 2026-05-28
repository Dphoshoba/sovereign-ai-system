import {
  NextRequest,
  NextResponse,
} from "next/server"

import { narrativeGravityAgent } from "../../../../lib/agents/narrative-gravity-agent"

import { beliefMomentumAgent } from "../../../../lib/agents/belief-momentum-agent"

import { culturalTrajectoryAgent } from "../../../../lib/agents/cultural-trajectory-agent"

import { humanMeaningAgent } from "../../../../lib/agents/human-meaning-agent"

export async function POST(
  req: NextRequest
) {
  try {
    const body = await req.json()

    const narrative =
      narrativeGravityAgent({
        niche:
          body.niche || "AI + Faith",
      })

    const belief =
      beliefMomentumAgent({
        dominantNarrative:
          narrative.dominantNarrative
            .narrative,
      })

    const culture =
      culturalTrajectoryAgent({
        dominantBelief:
          belief.dominantBelief.belief,
      })

    const result =
      humanMeaningAgent({
        dominantTrajectory:
          culture.dominantTrajectory
            .trajectory,
      })

    return NextResponse.json({
      ok: true,
      narrative,
      belief,
      culture,
      result,
    })
  } catch (error) {
    console.error(
      "Human meaning intelligence failed:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          "Human meaning intelligence failed",
      },
      {
        status: 500,
      }
    )
  }
}
