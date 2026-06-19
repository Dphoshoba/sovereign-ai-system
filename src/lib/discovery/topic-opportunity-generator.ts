import type { ScoredTopic } from "./topic-scorer"

export type TopicOpportunity = {
  title: string
  sourceTitle: string
  audience: string
  angle: string
  opportunityScore: number
  category: string
}

function cleanTitle(text: string) {
  return text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
}

function defaultCategoryTitle(category: string) {
  switch (category) {
    case "bible-stories":
      return {
        title: "Lessons From Biblical History That Still Matter Today",
        audience: "Bible Readers",
        angle: "Biblical Reflection",
      }

    case "motivation":
      return {
        title: "How Personal Growth Happens One Decision at a Time",
        audience: "Personal Growth Readers",
        angle: "Self Improvement",
      }

    case "history":
      return {
        title: "What History Can Teach Modern Leaders",
        audience: "History Readers",
        angle: "Historical Lessons",
      }

    case "space":
      return {
        title: "Recent Discoveries Expanding Our Understanding of Space",
        audience: "Space Enthusiasts",
        angle: "Space Exploration",
      }

    case "health":
      return {
        title: "Evidence-Based Habits for Better Long-Term Health",
        audience: "Health Readers",
        angle: "Wellness",
      }

    default:
      return {
        title: "The Future of AI Automation: Practical Opportunities and Risks",
        audience: "General",
        angle: "Industry Trends",
      }
  }
}

function generateTitle(sourceTitle: string, category: string) {
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
      title: "Which AI Automation Tools Are Actually Useful Day to Day?",
      audience: "Creators and Small Teams",
      angle: "Tool Selection",
    }
  }

  if (text.includes("enterprise") || text.includes("efficiency")) {
    return {
      title: "What Small Businesses Can Learn from Enterprise AI Automation",
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
      title: "How Teams Can Use AI Copilots to Reduce Repetitive Work",
      audience: "Teams",
      angle: "Workplace Productivity",
    }
  }

  if (text.includes("aws")) {
    return {
      title: "What AI Automation Really Means for Small Teams and Creators",
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
      title: "How Workflow Automation Is Evolving With AI",
      audience: "Business Owners",
      angle: "Workflow Automation",
    }
  }

  if (text.includes("church") || text.includes("ministr")) {
    return {
      title: "How Churches Can Use AI Automation Without Losing the Human Touch",
      audience: "Churches",
      angle: "Ministry Operations",
    }
  }

  if (text.includes("creator") || text.includes("content")) {
    return {
      title: "How Content Creators Can Build an AI-Powered Publishing System",
      audience: "Creators",
      angle: "Content Operations",
    }
  }

  if (text.includes("bible") || text.includes("biblical")) {
    return {
      title: "What Bible History Can Teach Us Today",
      audience: "Bible Readers",
      angle: "Biblical Reflection",
    }
  }

  if (
    text.includes("space") ||
    text.includes("nasa") ||
    text.includes("telescope")
  ) {
    return {
      title: "What Recent Space Discoveries Reveal About the Universe",
      audience: "Curious Learners",
      angle: "Space Discovery",
    }
  }

  if (
    text.includes("health") ||
    text.includes("wellness") ||
    text.includes("nutrition")
  ) {
    return {
      title: "Simple Health Habits That Support Long-Term Wellness",
      audience: "Health Readers",
      angle: "Practical Wellness",
    }
  }

  if (text.includes("history") || text.includes("ancient")) {
    return {
      title: "What Ancient History Still Teaches the Modern World",
      audience: "History Readers",
      angle: "Historical Lessons",
    }
  }

  if (
    text.includes("motivation") ||
    text.includes("mindset") ||
    text.includes("growth")
  ) {
    return {
      title: "How to Build Discipline When Motivation Fades",
      audience: "Personal Growth Readers",
      angle: "Motivation",
    }
  }

  return defaultCategoryTitle(category)
}

function dedupeOpportunities(opportunities: TopicOpportunity[]) {
  const seen = new Set<string>()

  return opportunities.filter((opportunity) => {
    const key = `${opportunity.category}:${opportunity.title.toLowerCase()}`

    if (seen.has(key)) return false

    seen.add(key)
    return true
  })
}

export function topicOpportunityGenerator(
  topics: ScoredTopic[]
): TopicOpportunity[] {
  const opportunities = topics.map((topic) => {
    const generated = generateTitle(topic.title, topic.category)

    return {
      title: cleanTitle(generated.title),
      sourceTitle: cleanTitle(topic.title),
      audience: generated.audience,
      angle: generated.angle,
      opportunityScore: topic.score,
      category: topic.category,
    }
  })

  return dedupeOpportunities(opportunities)
}