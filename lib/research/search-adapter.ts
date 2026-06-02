import type { SourceRecord } from "./source-collector"

type BraveWebResult = {
  title?: string
  url?: string
}

async function braveSearch(topic: string): Promise<SourceRecord[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY

  if (!apiKey) {
    return []
  }

  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(topic)}&count=5`,
      {
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": process.env.BRAVE_SEARCH_API_KEY!,
        },
      }
    )

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    const results: BraveWebResult[] = Array.isArray(data?.web?.results)
      ? data.web.results
      : []

    return results
      .slice(0, 5)
      .filter((result) => typeof result.url === "string" && result.url)
      .map((result) => ({
        title: result.title || (result.url as string),
        url: result.url as string,
        sourceType: "web",
        relevanceScore: 80,
      }))
  } catch (error) {
    console.error("searchAdapter (brave provider) failed:", error)
    return []
  }
}

export async function searchAdapter(
  topic: string
): Promise<SourceRecord[]> {
  const provider = (process.env.SEARCH_PROVIDER || "none")
    .trim()
    .toLowerCase()

  if (provider === "brave") {
    return braveSearch(topic)
  }

  // "none" and any unknown provider return nothing so the pipeline reports a
  // clean "no sources" state rather than fabricating evidence.
  return []
}
