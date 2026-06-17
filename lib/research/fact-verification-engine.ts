import type { ExtractedFact } from "./fact-extractor"
import {
  claimSimilarity,
  claimsAreSimilar,
} from "./claim-similarity"

const SIMILARITY_THRESHOLD = 55
const STRONG_SIMILARITY_THRESHOLD = 75

export type VerifiedFact = ExtractedFact & {
  verificationCount: number
  verificationStatus:
    | "verified"
    | "partially verified"
    | "unverified"

  verificationMethod: "exact" | "semantic" | "single-source-supported"

  supportingSources: {
    sourceTitle: string
    sourceUrl: string
    evidenceId: string
  }[]

  similarityMatches?: {
    claim: string
    score: number
  }[]

  verificationScore: number
}

export type FactVerificationEngineResult = {
  verifiedFacts: VerifiedFact[]
  verifiedCount: number
  partiallyVerifiedCount: number
  unverifiedCount: number
  averageVerificationScore: number
  publicationBlocked: boolean
}

function authorityScoreForUrl(url: string): number {
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

function calculateSourceAuthorityAverage(
  sources: { sourceUrl: string }[]
): number {
  if (sources.length === 0) return 0

  return Math.round(
    sources.reduce(
      (sum, source) => sum + authorityScoreForUrl(source.sourceUrl),
      0
    ) / sources.length
  )
}

function calculateVerificationScore(
  verificationCount: number,
  sourceAuthorityAverage: number,
  similarityMatches: { score: number }[]
): number {
  const sourceCountScore = Math.min(verificationCount * 30, 90)

  const similarityScore =
    similarityMatches.length > 0
      ? Math.round(
          similarityMatches.reduce((sum, match) => sum + match.score, 0) /
            similarityMatches.length
        )
      : 0

  return Math.min(
    Math.round(
      sourceCountScore * 0.5 +
        sourceAuthorityAverage * 0.3 +
        similarityScore * 0.2
    ),
    100
  )
}

export function factVerificationEngine(
  facts: ExtractedFact[]
): FactVerificationEngineResult {
  const grouped: ExtractedFact[][] = []

  for (const fact of facts) {
    let matchedGroup: ExtractedFact[] | null = null

    for (const group of grouped) {
      const representative = group[0]

      if (
        claimsAreSimilar(
          representative.claim,
          fact.claim,
          SIMILARITY_THRESHOLD
        )
      ) {
        matchedGroup = group
        break
      }
    }

    if (matchedGroup) {
      matchedGroup.push(fact)
    } else {
      grouped.push([fact])
    }
  }

  const verifiedFacts: VerifiedFact[] = []

  for (const groupFacts of grouped) {
    const baseFact = groupFacts[0]

    const similarityMatches = groupFacts.slice(1).map((fact) => ({
      claim: fact.claim,
      score: claimSimilarity(baseFact.claim, fact.claim),
    }))

    const uniqueSources = new Map<
      string,
      {
        sourceTitle: string
        sourceUrl: string
        evidenceId: string
      }
    >()

    for (const fact of groupFacts) {
      uniqueSources.set(fact.sourceUrl, {
        sourceTitle: fact.sourceTitle,
        sourceUrl: fact.sourceUrl,
        evidenceId: fact.evidenceId,
      })
    }

    const supportingSources = Array.from(uniqueSources.values())
    const verificationCount = supportingSources.length
    const sourceAuthorityAverage =
      calculateSourceAuthorityAverage(supportingSources)

    const strongSemanticMatch = similarityMatches.some(
      (match) => match.score >= STRONG_SIMILARITY_THRESHOLD
    )

    const verificationScore = calculateVerificationScore(
      verificationCount,
      sourceAuthorityAverage,
      similarityMatches
    )

    const verificationStatus =
      verificationCount >= 3
        ? "verified"
        : verificationCount === 2 || strongSemanticMatch || verificationScore >= 65
          ? "partially verified"
          : "unverified"

    const verificationMethod =
      similarityMatches.length > 0
        ? "semantic"
        : verificationCount > 1
          ? "exact"
          : "single-source-supported"

    verifiedFacts.push({
      ...baseFact,
      verificationCount,
      verificationStatus,
      verificationMethod,
      supportingSources,
      similarityMatches,
      verificationScore,
    })
  }

  const verifiedCount = verifiedFacts.filter(
    (fact) => fact.verificationStatus === "verified"
  ).length

  const partiallyVerifiedCount = verifiedFacts.filter(
    (fact) => fact.verificationStatus === "partially verified"
  ).length

  const unverifiedCount = verifiedFacts.filter(
    (fact) => fact.verificationStatus === "unverified"
  ).length

  const averageVerificationScore =
    verifiedFacts.length > 0
      ? Math.round(
          verifiedFacts.reduce(
            (sum, fact) => sum + fact.verificationScore,
            0
          ) / verifiedFacts.length
        )
      : 0

  return {
    verifiedFacts,
    verifiedCount,
    partiallyVerifiedCount,
    unverifiedCount,
    averageVerificationScore,
    publicationBlocked:
      verifiedCount === 0 && partiallyVerifiedCount === 0,
  }
}