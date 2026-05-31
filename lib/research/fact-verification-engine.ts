import type { ExtractedFact } from "./fact-extractor"

export type VerifiedFact = ExtractedFact & {
  verificationCount: number
  verificationStatus:
    | "verified"
    | "partially verified"
    | "unverified"
  supportingSources: {
    sourceTitle: string
    sourceUrl: string
    evidenceId: string
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
  const grouped = new Map<string, ExtractedFact[]>()

  for (const fact of facts) {
    const key = normalizeClaim(fact.claim)

    if (!grouped.has(key)) {
      grouped.set(key, [])
    }

    grouped.get(key)?.push(fact)
  }

  const verifiedFacts: VerifiedFact[] = []

  for (const groupFacts of grouped.values()) {
    const baseFact = groupFacts[0]

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
      verificationCount >= 2
        ? "verified"
        : verificationCount === 1
        ? "partially verified"
        : "unverified"

    verifiedFacts.push({
      ...baseFact,
      verificationCount,
      verificationStatus,
      supportingSources,
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
