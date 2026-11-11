import {
  NextRequest,
  NextResponse,
} from "next/server"

import { narrativeGravityAgent } from "../../../../lib/agents/narrative-gravity-agent"

import { beliefMomentumAgent } from "../../../../lib/agents/belief-momentum-agent"

import { culturalTrajectoryAgent } from "../../../../lib/agents/cultural-trajectory-agent"

import { humanMeaningAgent } from "../../../../lib/agents/human-meaning-agent"

import { meaningDirectedDirectorAgent } from "../../../../lib/agents/meaning-directed-director-agent"

import { humanFlourishingAgent } from "../../../../lib/agents/human-flourishing-agent"

import { civilizationResilienceAgent } from "../../../../lib/agents/civilization-resilience-agent"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function POST(
  req: NextRequest
) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

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

    const director =
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

    const flourishing =
      humanFlourishingAgent({
        civilizationTrustScore:
          director.civilizationTrustScore,
      })

    const result =
      civilizationResilienceAgent({
        flourishingAlignment:
          flourishing.flourishingAlignment,
      })

    return NextResponse.json({
      ok: true,
      narrative,
      belief,
      culture,
      meaning,
      director,
      flourishing,
      result,
    })
  } catch (error) {
    console.error(
      "Civilization resilience failed:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          "Civilization resilience failed",
      },
      {
        status: 500,
      }
    )
  }
}
