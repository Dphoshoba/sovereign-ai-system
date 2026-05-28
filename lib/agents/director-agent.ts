import { schedulingIntelligenceAgent } from "./scheduling-intelligence-agent"
import { retentionPredictionAgent } from "./retention-prediction-agent"
import { strategyEvolutionAgent } from "./strategy-evolution-agent"
import { promptMutationAgent } from "./prompt-mutation-agent"

type DirectorInput = {
  memories: any[]
  audienceRegion?: string
  audienceType?: string
  contentType?: string
  predictionScores?: {
    hookStrength: number
    pacingScore: number
    emotionalIntensity: number
    titleStrength: number
    thumbnailStrength: number
  }
}

export function directorAgent(input: DirectorInput) {
  const evolution = strategyEvolutionAgent(input.memories)

  const mutations = promptMutationAgent(evolution)

  const scheduling = schedulingIntelligenceAgent({
    audienceRegion: input.audienceRegion || "global",
    audienceType: input.audienceType || "general",
    contentType: input.contentType || "longform",
  })

  const retention = retentionPredictionAgent(
    input.predictionScores || {
      hookStrength: 80,
      pacingScore: 80,
      emotionalIntensity: 80,
      titleStrength: 80,
      thumbnailStrength: 80,
    }
  )

  return {
    directorDecision: {
      recommendedWorkflow:
        retention.retentionScore >= 80
          ? "Proceed to render and schedule."
          : "Revise hook, pacing, title, or thumbnail before rendering.",

      priority: evolution.hasInsights
        ? "Exploit winning strategy cluster."
        : "Explore new strategy patterns.",

      nextBestActions: [
        ...(mutations.autonomousMutations
          ? Object.values(mutations.autonomousMutations)
          : []),
        ...scheduling.schedulingStrategy.recommendations,
        ...retention.recommendations,
      ],
    },

    evolution,
    mutations,
    scheduling,
    retention,
  }
}