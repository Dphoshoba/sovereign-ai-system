import { NextRequest, NextResponse } from "next/server"

import { narrativeGravityAgent } from "../../../../lib/agents/narrative-gravity-agent"
import { beliefMomentumAgent } from "../../../../lib/agents/belief-momentum-agent"
import { culturalTrajectoryAgent } from "../../../../lib/agents/cultural-trajectory-agent"
import { humanMeaningAgent } from "../../../../lib/agents/human-meaning-agent"
import { meaningDirectedDirectorAgent } from "../../../../lib/agents/meaning-directed-director-agent"
import { humanFlourishingAgent } from "../../../../lib/agents/human-flourishing-agent"
import { civilizationResilienceAgent } from "../../../../lib/agents/civilization-resilience-agent"
import { civilizationStewardshipAgent } from "../../../../lib/agents/civilization-stewardship-agent"
import { metaCivilizationAgent } from "../../../../lib/agents/meta-civilization-agent"
import { recursiveConstitutionalAgent } from "../../../../lib/agents/recursive-constitutional-agent"
import { recursiveAlignmentAgent } from "../../../../lib/agents/recursive-alignment-agent"
import { recursiveConsciousnessAgent } from "../../../../lib/agents/recursive-consciousness-agent"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const narrative = narrativeGravityAgent({
      niche: body.niche || "AI + Faith",
    })

    const belief = beliefMomentumAgent({
      dominantNarrative: narrative.dominantNarrative.narrative,
    })

    const culture = culturalTrajectoryAgent({
      dominantBelief: belief.dominantBelief.belief,
    })

    const meaning = humanMeaningAgent({
      dominantTrajectory: culture.dominantTrajectory.trajectory,
    })

    const director = meaningDirectedDirectorAgent({
      dominantMeaning: meaning.dominantMeaning,
      dominantNarrative: narrative.dominantNarrative,
      dominantBelief: belief.dominantBelief,
      dominantTrajectory: culture.dominantTrajectory,
    })

    const flourishing = humanFlourishingAgent({
      civilizationTrustScore: director.civilizationTrustScore,
    })

    const resilience = civilizationResilienceAgent({
      flourishingAlignment: flourishing.flourishingAlignment,
    })

    const stewardship = civilizationStewardshipAgent({
      civilizationResilienceScore:
        resilience.civilizationResilienceScore,
    })

    const metaCivilization = metaCivilizationAgent({
      stewardshipScore:
        stewardship.civilizationStewardshipScore,
    })

    const constitution = recursiveConstitutionalAgent({
      optimalFuture: metaCivilization.optimalFuture.future,
      civilizationScore:
        metaCivilization.optimalFuture.civilizationScore,
    })

    const alignment = recursiveAlignmentAgent({
      primaryPrinciple:
        constitution.primaryPrinciple.principle,
      constitutionalScore:
        constitution.primaryPrinciple.constitutionalScore,
    })

    const result = recursiveConsciousnessAgent({
      alignmentStatus: alignment.alignmentStatus,
      overallAlignmentScore:
        alignment.overallAlignmentScore,
      primaryPrinciple:
        constitution.primaryPrinciple.principle,
    })

    return NextResponse.json({
      ok: true,
      constitution,
      alignment,
      result,
    })
  } catch (error) {
    console.error("Recursive consciousness modeling failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Recursive consciousness modeling failed",
      },
      {
        status: 500,
      }
    )
  }
}
