import type { VerifiedFact } from "./fact-verification-engine"

export type CitationRecord = {
  claim: string
  verificationStatus: VerifiedFact["verificationStatus"]
  verificationCount: number
  sources: string[]
}

export type CitationBuilderResult = {
  citations: CitationRecord[]
  citationCount: number
  builderStatus: string
}

export function citationBuilder(
  verifiedFacts: VerifiedFact[]
): CitationBuilderResult {
  const citations = verifiedFacts.map((fact) => ({
    claim: fact.claim,
    verificationStatus: fact.verificationStatus,
    verificationCount: fact.verificationCount,
    sources: fact.supportingSources.map(
      (source) => source.sourceTitle
    ),
  }))

  return {
    citations,
    citationCount: citations.length,
    builderStatus:
      citations.length > 0
        ? "Citation records built from verified facts."
        : "No citation records available.",
  }
}

export function formatCitationForMdx(
  citation: CitationRecord
): string {
  const sourceList = citation.sources.join(", ")

  return `- **Claim:** ${citation.claim}\n  - **Status:** ${citation.verificationStatus}\n  - **Sources:** ${sourceList}`
}

export function formatCitationsForMdx(
  citations: CitationRecord[]
): string {
  if (citations.length === 0) {
    return "- No verified citations available."
  }

  return citations
    .map((citation) => formatCitationForMdx(citation))
    .join("\n\n")
}
