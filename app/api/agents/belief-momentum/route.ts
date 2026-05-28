import {
  NextRequest,
  NextResponse,
} from "next/server"

import { narrativeGravityAgent } from "../../../../lib/agents/narrative-gravity-agent"

import { beliefMomentumAgent } from "../../../../lib/agents/belief-momentum-agent"

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

    const result =
      beliefMomentumAgent({
        dominantNarrative:
          narrative.dominantNarrative
            .narrative,
      })

    return NextResponse.json({
      ok: true,
      narrative,
      result,
    })
  } catch (error) {
    console.error(
      "Belief momentum failed:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          "Belief momentum failed",
      },
      {
        status: 500,
      }
    )
  }
}
