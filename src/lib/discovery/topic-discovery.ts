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
      )}&count=15`,
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
      .filter((result) => result.title && result.url)
      .slice(0, 15)
      .map((result) => ({
        title: result.title as string,
        source: result.url as string,
        category,
      }))
  } catch {
    return []
  }
}

function dedupeTopicsByUrl(topics: DiscoveredTopic[]) {
  const seenUrls = new Set<string>()

  return topics.filter((topic) => {
    if (seenUrls.has(topic.source)) return false
    seenUrls.add(topic.source)
    return true
  })
}

function limitPerCategory(
  topics: DiscoveredTopic[],
  maxPerCategory: number = 10
) {
  const categoryCounts = new Map<string, number>()

  return topics.filter((topic) => {
    const count = categoryCounts.get(topic.category) || 0
    if (count >= maxPerCategory) return false
    categoryCounts.set(topic.category, count + 1)
    return true
  })
}

export async function topicDiscovery(): Promise<DiscoveredTopic[]> {
  const allTopics: DiscoveredTopic[] = []

  // Query each category with its specific searches
  for (const discoveryCategory of DISCOVERY_CATEGORIES) {
    const categoryTopics: DiscoveredTopic[] = []

    for (const query of discoveryCategory.searches) {
      const topics = await braveTopicDiscovery(
        query,
        discoveryCategory.category
      )
      categoryTopics.push(...topics)
    }

    // Deduplicate by URL within category, then limit to 10 per category
    const categoryDeduped = dedupeTopicsByUrl(categoryTopics)
    const categoryLimited = limitPerCategory(categoryDeduped, 10).filter(
      (t) => t.category === discoveryCategory.category
    )

    allTopics.push(...categoryLimited)
  }

  const braveTopics = dedupeTopicsByUrl(allTopics)

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