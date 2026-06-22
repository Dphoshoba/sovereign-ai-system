import { searchAdapter } from "./search-adapter"
import { fallbackSources } from "./fallback-source-provider"

export type SourceRecord = {
  title: string
  url: string
  sourceType: string
  authorityScore?: number
  trustScore?: number
  freshnessScore?: number
  relevanceScore: number
}

export type SourceCollectionResult = {
  topic: string
  collectedSources: SourceRecord[]
  sourceCount: number
  averageAuthorityScore: number
  averageTrustScore: number
  researchConfidence: number
  collectionStatus: string
}

function scoreAuthority(url: string): number {
  const lower = url.toLowerCase()

  if (lower.includes(".gov")) return 100
  if (lower.includes(".edu")) return 95
  if (lower.includes("stanford.edu")) return 95
  if (lower.includes("nist.gov")) return 95
  if (lower.includes("oecd.ai")) return 90
  if (lower.includes("openai.com")) return 90
  if (lower.includes("microsoft.com")) return 85
  if (lower.includes("google.com")) return 85
  if (lower.includes("ibm.com")) return 80
  if (lower.includes("nvidia.com")) return 80
  if (lower.includes("reuters.com")) return 85
  if (lower.includes("bbc.com")) return 85
  if (lower.includes("apnews.com")) return 85
  if (lower.includes("mckinsey.com")) return 80
  if (lower.includes("hbr.org")) return 75
  if (lower.includes("technologyreview.com")) return 75
  if (lower.includes("forbes.com")) return 70

  return 50
}

function scoreTrust(url: string): number {
  const lower = url.toLowerCase()

  if (lower.includes(".gov")) return 95
  if (lower.includes(".edu")) return 90
  if (lower.includes("stanford.edu")) return 90
  if (lower.includes("nist.gov")) return 95
  if (lower.includes("oecd.ai")) return 90
  if (lower.includes("reuters.com")) return 90
  if (lower.includes("bbc.com")) return 88
  if (lower.includes("apnews.com")) return 88
  if (lower.includes("openai.com")) return 85
  if (lower.includes("microsoft.com")) return 82
  if (lower.includes("google.com")) return 82
  if (lower.includes("ibm.com")) return 80
  if (lower.includes("nvidia.com")) return 78
  if (lower.includes("mckinsey.com")) return 78
  if (lower.includes("hbr.org")) return 75
  if (lower.includes("technologyreview.com")) return 75
  if (lower.includes("forbes.com")) return 70

  return 65
}

function average(values: number[]): number {
  if (values.length === 0) return 0

  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length
  )
}

function normalizeUrl(url: string): string {
  return url.trim()
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

function normalizeSources(sources: SourceRecord[]): SourceRecord[] {
  return dedupeSources(sources).map((source) => ({
    ...source,
    url: normalizeUrl(source.url),
    authorityScore: source.authorityScore ?? scoreAuthority(source.url),
    trustScore: source.trustScore ?? scoreTrust(source.url),
    freshnessScore: source.freshnessScore ?? 75,
    relevanceScore: source.relevanceScore ?? 70,
  }))
}

export async function sourceCollector(
  topic: string,
  manualSources: SourceRecord[] = []
): Promise<SourceCollectionResult> {
  const searchResults = await searchAdapter(topic)

  const searchedSources =
    searchResults.length > 0 ? searchResults : fallbackSources(topic)

  const collectedSources = normalizeSources([
    ...manualSources,
    ...searchedSources,
  ]).slice(0, 8)

  const sourceCount = collectedSources.length

  const averageAuthorityScore = average(
    collectedSources.map((source) => source.authorityScore ?? 0)
  )

  const averageTrustScore = average(
    collectedSources.map((source) => source.trustScore ?? 0)
  )

  const averageRelevanceScore = average(
    collectedSources.map((source) => source.relevanceScore ?? 0)
  )

  const researchConfidence =
    sourceCount === 0
      ? 0
      : Math.round(
          average([
            averageAuthorityScore,
            averageTrustScore,
            averageRelevanceScore,
          ])
        )

  return {
    topic,
    collectedSources,
    sourceCount,
    averageAuthorityScore,
    averageTrustScore,
    researchConfidence,
    collectionStatus:
      sourceCount > 0
        ? "Sources collected successfully."
        : "No sources collected. Search provider and fallback returned no results.",
  }
}