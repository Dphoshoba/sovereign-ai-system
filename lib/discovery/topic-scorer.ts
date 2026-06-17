import type { DiscoveredTopic } from "./topic-discovery"

export type ScoredTopic = DiscoveredTopic & {
  score: number
  reason: string
}

export function topicScorer(
  topics: DiscoveredTopic[]
): ScoredTopic[] {
  return topics
    .map((topic) => ({
      ...topic,
      score: Math.floor(Math.random() * 20) + 80,
      reason: "Seed topic",
    }))
    .sort((a, b) => b.score - a.score)
}