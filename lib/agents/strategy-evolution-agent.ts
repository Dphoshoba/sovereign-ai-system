type PerformanceMemory = {
  videoId: string
  title?: string
  views: number
  estimatedMinutesWatched: number
  averageViewDuration: number
  likes: number
  subscribersGained: number
  rewardScore: number
  strategyNotes?: any
}

export function strategyEvolutionAgent(memories: PerformanceMemory[]) {
  if (!memories.length) {
    return {
      hasInsights: false,
      message: "No memories available yet.",
    }
  }

  const topPerformers = memories
    .sort((a, b) => b.rewardScore - a.rewardScore)
    .slice(0, 5)

  const avgReward =
    topPerformers.reduce((sum, m) => sum + m.rewardScore, 0) /
    topPerformers.length

  const avgViews =
    topPerformers.reduce((sum, m) => sum + m.views, 0) /
    topPerformers.length

  const avgWatchDuration =
    topPerformers.reduce((sum, m) => sum + m.averageViewDuration, 0) /
    topPerformers.length

  return {
    hasInsights: true,

    topPerformers,

    strategicInsights: [
      avgReward >= 80
        ? "High-performing strategy cluster detected."
        : "No dominant strategy cluster yet.",

      avgViews >= 1000
        ? "Current topic strategy is generating strong reach."
        : "Reach remains limited.",

      avgWatchDuration >= 60
        ? "Audience retention pacing is effective."
        : "Retention pacing needs improvement.",
    ],

    policyEvolution: {
      titleStrategy:
        avgReward >= 80
          ? "Reuse emotionally engaging title structures."
          : "Experiment with stronger hooks.",

      thumbnailStrategy:
        avgViews >= 1000
          ? "Maintain current thumbnail direction."
          : "Test stronger contrast and emotional triggers.",

      editingStrategy:
        avgWatchDuration >= 60
          ? "Maintain current pacing rhythm."
          : "Increase pacing and scene changes.",

      topicStrategy:
        avgReward >= 80
          ? "Double down on winning topic cluster."
          : "Expand topic exploration.",
    },
  }
}