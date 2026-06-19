import { DISCOVERY_CATEGORIES } from "./discovery-categories"

export type DiscoveredTopic = {
  title: string
  source: string
  category: string
}

type BraveResult = {
  title?: string
  url?: string
}

async function braveTopicDiscovery(
  query: string,
  category: string
): Promise<DiscoveredTopic[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY

  if (!apiKey) return []

  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(
        query
      )}&count=5`,
      {
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": apiKey,
        },
      }
    )

    if (!response.ok) return []

    const data = await response.json()

    const results: BraveResult[] = Array.isArray(data?.web?.results)
      ? data.web.results
      : []

    return results
      .filter((result) => result.title)
      .slice(0, 5)
      .map((result) => ({
        title: result.title as string,
        source: result.url || "brave",
        category,
      }))
  } catch {
    return []
  }
}

function dedupeTopics(topics: DiscoveredTopic[]) {
  const seen = new Set<string>()

  return topics.filter((topic) => {
    const key = `${topic.category}:${topic.title.toLowerCase()}`

    if (seen.has(key)) return false

    seen.add(key)
    return true
  })
}

export async function topicDiscovery(): Promise<DiscoveredTopic[]> {
  const allTopics: DiscoveredTopic[] = []

  for (const discoveryCategory of DISCOVERY_CATEGORIES) {
    for (const query of discoveryCategory.searches) {
      const topics = await braveTopicDiscovery(
        query,
        discoveryCategory.category
      )

      allTopics.push(...topics)
    }
  }

  const braveTopics = dedupeTopics(allTopics).slice(0, 60)

  if (braveTopics.length > 0) {
    return braveTopics
  }

  return [
    {
      title: "Best AI Tools for Creators",
      source: "seed",
      category: "ai-tools",
    },
    {
      title: "The Story of David and Goliath",
      source: "seed",
      category: "bible-stories",
    },
    {
      title: "How to Build Daily Discipline",
      source: "seed",
      category: "motivation",
    },
    {
      title: "Lessons from Ancient Civilizations",
      source: "seed",
      category: "history",
    },
    {
      title: "Latest Discoveries in Space Exploration",
      source: "seed",
      category: "space",
    },
    {
      title: "Healthy Lifestyle Habits That Last",
      source: "seed",
      category: "health",
    },
  ]
}