import { buildExecutiveAgents } from "./agents"

export type AgentVote =
  | "approve"
  | "reject"
  | "neutral"

export type ConsensusDecision = {
  topic: string
  votes: {
    agent: string
    vote: AgentVote
    rationale: string
  }[]
  approvedVotes: number
  rejectedVotes: number
  neutralVotes: number
  consensus: string
}

export async function buildBoardroomConsensus() {
  const agents = await buildExecutiveAgents()

  const topics = [
    "Collect outstanding invoices",
    "Convert qualified leads",
    "Resolve overdue projects",
    "Expand automation coverage",
    "Introduce client retainers",
  ]

  const decisions: ConsensusDecision[] = []

  for (const topic of topics) {
        const votes: ConsensusDecision["votes"] = [
      {
        agent: "CEO",
        vote: "approve" as AgentVote,
        rationale: "Supports business growth",
      },
      {
        agent: "CFO",
        vote: topic.includes("invoice") || topic.includes("retainer")
          ? "approve"
          : "neutral",
        rationale: "Financial perspective",
      },
      {
        agent: "COO",
        vote: topic.includes("project")
          ? "approve"
          : "neutral",
        rationale: "Operations perspective",
      },
      {
        agent: "CMO",
        vote: topic.includes("lead")
          ? "approve"
          : "neutral",
        rationale: "Growth perspective",
      },
      {
        agent: "CTO",
        vote: topic.includes("automation")
          ? "approve"
          : "neutral",
        rationale: "Technology perspective",
      },
    ]

    const approvedVotes =
      votes.filter(v => v.vote === "approve").length

    const rejectedVotes =
      votes.filter(v => v.vote === "reject").length

    const neutralVotes =
      votes.filter(v => v.vote === "neutral").length

    decisions.push({
      topic,
      votes,
      approvedVotes,
      rejectedVotes,
      neutralVotes,
      consensus:
        approvedVotes > rejectedVotes
          ? "APPROVED"
          : "REVIEW_REQUIRED",
    })
  }

  return {
    generatedAt: new Date().toISOString(),
    decisions,
  }
}