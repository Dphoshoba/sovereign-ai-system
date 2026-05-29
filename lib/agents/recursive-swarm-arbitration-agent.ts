type ConsensusVote = {
  agent: string
  vote: string
  consensusReason: string
  consensusStrength: number
}

type SwarmArbitrationInput = {
  swarmConsensusScore: number
  consensusStatus: string
  consensusVotes: ConsensusVote[]
}

export function recursiveSwarmArbitrationAgent(
  input: SwarmArbitrationInput
) {
  const arbitrationDecisions = input.consensusVotes.map((vote) => ({
    agent: vote.agent,
    arbitrationDecision:
      vote.vote === "approve" && vote.consensusStrength >= 95
        ? "approved"
        : "deferred",
    arbitrationReason:
      vote.vote === "approve" && vote.consensusStrength >= 95
        ? "Consensus strength is sufficient for distributed swarm approval."
        : "Consensus strength requires additional constitutional review.",
    arbitrationStrength: vote.consensusStrength,
  }))

  const approvedDecisions = arbitrationDecisions.filter(
    (decision) => decision.arbitrationDecision === "approved"
  ).length

  const arbitrationApprovalRatio = Math.round(
    (approvedDecisions / arbitrationDecisions.length) * 100
  )

  const swarmArbitrationScore = Math.round(
    (arbitrationApprovalRatio + input.swarmConsensusScore) / 2
  )

  return {
    autonomousRecursiveSwarmArbitration: true,
    consensusStatus: input.consensusStatus,
    swarmConsensusScore: input.swarmConsensusScore,
    arbitrationApprovalRatio,
    swarmArbitrationScore,
    arbitrationDecisions,
    arbitrationStatus:
      arbitrationApprovalRatio >= 95
        ? "Swarm arbitration approved."
        : "Swarm arbitration deferred.",
    arbitrationDirective:
      "Approve distributed recursive swarm actions only when consensus, constitutional oversight and risk safeguards remain stable.",
    nextStage:
      "Ready for recursive swarm alignment intelligence.",
  }
}
