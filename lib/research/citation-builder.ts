import type { VerifiedFact } from "./fact-verification-engine"

export type CitationRecord = {
  claim: string
  verificationStatus: string
  verificationMethod: string
  verificationCount: number
  sources: {
    title: string
    url: string
    evidenceId: string
  }[]
}

export type CitationBuilderResult = {
  citations: CitationRecord[]
  citationCount: number
  citationStatus: string
}

export function citationBuilder(
  verifiedFacts: VerifiedFact[]
): CitationBuilderResult {
  const citations = verifiedFacts.map((fact) => ({
    claim: fact.claim,
    verificationStatus: fact.verificationStatus,
    verificationMethod: fact.verificationMethod,
    verificationCount: fact.verificationCount,
    sources: fact.supportingSources.map((source) => ({
      title: source.sourceTitle,
      url: source.sourceUrl,
      evidenceId: source.evidenceId,
    })),
  }))

  return {
    citations,
    citationCount: citations.length,
    citationStatus:
      citations.length > 0
        ? "Citation records created successfully."
        : "No citations created.",
  }
}
