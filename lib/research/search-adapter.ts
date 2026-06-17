import type { SourceRecord } from "./source-collector"

type BraveWebResult = {
  title?: string
  url?: string
  description?: string
  age?: string
}

const BLOCKED_DOMAINS = [
  "reddit.com",
  "quora.com",
  "pinterest.com",
  "medium.com",
  "substack.com",
  "facebook.com",
  "x.com",
  "twitter.com",
  "tiktok.com",
  "instagram.com",
]

const PREFERRED_DOMAINS = [
  "openai.com",
  "microsoft.com",
  "google.com",
  "ibm.com",
  "mckinsey.com",
  "deloitte.com",
  "pwc.com",
  "forbes.com",
  "hbr.org",
  "reuters.com",
  "bbc.com",
  "apnews.com",
  "nature.com",
  "science.org",
  "nih.gov",
  "edu",
  "gov",
]

function normalizeUrl(url: string): string {
  return url.trim()
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "")
  } catch {
    return ""
  }
}

function isBlockedDomain(url: string): boolean {
  const hostname = getHostname(url)

  return BLOCKED_DOMAINS.some((domain) => hostname.endsWith(domain))
}

function preferredDomainScore(url: string): number {
  const hostname = getHostname(url)

  if (!hostname) return 0

  if (hostname.endsWith(".gov")) return 30
  if (hostname.endsWith(".edu")) return 28

  const matched = PREFERRED_DOMAINS.find(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  )

  return matched ? 20 : 0
}

function calculateSearchRelevanceScore(
  topic: string,
  result: BraveWebResult
): number {
  const title = result.title?.toLowerCase() || ""
  const description = result.description?.toLowerCase() || ""
  const url = result.url || ""

  const topicTerms = topic
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 3)

  const matchedTerms = topicTerms.filter(
    (term) => title.includes(term) || description.includes(term)
  ).length

  const topicalScore =
    topicTerms.length > 0
      ? Math.round((matchedTerms / topicTerms.length) * 50)
      : 25

  return Math.min(
    50 + topicalScore + preferredDomainScore(url),
    100
  )
}

function dedupeSources(sources: SourceRecord[]): SourceRecord[] {
  const seen = new Set<string>()

  return sources.filter((source) => {
    const key = normalizeUrl(source.url)

    if (seen.has(key)) return false

    seen.add(key)
    return true
  })
}

function buildSearchQueries(topic: string): string[] {
  return [
    topic,
    `${topic} research report`,
    `${topic} industry analysis`,
    `${topic} evidence trends`,
  ]
}

async function braveSearch(topic: string): Promise<SourceRecord[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY

  if (!apiKey) {
    return []
  }

  const queries = buildSearchQueries(topic)
  const sources: SourceRecord[] = []

  for (const query of queries) {
    try {
      const response = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(
          query
        )}&count=8`,
        {
          headers: {
            Accept: "application/json",
            "X-Subscription-Token": apiKey,
          },
        }
      )

      if (!response.ok) {
        continue
      }

      const data = await response.json()
      const results: BraveWebResult[] = Array.isArray(data?.web?.results)
        ? data.web.results
        : []

      for (const result of results) {
        if (typeof result.url !== "string" || !result.url) {
          continue
        }

        if (isBlockedDomain(result.url)) {
          continue
        }

        sources.push({
          title: result.title || result.url,
          url: normalizeUrl(result.url),
          sourceType: "web",
          relevanceScore: calculateSearchRelevanceScore(topic, result),
        })
      }
    } catch (error) {
      console.error("searchAdapter (brave provider) failed:", error)
    }
  }

  return dedupeSources(sources)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 8)
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

  return []
}