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
  const text = evidence.extractedText.toLowerCase()

  if (
    text.includes("artificial intelligence") &&
    text.includes("simulate human learning")
  ) {
    return `Artificial intelligence can be understood as technology that enables computers and machines to simulate aspects of human learning, comprehension, problem solving, decision making, creativity and autonomy.`
  }

  if (
    text.includes("generative ai") &&
    text.includes("create original text")
  ) {
    return `Generative AI can create original content such as text, images, video and other media.`
  }

  if (
    text.includes("machine learning") &&
    text.includes("deep learning")
  ) {
    return `Machine learning and deep learning are foundational technologies behind many generative AI systems.`
  }

  if (
    text.includes("ethics") ||
    text.includes("responsible use")
  ) {
    return `Ethical frameworks are important when discussing the responsible use of AI in relation to ${topic}.`
  }

  return `This evidence provides relevant background for ${topic}.`
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
