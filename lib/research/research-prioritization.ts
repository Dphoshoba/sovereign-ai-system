import type { ScoredTopicCandidate } from "./topic-discovery"

export type ResearchPriorityBand = "HIGH" | "MEDIUM" | "LOW" | "BLOCKED"

export type PrioritizedResearchTopic = ScoredTopicCandidate & {
  priorityBand: ResearchPriorityBand
  estimatedEffort: "small" | "medium" | "large"
  riskLevel: "low" | "medium" | "high"
  nextAction: string
}

export type ResearchPrioritizationResult = {
  dryRun: true
  prioritized: PrioritizedResearchTopic[]
  highPriority: PrioritizedResearchTopic[]
  mediumPriority: PrioritizedResearchTopic[]
  lowPriority: PrioritizedResearchTopic[]
  blocked: PrioritizedResearchTopic[]
}

export function prioritizeResearchTopics(
  candidates: ScoredTopicCandidate[]
): ResearchPrioritizationResult {
  const prioritized = candidates
    .map(prioritizeResearchTopic)
    .sort((a, b) => b.totalScore - a.totalScore)

  return {
    dryRun: true,
    prioritized,
    highPriority: prioritized.filter((topic) => topic.priorityBand === "HIGH"),
    mediumPriority: prioritized.filter(
      (topic) => topic.priorityBand === "MEDIUM"
    ),
    lowPriority: prioritized.filter((topic) => topic.priorityBand === "LOW"),
    blocked: prioritized.filter((topic) => topic.priorityBand === "BLOCKED"),
  }
}

export function prioritizeResearchTopic(
  candidate: ScoredTopicCandidate
): PrioritizedResearchTopic {
  const riskLevel =
    candidate.category === "health" || candidate.totalScore >= 86
      ? "high"
      : candidate.totalScore >= 70
        ? "medium"
        : "low"
  const estimatedEffort =
    candidate.category === "health" || candidate.category === "history"
      ? "large"
      : candidate.totalScore >= 80
        ? "medium"
        : "small"
  const priorityBand: ResearchPriorityBand =
    candidate.recommendation === "SKIP_DUPLICATE"
      ? "BLOCKED"
      : candidate.totalScore >= 78
        ? "HIGH"
        : candidate.totalScore >= 62
          ? "MEDIUM"
          : "LOW"

  return {
    ...candidate,
    priorityBand,
    estimatedEffort,
    riskLevel,
    nextAction:
      priorityBand === "BLOCKED"
        ? "Skip or merge with an existing mission candidate."
        : priorityBand === "HIGH"
          ? "Create a governed mission plan and queue for research readiness review."
          : "Keep in watch list until strategic priority or freshness increases.",
  }
}
