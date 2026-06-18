import type { ScoredTopic } from "./topic-scorer"

export type TopicOpportunity = {
  title: string
  sourceTitle: string
  audience: string
  angle: string
  opportunityScore: number
}

function generateTitle(sourceTitle: string) {
  const text = sourceTitle.toLowerCase()

  if (text.includes("reddit") && text.includes("success")) {
    return {
      title:
        "Is an AI Automation Business Still Worth Starting? What Creators Should Know",
      audience: "Creators",
      angle: "Business Opportunity",
    }
  }

  if (text.includes("reddit") && text.includes("day to day")) {
    return {
      title:
        "Which AI Automation Tools Are Actually Useful Day to Day?",
      audience: "Creators and Small Teams",
      angle: "Tool Selection",
    }
  }

  if (text.includes("enterprise") || text.includes("efficiency")) {
    return {
      title:
        "What Small Businesses Can Learn from Enterprise AI Automation",
      audience: "Small Business",
      angle: "Operational Efficiency",
    }
  }

  if (text.includes("salesforce")) {
    return {
      title:
        "How AI Automation Is Changing Customer Follow-Up and Business Operations",
      audience: "Small Business",
      angle: "Customer Operations",
    }
  }

  if (text.includes("microsoft") || text.includes("copilot")) {
    return {
      title:
        "How Teams Can Use AI Copilots to Reduce Repetitive Work",
      audience: "Teams",
      angle: "Workplace Productivity",
    }
  }

  if (text.includes("aws")) {
    return {
      title:
        "What AI Automation Really Means for Small Teams and Creators",
      audience: "Creators and Small Teams",
      angle: "AI Fundamentals",
    }
  }

  if (text.includes("ibm")) {
    return {
      title:
        "Why AI Automation Is Becoming the Next Layer of Business Infrastructure",
      audience: "Founders",
      angle: "Business Strategy",
    }
  }

  if (text.includes("uipath") || text.includes("blue prism")) {
    return {
      title:
        "How Workflow Automation Is Evolving With AI",
      audience: "Business Owners",
      angle: "Workflow Automation",
    }
  }

  if (text.includes("church") || text.includes("ministr")) {
    return {
      title:
        "How Churches Can Use AI Automation Without Losing the Human Touch",
      audience: "Churches",
      angle: "Ministry Operations",
    }
  }

  if (text.includes("creator") || text.includes("content")) {
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

function dedupeOpportunities(opportunities: TopicOpportunity[]) {
  const seen = new Set<string>()

  return opportunities.filter((opportunity) => {
    const key = opportunity.title.toLowerCase()

    if (seen.has(key)) return false

    seen.add(key)
    return true
  })
}

export function topicOpportunityGenerator(
  topics: ScoredTopic[]
): TopicOpportunity[] {
  const opportunities = topics.map((topic) => {
    const generated = generateTitle(topic.title)

    return {
      title: generated.title,
      sourceTitle: topic.title,
      audience: generated.audience,
      angle: generated.angle,
      opportunityScore: topic.score,
    }
  })

  return dedupeOpportunities(opportunities)
}