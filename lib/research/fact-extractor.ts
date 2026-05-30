import type { EvidenceRecord } from "./evidence-registry"

export type ExtractedFact = {
  claim: string
  evidenceId: string
  extractedText: string
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

function buildClaim(topic: string, evidence: EvidenceRecord) {
  const normalizedText = evidence.extractedText.toLowerCase()

  if (
    normalizedText.includes("ethical frameworks") ||
    normalizedText.includes("recommendations for the responsible use")
  ) {
    return `Ethical frameworks are important when discussing the responsible use of AI in relation to ${topic}.`
  }

  if (
    normalizedText.includes("artificial intelligence concepts") ||
    normalizedText.includes("core artificial intelligence")
  ) {
    return `Artificial intelligence is a core background concept for understanding ${topic}.`
  }

  return `This evidence supports background research for ${topic}: ${evidence.sourceTitle}.`
}

function mapConfidence(score: number): "high" | "medium" | "low" {
  if (score >= 90) return "high"
  if (score >= 70) return "medium"
  return "low"
}

export function factExtractor(
  topic: string,
  evidence: EvidenceRecord[]
): FactExtractionResult {
  const facts = evidence.map((record) => ({
    claim: buildClaim(topic, record),
    evidenceId: record.id,
    extractedText: record.extractedText,
    sourceTitle: record.sourceTitle,
    sourceUrl: record.sourceUrl,
    sourceType: record.sourceType,
    confidence: mapConfidence(record.confidence),
    requiresHumanReview: record.requiresHumanReview,
  })) as ExtractedFact[]

  return {
    topic,
    facts,
    factCount: facts.length,
    extractionStatus:
      facts.length > 0
        ? "Structured facts extracted from registered evidence."
        : "No facts extracted because no evidence was registered.",
  }
}
