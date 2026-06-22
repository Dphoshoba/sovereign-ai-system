import { searchAdapter } from "./search-adapter"

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
  if (lower.includes("openai.com")) return 90
  if (lower.includes("microsoft.com")) return 85
  if (lower.includes("google.com")) return 85
  if (lower.includes("ibm.com")) return 80
  if (lower.includes("reuters.com")) return 85
  if (lower.includes("bbc.com")) return 85
  if (lower.includes("apnews.com")) return 85
  if (lower.includes("forbes.com")) return 70
  if (lower.includes("hbr.org")) return 75

  return 50
}

function scoreTrust(url: string): number {
  const lower = url.toLowerCase()

  if (lower.includes(".gov")) return 95
  if (lower.includes(".edu")) return 90
  if (lower.includes("reuters.com")) return 90
  if (lower.includes("bbc.com")) return 88
  if (lower.includes("apnews.com")) return 88
  if (lower.includes("openai.com")) return 85
  if (lower.includes("microsoft.com")) return 82
  if (lower.includes("google.com")) return 82
  if (lower.includes("ibm.com")) return 80
  if (lower.includes("forbes.com")) return 70
  if (lower.includes("hbr.org")) return 75

  return 65
}

function average(values: number[]): number {
  if (values.length === 0) return 0

  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length
  )
}

function normalizeSources(sources: SourceRecord[]): SourceRecord[] {
  return sources.map((source) => ({
    ...source,
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
  const searchedSources = await searchAdapter(topic)

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
        : "No sources collected. Search provider returned no results.",
  }
}