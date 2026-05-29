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
import { recursivePurposeAgent } from "../../../../lib/agents/recursive-purpose-agent"
import { recursiveStrategicIdentityAgent } from "../../../../lib/agents/recursive-strategic-identity-agent"
import { recursiveCivilizationMemoryAgent } from "../../../../lib/agents/recursive-civilization-memory-agent"
import { recursiveWisdomAgent } from "../../../../lib/agents/recursive-wisdom-agent"
import { recursiveEthicalJudgmentAgent } from "../../../../lib/agents/recursive-ethical-judgment-agent"
import { recursiveLongHorizonGovernanceAgent } from "../../../../lib/agents/recursive-long-horizon-governance-agent"
import { recursiveCivilizationStewardshipAgent } from "../../../../lib/agents/recursive-civilization-stewardship-agent"
import { recursiveExistentialRiskAgent } from "../../../../lib/agents/recursive-existential-risk-agent"
import { recursiveSafeguardAgent } from "../../../../lib/agents/recursive-safeguard-agent"
import { recursiveSelfHealingAgent } from "../../../../lib/agents/recursive-self-healing-agent"
import { recursiveMetaAdaptationAgent } from "../../../../lib/agents/recursive-meta-adaptation-agent"
import { recursiveEvolutionArbitrationAgent } from "../../../../lib/agents/recursive-evolution-arbitration-agent"
import { recursiveGovernanceOptimizationAgent } from "../../../../lib/agents/recursive-governance-optimization-agent"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const niche = body.niche || "AI + Faith"

    const narrative = narrativeGravityAgent({ niche })

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

    const consciousness = recursiveConsciousnessAgent({
      alignmentStatus: alignment.alignmentStatus,
      overallAlignmentScore:
        alignment.overallAlignmentScore,
      primaryPrinciple:
        constitution.primaryPrinciple.principle,
    })

    const purpose = recursivePurposeAgent({
      recursiveCoherenceScore:
        consciousness.recursiveCoherenceScore,
      primaryPrinciple:
        constitution.primaryPrinciple.principle,
    })

    const identity = recursiveStrategicIdentityAgent({
      dominantPurpose:
        purpose.dominantPurpose.purpose,
      recursivePurposeScore:
        purpose.recursivePurposeScore,
    })

    const memory = recursiveCivilizationMemoryAgent({
      dominantIdentity:
        identity.dominantIdentity.identity,
      recursiveIdentityScore:
        identity.recursiveIdentityScore,
    })

    const wisdom = recursiveWisdomAgent({
      dominantMemory:
        memory.dominantMemory.memoryLayer,
      recursiveMemoryScore:
        memory.recursiveMemoryScore,
    })

    const ethics = recursiveEthicalJudgmentAgent({
      dominantWisdom:
        wisdom.dominantWisdom.wisdom,
      recursiveWisdomScore:
        wisdom.recursiveWisdomScore,
    })

    const governance = recursiveLongHorizonGovernanceAgent({
      dominantEthic:
        ethics.dominantEthic.judgment,
      recursiveEthicalScore:
        ethics.recursiveEthicalScore,
    })

    const civilizationStewardship =
      recursiveCivilizationStewardshipAgent({
        dominantGovernance:
          governance.dominantGovernance.governance,
        recursiveGovernanceScore:
          governance.recursiveGovernanceScore,
      })

    const existentialRisk =
      recursiveExistentialRiskAgent({
        dominantStewardship:
          civilizationStewardship.dominantStewardship.mandate,
        civilizationStewardshipScore:
          civilizationStewardship.civilizationStewardshipScore,
      })

    const safeguard = recursiveSafeguardAgent({
      existentialRiskStatus:
        existentialRisk.existentialRiskStatus,
      civilizationStewardshipScore:
        civilizationStewardship.civilizationStewardshipScore,
    })

    const selfHealing = recursiveSelfHealingAgent({
      recursiveSafeguardScore:
        safeguard.recursiveSafeguardScore,
      existentialRiskStatus:
        existentialRisk.existentialRiskStatus,
    })

    const metaAdaptation = recursiveMetaAdaptationAgent({
      recursiveHealingScore:
        selfHealing.recursiveHealingScore,
      recursiveSafeguardScore:
        safeguard.recursiveSafeguardScore,
      existentialRiskStatus:
        existentialRisk.existentialRiskStatus,
    })

    const arbitration = recursiveEvolutionArbitrationAgent({
      recursiveMetaAdaptationScore:
        metaAdaptation.recursiveMetaAdaptationScore,
      dominantAdaptation:
        metaAdaptation.dominantAdaptation.strategy,
    })

    const result = recursiveGovernanceOptimizationAgent({
      recursiveArbitrationScore:
        arbitration.recursiveArbitrationScore,
      selectedEvolutionPath:
        arbitration.selectedEvolutionPath.path,
    })

    return NextResponse.json({
      ok: true,
      phase: "Phase 2",
      metaAdaptation,
      arbitration,
      result,
    })
  } catch (error) {
    console.error("Recursive governance optimization failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          "Recursive governance optimization failed",
      },
      {
        status: 500,
      }
    )
  }
}
