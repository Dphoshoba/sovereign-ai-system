import type { ExtractedFact } from "./fact-extractor"
import {
  claimSimilarity,
  claimsAreSimilar,
} from "./claim-similarity"

const SIMILARITY_THRESHOLD = 65

export type VerifiedFact = ExtractedFact & {
  verificationCount: number
  verificationStatus:
    | "verified"
    | "partially verified"
    | "unverified"

  verificationMethod: "exact" | "semantic"

  supportingSources: {
    sourceTitle: string
    sourceUrl: string
    evidenceId: string
  }[]

  similarityMatches?: {
    claim: string
    score: number
  }[]
}

export type FactVerificationEngineResult = {
  verifiedFacts: VerifiedFact[]
  verifiedCount: number
  partiallyVerifiedCount: number
  unverifiedCount: number
  publicationBlocked: boolean
}

function normalizeClaim(claim: string) {
  return claim
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
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

    const similarityMatches = groupFacts
      .slice(1)
      .map((fact) => ({
        claim: fact.claim,
        score: claimSimilarity(
          baseFact.claim,
          fact.claim
        ),
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

    const supportingSources = Array.from(
      uniqueSources.values()
    )

    const verificationCount = supportingSources.length

    const verificationStatus =
      verificationCount >= 3
        ? "verified"
        : verificationCount === 2
        ? "partially verified"
        : "unverified"

    const verificationMethod =
      similarityMatches.length > 0
        ? "semantic"
        : "exact"

    verifiedFacts.push({
      ...baseFact,
      verificationCount,
      verificationStatus,
      verificationMethod,
      supportingSources,
      similarityMatches,
    })
  }

  const verifiedCount = verifiedFacts.filter(
    (fact) => fact.verificationStatus === "verified"
  ).length

  const partiallyVerifiedCount = verifiedFacts.filter(
    (fact) =>
      fact.verificationStatus === "partially verified"
  ).length

  const unverifiedCount = verifiedFacts.filter(
    (fact) => fact.verificationStatus === "unverified"
  ).length

  return {
    verifiedFacts,
    verifiedCount,
    partiallyVerifiedCount,
    unverifiedCount,
    publicationBlocked: unverifiedCount > 0,
  }
}
