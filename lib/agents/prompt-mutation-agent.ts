type StrategyEvolution = {
  policyEvolution?: {
    titleStrategy?: string
    thumbnailStrategy?: string
    editingStrategy?: string
    topicStrategy?: string
  }
}

export function promptMutationAgent(evolution: StrategyEvolution) {
  const policy = evolution.policyEvolution || {}

  return {
    systemPromptUpgrades: [
      policy.titleStrategy ? `Title Strategy: ${policy.titleStrategy}` : null,

      policy.thumbnailStrategy
        ? `Thumbnail Strategy: ${policy.thumbnailStrategy}`
        : null,

      policy.editingStrategy
        ? `Editing Strategy: ${policy.editingStrategy}`
        : null,

      policy.topicStrategy ? `Topic Strategy: ${policy.topicStrategy}` : null,
    ].filter(Boolean),

    autonomousMutations: {
      hooks: "Increase emotionally engaging opening hooks.",

      pacing: policy.editingStrategy || "Improve pacing rhythm.",

      thumbnails: policy.thumbnailStrategy || "Increase thumbnail contrast.",

      topicSelection: policy.topicStrategy || "Expand topic exploration.",

      shorts: "Generate more Shorts from high-performing videos.",
    },
  }
}