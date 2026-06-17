import { searchAdapter } from "./search-adapter"

export type SourceRecord = {
  title: string
  url: string
  sourceType: string
  relevanceScore: number

  authorityScore?: number
  freshnessScore?: number
  trustScore?: number
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

function calculateAuthorityScore(url: string): number {
  const lower = url.toLowerCase()

  if (lower.includes(".gov")) return 100
  if (lower.includes(".edu")) return 95

  if (
    lower.includes("nature.com") ||
    lower.includes("science.org") ||
    lower.includes("nih.gov")
  ) {
    return 90
  }

  if (
    lower.includes("reuters.com") ||
    lower.includes("bbc.com") ||
    lower.includes("apnews.com")
  ) {
    return 85
  }

  if (
    lower.includes("microsoft.com") ||
    lower.includes("google.com") ||
    lower.includes("openai.com")
  ) {
    return 80
  }

  return 50
}

function calculateFreshnessScore(): number {
  return 75
}

function calculateTrustScore(
  authorityScore: number,
  relevanceScore: number,
  freshnessScore: number
): number {
  return Math.round(
    authorityScore * 0.5 +
      relevanceScore * 0.3 +
      freshnessScore * 0.2
  )
}

export async function sourceCollector(
  topic: string,
  manualSources: SourceRecord[] = []
): Promise<SourceCollectionResult> {
  const searchSources = await searchAdapter(topic)

  const combinedSources = [
    ...manualSources,
    ...searchSources,
  ]

  const collectedSources = combinedSources.map((source) => {
    const authorityScore = calculateAuthorityScore(source.url)
    const freshnessScore = calculateFreshnessScore()

    const trustScore = calculateTrustScore(
      authorityScore,
      source.relevanceScore,
      freshnessScore
    )

    return {
      ...source,
      authorityScore,
      freshnessScore,
      trustScore,
    }
  })

  const averageAuthorityScore =
    collectedSources.length > 0
      ? Math.round(
          collectedSources.reduce(
            (sum, source) =>
              sum + (source.authorityScore || 0),
            0
          ) / collectedSources.length
        )
      : 0

  const averageTrustScore =
    collectedSources.length > 0
      ? Math.round(
          collectedSources.reduce(
            (sum, source) =>
              sum + (source.trustScore || 0),
            0
          ) / collectedSources.length
        )
      : 0

  const researchConfidence = Math.round(
    averageAuthorityScore * 0.4 +
      averageTrustScore * 0.4 +
      Math.min(collectedSources.length * 5, 20)
  )

  return {
    topic,
    collectedSources,
    sourceCount: collectedSources.length,
    averageAuthorityScore,
    averageTrustScore,
    researchConfidence,
    collectionStatus:
      collectedSources.length > 0
        ? "Sources collected and scored."
        : "No sources collected. Search provider is not connected yet.",
  }
}