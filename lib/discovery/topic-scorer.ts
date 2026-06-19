import type { DiscoveredTopic } from "./topic-discovery"

export type ScoredTopic = DiscoveredTopic & {
  score: number
  reason: string
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "ai-tools": [
    "ai",
    "automation",
    "tools",
    "creator",
    "workflow",
    "productivity",
    "agent",
    "copilot",
  ],
  "bible-stories": [
    "bible",
    "biblical",
    "scripture",
    "archaeology",
    "testament",
    "jesus",
    "david",
    "moses",
  ],
  motivation: [
    "growth",
    "mindset",
    "discipline",
    "leadership",
    "habits",
    "success",
    "self improvement",
  ],
  history: [
    "history",
    "ancient",
    "civilization",
    "empire",
    "war",
    "archaeology",
    "discovery",
  ],
  space: [
    "space",
    "nasa",
    "astronomy",
    "telescope",
    "planet",
    "galaxy",
    "universe",
  ],
  health: [
    "health",
    "wellness",
    "nutrition",
    "fitness",
    "sleep",
    "mental health",
    "lifestyle",
  ],
}

function scoreTopic(topic: DiscoveredTopic) {
  const text = `${topic.title} ${topic.category}`.toLowerCase()
  const keywords = CATEGORY_KEYWORDS[topic.category] || []

  let score = 50

  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      score += 7
    }
  }

  if (text.includes("2026") || text.includes("latest") || text.includes("new")) {
    score += 5
  }

  if (text.includes("how") || text.includes("why") || text.includes("what")) {
    score += 5
  }

  return Math.min(score, 100)
}

function reasonForScore(score: number, category: string) {
  if (score >= 85) return `High-value ${category} opportunity`
  if (score >= 70) return `Strong ${category} opportunity`
  if (score >= 60) return `Useful ${category} opportunity`
  return `Moderate ${category} opportunity`
}

export function topicScorer(topics: DiscoveredTopic[]): ScoredTopic[] {
  return topics
    .map((topic) => {
      const score = scoreTopic(topic)

      return {
        ...topic,
        score,
        reason: reasonForScore(score, topic.category),
      }
    })
    .sort((a, b) => b.score - a.score)
}