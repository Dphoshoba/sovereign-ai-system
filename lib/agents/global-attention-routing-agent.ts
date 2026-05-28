type AttentionInput = {
  dominantScenario: {
    year: number
    simulation: string
    disruptionLevel: number
  }
}

export function globalAttentionRoutingAgent(
  input: AttentionInput
) {
  const attentionZones = [
    {
      platform: "YouTube",
      attentionGravity: 91,
      saturationRisk: 34,
      strategicUse: "Long-form authority and search-driven discovery",
    },
    {
      platform: "YouTube Shorts",
      attentionGravity: 94,
      saturationRisk: 41,
      strategicUse: "Rapid topic testing and subscriber acceleration",
    },
    {
      platform: "TikTok",
      attentionGravity: 89,
      saturationRisk: 52,
      strategicUse: "Fast emotional discovery and viral experimentation",
    },
    {
      platform: "Instagram Reels",
      attentionGravity: 84,
      saturationRisk: 46,
      strategicUse: "Visual brand reinforcement and inspirational reach",
    },
    {
      platform: "LinkedIn",
      attentionGravity: 78,
      saturationRisk: 22,
      strategicUse: "Authority positioning and business adoption",
    },
    {
      platform: "Blog / Newsletter",
      attentionGravity: 73,
      saturationRisk: 18,
      strategicUse: "Owned audience memory and long-term trust",
    },
  ]

  const rankedZones = attentionZones.sort(
    (a, b) =>
      b.attentionGravity -
      a.attentionGravity
  )

  const primaryRoute = rankedZones[0]

  return {
    autonomousAttentionRouting: true,

    basedOnScenario:
      input.dominantScenario,

    rankedAttentionZones: rankedZones,

    primaryRoute,

    routingDirective:
      `Prioritize ${primaryRoute.platform} for immediate attention capture.`,

    ecosystemStrategy: [
      "Use Shorts for rapid signal testing.",
      "Use YouTube long-form for authority building.",
      "Use LinkedIn for credibility and institutional reach.",
      "Use newsletter/blog for owned audience retention.",
      "Use TikTok and Reels for viral experimentation.",
    ],

    nextStage:
      "Ready for autonomous cross-platform attention allocation.",
  }
}
