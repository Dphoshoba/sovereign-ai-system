import type { EvidenceRecord } from "./evidence-registry"

export type ExtractedFact = {
  claim: string
  evidenceId: string
  sourceTitle: string
  sourceUrl: string
  sourceType: string
  evidenceText: string
  confidence: "high" | "medium" | "low"
  requiresHumanReview: boolean
}

export type FactExtractionResult = {
  topic: string
  facts: ExtractedFact[]
  factCount: number
  extractionStatus: string
}

function confidenceLabel(confidence: number) {
  if (confidence >= 90) return "high"
  if (confidence >= 70) return "medium"
  return "low"
}

function buildClaim(topic: string, evidence: EvidenceRecord) {
  const normalizedTitle = evidence.sourceTitle.toLowerCase()

  if (
    normalizedTitle.includes("ethics") ||
    normalizedTitle.includes("unesco")
  ) {
    return `Ethical frameworks are important when discussing the responsible use of AI in relation to ${topic}.`
  }

  if (normalizedTitle.includes("artificial intelligence")) {
    return `Artificial intelligence is a core background concept for understanding ${topic}.`
  }

  return `This evidence may provide relevant background for ${topic}: ${evidence.sourceTitle}.`
}

export function factExtractor(
  topic: string,
  evidenceRecords: EvidenceRecord[]
): FactExtractionResult {
  const facts = evidenceRecords.map((evidence) => ({
    claim: buildClaim(topic, evidence),
    evidenceId: evidence.id,
    sourceTitle: evidence.sourceTitle,
    sourceUrl: evidence.sourceUrl,
    sourceType: evidence.sourceType,
    evidenceText: evidence.extractedText,
    confidence: confidenceLabel(evidence.confidence),
    requiresHumanReview: true,
  })) as ExtractedFact[]

  return {
    topic,
    facts,
    factCount: facts.length,
    extractionStatus:
      facts.length > 0
        ? "Structured facts extracted from evidence records."
        : "No facts extracted because no evidence records were supplied.",
  }
}
