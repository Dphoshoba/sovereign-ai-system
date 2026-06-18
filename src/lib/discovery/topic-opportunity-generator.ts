import type { ScoredTopic } from "./topic-scorer"

export type TopicOpportunity = {
  title: string
  sourceTitle: string
  audience: string
  angle: string
  opportunityScore: number
}

function generateTitle(title: string) {
  const text = title.toLowerCase()

  if (text.includes("church")) {
    return {
      title:
        "How Churches Can Use AI Automation Without Losing the Human Touch",
      audience: "Churches",
      angle: "Ministry Operations",
    }
  }

  if (text.includes("small business")) {
    return {
      title:
        "7 AI Automation Workflows Every Small Business Should Implement",
      audience: "Small Business",
      angle: "Productivity",
    }
  }

  if (text.includes("creator")) {
    return {
      title:
        "How Content Creators Can Build an AI-Powered Publishing System",
      audience: "Creators",
      angle: "Content Operations",
    }
  }

  return {
    title:
      "The Future of AI Automation: Practical Opportunities and Risks",
    audience: "General",
    angle: "Industry Trends",
  }
}

export function topicOpportunityGenerator(
  topics: ScoredTopic[]
): TopicOpportunity[] {
  return topics.map((topic) => {
    const generated = generateTitle(topic.title)

    return {
      title: generated.title,
      sourceTitle: topic.title,
      audience: generated.audience,
      angle: generated.angle,
      opportunityScore: topic.score,
    }
  })
}