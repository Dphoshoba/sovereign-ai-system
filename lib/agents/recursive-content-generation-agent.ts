type MediaChannel = {
  agent: string
  orchestrationRole: string
  orchestrationScore: number
}

type RecursiveContentGenerationInput = {
  recursiveMediaOrchestrationScore: number
  mediaChannels: MediaChannel[]
  niche: string
}

export function recursiveContentGenerationAgent(
  input: RecursiveContentGenerationInput
) {
  const generatedContent = input.mediaChannels.map((channel) => ({
    agent: channel.agent,
    contentType:
      channel.orchestrationRole === "longform narrative strategy"
        ? "longform video essay"
        : channel.orchestrationRole === "shortform meaning distribution"
        ? "shortform clips"
        : channel.orchestrationRole === "integrity and anti-manipulation review"
        ? "integrity review brief"
        : "wisdom amplification post",
    topic:
      input.niche === "AI + Faith"
        ? "Human wisdom must guide machine intelligence"
        : `Civilization-positive media for ${input.niche}`,
    generationScore: Math.round(
      (channel.orchestrationScore +
        input.recursiveMediaOrchestrationScore) /
        2
    ),
  }))

  const recursiveContentGenerationScore = Math.round(
    generatedContent.reduce(
      (sum, item) => sum + item.generationScore,
      0
    ) / generatedContent.length
  )

  const primaryContent = generatedContent[0]

  return {
    autonomousRecursiveContentGeneration: true,
    niche: input.niche,
    recursiveMediaOrchestrationScore:
      input.recursiveMediaOrchestrationScore,
    recursiveContentGenerationScore,
    generatedContent,
    primaryContent,
    contentGenerationDirective:
      `Generate civilization-positive content through: "${primaryContent.contentType}"`,
    contentIntegrityConstraint:
      "Content generation must preserve truthfulness, wisdom, trust and flourishing-centered influence.",
    nextStage:
      "Ready for recursive content integrity intelligence.",
  }
}
