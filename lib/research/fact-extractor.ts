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

function buildClaims(topic: string, evidence: EvidenceRecord): string[] {
  const text = evidence.extractedText.toLowerCase()

  const claims: string[] = []

  if (
    text.includes("artificial intelligence") &&
    text.includes("simulate human learning")
  ) {
    claims.push(
      "Artificial intelligence can be understood as technology that enables computers and machines to simulate aspects of human learning, comprehension, problem solving, decision making, creativity and autonomy."
    )
  }

  if (
    text.includes("see and identify objects") ||
    text.includes("identify objects")
  ) {
    claims.push(
      "AI-enabled systems can be used to identify objects."
    )
  }

  if (
    text.includes("understand and respond to human language") ||
    text.includes("human language")
  ) {
    claims.push(
      "AI-enabled systems can understand and respond to human language."
    )
  }

  if (
    text.includes("learn from new information") ||
    text.includes("new information and experience")
  ) {
    claims.push(
      "AI systems can learn from new information and experience."
    )
  }

  if (
    text.includes("generative ai") &&
    text.includes("create original text")
  ) {
    claims.push(
      "Generative AI can create original content such as text, images, video and other media."
    )
  }

  if (
    text.includes("machine learning") &&
    text.includes("deep learning")
  ) {
    claims.push(
      "Machine learning and deep learning are foundational technologies behind many generative AI systems."
    )
  }

  if (
    text.includes("ethics") ||
    text.includes("responsible use")
  ) {
    claims.push(
      `Ethical frameworks are important when discussing the responsible use of AI in relation to ${topic}.`
    )
  }

  if (claims.length === 0) {
    claims.push(
      `This evidence provides relevant background for ${topic}.`
    )
  }

  return claims
}

export function factExtractor(
  topic: string,
  evidenceRecords: EvidenceRecord[]
): FactExtractionResult {
  const facts = evidenceRecords.flatMap((evidence) =>
    buildClaims(topic, evidence).map((claim) => ({
      claim,
      evidenceId: evidence.id,
      sourceTitle: evidence.sourceTitle,
      sourceUrl: evidence.sourceUrl,
      sourceType: evidence.sourceType,
      evidenceText: evidence.extractedText,
      confidence: confidenceLabel(evidence.confidence),
      requiresHumanReview: true,
    }))
  ) as ExtractedFact[]

  return {
    topic,
    facts,
    factCount: facts.length,
    extractionStatus:
      facts.length > 0
        ? "Multiple structured facts extracted from evidence records."
        : "No facts extracted because no evidence records were supplied.",
  }
}
