import type { ExtractedFact } from "./fact-extractor"
import { independentDocumentKey } from "./claim-source-attribution"
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
  extractedCount: number
  deduplicatedCount: number
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
  if (lower.includes("stanford.edu")) return 95
  if (lower.includes("nist.gov")) return 95
  if (lower.includes("oecd.ai")) return 90
  if (lower.includes("nature.com")) return 90
  if (lower.includes("science.org")) return 90
  if (lower.includes("nih.gov")) return 90
  if (lower.includes("reuters.com")) return 85
  if (lower.includes("bbc.com")) return 85
  if (lower.includes("apnews.com")) return 85
  if (lower.includes("openai.com")) return 85
  if (lower.includes("microsoft.com")) return 85
  if (lower.includes("google.com")) return 82
  if (lower.includes("ibm.com")) return 80
  if (lower.includes("nvidia.com")) return 80
  if (lower.includes("mckinsey.com")) return 80
  if (lower.includes("hbr.org")) return 75
  if (lower.includes("technologyreview.com")) return 75
  if (lower.includes("forbes.com")) return 70

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
  const sourceCountScore = Math.min(verificationCount * 32, 96)

  const similarityScore =
    similarityMatches.length > 0
      ? Math.round(
          similarityMatches.reduce((sum, match) => sum + match.score, 0) /
            similarityMatches.length
        )
      : verificationCount > 1
        ? 80
        : 0

  return Math.min(
    Math.round(
      sourceCountScore * 0.45 +
        sourceAuthorityAverage * 0.35 +
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
    const distinctFacts: ExtractedFact[] = []
    const seenEvidenceIds = new Set<string>()
    const seenEvidenceText = new Set<string>()

    for (const fact of groupFacts) {
      const textKey = fact.evidenceText.trim().toLowerCase().replace(/\s+/g, " ")
      if (seenEvidenceIds.has(fact.evidenceId) || seenEvidenceText.has(textKey)) {
        continue
      }
      seenEvidenceIds.add(fact.evidenceId)
      seenEvidenceText.add(textKey)
      distinctFacts.push(fact)
    }

    const baseFact = distinctFacts[0]
    const similarityMatches = distinctFacts.slice(1).map((fact) => ({
      claim: fact.claim,
      score: claimSimilarity(baseFact.claim, fact.claim),
    }))
    const documents = new Map<string, ExtractedFact>()
    for (const fact of distinctFacts) {
      const documentKey = independentDocumentKey(fact.sourceUrl)
      if (!documents.has(documentKey)) documents.set(documentKey, fact)
    }
    const supportingSources = Array.from(documents.values()).map((fact) => ({
      sourceTitle: fact.sourceTitle,
      sourceUrl: fact.sourceUrl,
      evidenceId: fact.evidenceId,
    }))
    const verificationCount = documents.size
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
      verificationCount >= 2 &&
      (verificationCount >= 3 ||
        verificationScore >= 68 ||
        (sourceAuthorityAverage >= 75 && strongSemanticMatch))
        ? "verified"
        : verificationCount >= 2 ||
            (verificationCount > 1 && strongSemanticMatch) ||
            (verificationCount > 1 && verificationScore >= 50)
          ? "partially verified"
          : "unverified"

    const verificationMethod =
      verificationCount > 1 && similarityMatches.length > 0
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
    extractedCount: facts.length,
    deduplicatedCount: verifiedFacts.length,
    verifiedCount,
    partiallyVerifiedCount,
    unverifiedCount,
    averageVerificationScore,
    publicationBlocked:
      verifiedFacts.length === 0 || unverifiedCount > 0,
  }
}
