export type DiscoveredTopic = {
  title: string
  source: string
  category: string
}

type BraveResult = {
  title?: string
  url?: string
}

async function braveTopicDiscovery(): Promise<DiscoveredTopic[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY

  if (!apiKey) {
    return []
  }

  try {
    const response = await fetch(
      "https://api.search.brave.com/res/v1/web/search?q=AI%20automation&count=10",
      {
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": apiKey,
        },
      }
    )

    if (!response.ok) {
      return []
    }

    const data = await response.json()

    const results: BraveResult[] = Array.isArray(data?.web?.results)
      ? data.web.results
      : []

    return results
      .filter((r) => r.title)
      .slice(0, 10)
      .map((r) => ({
        title: r.title as string,
        source: r.url || "brave",
        category: "ai-automation",
      }))
  } catch {
    return []
  }
}

export async function topicDiscovery(): Promise<DiscoveredTopic[]> {
  const braveTopics = await braveTopicDiscovery()

  if (braveTopics.length > 0) {
    return braveTopics
  }

  return [
    {
      title: "AI Automation for Churches",
      source: "seed",
      category: "ai-automation",
    },
    {
      title: "AI Agents for Small Business",
      source: "seed",
      category: "ai-automation",
    },
    {
      title: "The Future of AI Content Creation",
      source: "seed",
      category: "ai-automation",
    },
  ]
}
