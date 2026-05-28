import {
  NextRequest,
  NextResponse,
} from "next/server"

import { narrativeGravityAgent } from "../../../../lib/agents/narrative-gravity-agent"

import { beliefMomentumAgent } from "../../../../lib/agents/belief-momentum-agent"

import { culturalTrajectoryAgent } from "../../../../lib/agents/cultural-trajectory-agent"

import { humanMeaningAgent } from "../../../../lib/agents/human-meaning-agent"

import { meaningDirectedDirectorAgent } from "../../../../lib/agents/meaning-directed-director-agent"

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

    const meaning =
      humanMeaningAgent({
        dominantTrajectory:
          culture.dominantTrajectory
            .trajectory,
      })

    const result =
      meaningDirectedDirectorAgent({
        dominantMeaning:
          meaning.dominantMeaning,

        dominantNarrative:
          narrative.dominantNarrative,

        dominantBelief:
          belief.dominantBelief,

        dominantTrajectory:
          culture.dominantTrajectory,
      })

    return NextResponse.json({
      ok: true,
      narrative,
      belief,
      culture,
      meaning,
      result,
    })
  } catch (error) {
    console.error(
      "Meaning-directed director failed:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          "Meaning-directed director failed",
      },
      {
        status: 500,
      }
    )
  }
}
