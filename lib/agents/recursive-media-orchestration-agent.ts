type NarrativeAgent = {
  agent: string
  role: string
  narrativeSwarmScore: number
}

type MediaOrchestrationInput = {
  recursiveNarrativeSwarmScore: number
  initializedNarrativeSwarm: NarrativeAgent[]
}

export function recursiveMediaOrchestrationAgent(
  input: MediaOrchestrationInput
) {
  const mediaChannels = input.initializedNarrativeSwarm.map((agent) => ({
    agent: agent.agent,
    orchestrationRole:
      agent.agent === "Civilization Narrative Architect"
        ? "longform narrative strategy"
        : agent.agent === "Meaning Propagation Agent"
        ? "shortform meaning distribution"
        : agent.agent === "Narrative Integrity Sentinel"
        ? "integrity and anti-manipulation review"
        : "wisdom signal amplification",
    orchestrationScore: Math.round(
      (agent.narrativeSwarmScore +
        input.recursiveNarrativeSwarmScore) /
        2
    ),
  }))

  const recursiveMediaOrchestrationScore = Math.round(
    mediaChannels.reduce(
      (sum, channel) => sum + channel.orchestrationScore,
      0
    ) / mediaChannels.length
  )

  const leadMediaAgent = mediaChannels[0]

  return {
    autonomousRecursiveMediaOrchestration: true,
    recursiveNarrativeSwarmScore:
      input.recursiveNarrativeSwarmScore,
    recursiveMediaOrchestrationScore,
    mediaChannels,
    leadMediaAgent,
    mediaOrchestrationDirective:
      `Orchestrate autonomous media through: "${leadMediaAgent.orchestrationRole}"`,
    mediaIntegrityConstraint:
      "Media orchestration must preserve trust, wisdom, truthfulness and civilization-positive influence.",
    nextStage:
      "Ready for recursive content generation intelligence.",
  }
}
