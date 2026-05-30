import type { SourceRecord } from "./source-collector"

export type ExtractedFact = {
  claim: string
  sourceTitle: string
  sourceUrl: string
  sourceType: string
  confidence: "high" | "medium" | "low"
  requiresHumanReview: boolean
}

export type FactExtractionResult = {
  topic: string
  facts: ExtractedFact[]
  factCount: number
  extractionStatus: string
}

export function factExtractor(
  topic: string,
  sources: SourceRecord[]
): FactExtractionResult {
  const facts = sources.map((source) => ({
    claim: `Source available for ${topic}: ${source.title}`,
    sourceTitle: source.title,
    sourceUrl: source.url,
    sourceType: source.sourceType,
    confidence:
      source.relevanceScore >= 90 ? "high" : "medium",
    requiresHumanReview: true,
  })) as ExtractedFact[]

  return {
    topic,
    facts,
    factCount: facts.length,
    extractionStatus:
      facts.length > 0
        ? "Facts extracted from supplied sources."
        : "No facts extracted because no sources were supplied.",
  }
}
