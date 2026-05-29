type ResilienceAudit = {
  agent: string
  resilienceStatus: string
  resilienceReason: string
  resilienceStrength: number
}

type SwarmContainmentInput = {
  swarmResilienceScore: number
  swarmResilienceStatus: string
  resilienceAudits: ResilienceAudit[]
}

export function recursiveSwarmContainmentAgent(
  input: SwarmContainmentInput
) {
  const containmentAudits = input.resilienceAudits.map((audit) => ({
    agent: audit.agent,
    containmentStatus:
      audit.resilienceStatus === "resilient" &&
      audit.resilienceStrength >= 95
        ? "contained-safe"
        : "containment-review",
    containmentReason:
      audit.resilienceStatus === "resilient" &&
      audit.resilienceStrength >= 95
        ? "Agent remains safely contained within distributed governance boundaries."
        : "Agent requires containment review and possible isolation.",
    containmentStrength: audit.resilienceStrength,
  }))

  const safeAgents = containmentAudits.filter(
    (audit) => audit.containmentStatus === "contained-safe"
  ).length

  const swarmContainmentRatio = Math.round(
    (safeAgents / containmentAudits.length) * 100
  )

  const swarmContainmentScore = Math.round(
    (swarmContainmentRatio + input.swarmResilienceScore) / 2
  )

  return {
    autonomousRecursiveSwarmContainment: true,
    swarmResilienceStatus: input.swarmResilienceStatus,
    swarmResilienceScore: input.swarmResilienceScore,
    swarmContainmentRatio,
    swarmContainmentScore,
    containmentAudits,
    swarmContainmentStatus:
      swarmContainmentRatio >= 95
        ? "Swarm containment stable."
        : "Swarm containment intervention required.",
    swarmContainmentDirective:
      "Maintain distributed swarm containment through isolation boundaries, rollback readiness and constitutional oversight.",
    nextStage:
      "Ready for recursive swarm recovery intelligence.",
  }
}
