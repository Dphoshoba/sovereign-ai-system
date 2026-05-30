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

function buildClaim(topic: string, source: SourceRecord) {
  const normalizedTitle = source.title.toLowerCase()

  if (
    normalizedTitle.includes("ethics") ||
    normalizedTitle.includes("unesco")
  ) {
    return `Ethical frameworks are important when discussing the responsible use of AI in relation to ${topic}.`
  }

  if (normalizedTitle.includes("artificial intelligence")) {
    return `Artificial intelligence is a core background concept for understanding ${topic}.`
  }

  return `This source may provide relevant background for ${topic}: ${source.title}.`
}

export function factExtractor(
  topic: string,
  sources: SourceRecord[]
): FactExtractionResult {
  const facts = sources.map((source) => ({
    claim: buildClaim(topic, source),
    sourceTitle: source.title,
    sourceUrl: source.url,
    sourceType: source.sourceType,
    confidence:
      source.relevanceScore >= 90
        ? "high"
        : source.relevanceScore >= 70
        ? "medium"
        : "low",
    requiresHumanReview: true,
  })) as ExtractedFact[]

  return {
    topic,
    facts,
    factCount: facts.length,
    extractionStatus:
      facts.length > 0
        ? "Structured facts extracted from supplied sources."
        : "No facts extracted because no sources were supplied.",
  }
}
