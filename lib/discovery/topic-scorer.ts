import type { DiscoveredTopic } from "./topic-discovery"

export type ScoredTopic = DiscoveredTopic & {
  score: number
  reason: string
}

function scoreTopicTitle(title: string) {
  const text = title.toLowerCase()

  let score = 60

  if (text.includes("ai")) score += 10
  if (text.includes("automation")) score += 10
  if (text.includes("church") || text.includes("ministr")) score += 8
  if (text.includes("small business")) score += 8
  if (text.includes("creator")) score += 6
  if (text.includes("agent")) score += 6
  if (text.includes("content")) score += 5
  if (text.includes("2026") || text.includes("future")) score += 5

  return Math.min(score, 100)
}

function reasonForScore(score: number) {
  if (score >= 90) return "High relevance opportunity"
  if (score >= 80) return "Strong topic opportunity"
  if (score >= 70) return "Useful content opportunity"
  return "Moderate topic opportunity"
}

export function topicScorer(topics: DiscoveredTopic[]): ScoredTopic[] {
  return topics
    .map((topic) => {
      const score = scoreTopicTitle(topic.title)

      return {
        ...topic,
        score,
        reason: reasonForScore(score),
      }
    })
    .sort((a, b) => b.score - a.score)
}
