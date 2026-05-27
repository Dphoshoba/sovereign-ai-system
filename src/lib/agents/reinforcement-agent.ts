type AnalyticsInput = {
    ctr: number
    retention: number
    avgWatchTime: number
    views: number
    subscribersGained?: number
  }
  
  export function reinforcementAgent(input: AnalyticsInput) {
    const rewards: string[] = []
    const penalties: string[] = []
    const nextActions: string[] = []
  
    if (input.ctr >= 6) {
      rewards.push("Title and thumbnail strategy is working.")
      nextActions.push("Reuse similar title structure and thumbnail style.")
    } else {
      penalties.push("CTR is below target.")
      nextActions.push("Generate stronger title and thumbnail variants.")
    }
  
    if (input.retention >= 55) {
      rewards.push("Retention is strong.")
      nextActions.push("Reuse current pacing, captions, and B-roll rhythm.")
    } else {
      penalties.push("Retention is weak.")
      nextActions.push("Shorten intro and increase scene changes.")
    }
  
    if (input.avgWatchTime >= 70) {
      rewards.push("Average watch time is strong.")
      nextActions.push("Create more long-form videos in this format.")
    } else {
      penalties.push("Average watch time is below target.")
      nextActions.push("Move the strongest hook into the first 5 seconds.")
    }
  
    if (input.views >= 1000) {
      rewards.push("Topic has strong reach.")
      nextActions.push("Create more Shorts and follow-up videos on this topic.")
    } else {
      penalties.push("Views are still low.")
      nextActions.push("Test more distribution angles and Shorts variations.")
    }
  
    if ((input.subscribersGained || 0) >= 20) {
      rewards.push("This topic converts viewers into subscribers.")
      nextActions.push("Prioritize this niche in future planning.")
    }
  
    const rewardScore =
      rewards.length * 20 -
      penalties.length * 10
  
    return {
      rewardScore: Math.max(0, Math.min(100, rewardScore)),
      rewards,
      penalties,
      nextActions,
      policyUpdate: {
        titleStrategy:
          input.ctr >= 6
            ? "Keep current title style."
            : "Increase curiosity, urgency, and benefit clarity.",
        thumbnailStrategy:
          input.ctr >= 6
            ? "Reuse winning thumbnail style."
            : "Use bolder contrast and fewer words.",
        editingStrategy:
          input.retention >= 55
            ? "Maintain current pacing."
            : "Increase visual changes and caption rhythm.",
        shortsStrategy:
          input.views >= 1000
            ? "Generate more Shorts from this topic."
            : "Test more hooks and platforms.",
        topicStrategy:
          (input.subscribersGained || 0) >= 20
            ? "Prioritize this topic cluster."
            : "Keep testing adjacent topics.",
      },
    }
  }