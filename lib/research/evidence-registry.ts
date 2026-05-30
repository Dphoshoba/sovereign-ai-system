import type { SourceRecord } from "./source-collector"

export type EvidenceRecord = {
  id: string
  sourceTitle: string
  sourceUrl: string
  sourceType: string
  extractedText: string
  confidence: number
  requiresHumanReview: boolean
}

export type EvidenceRegistryResult = {
  topic: string
  evidence: EvidenceRecord[]
  evidenceCount: number
  registryStatus: string
}

function buildEvidenceId(source: SourceRecord, index: number) {
  const slug = source.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  return `${slug || "source"}-${index + 1}`
}

function buildExtractedText(topic: string, source: SourceRecord) {
  const normalizedTitle = source.title.toLowerCase()

  if (
    normalizedTitle.includes("ethics") ||
    normalizedTitle.includes("unesco")
  ) {
    return `This source documents ethical frameworks and recommendations for the responsible use of artificial intelligence in relation to ${topic}.`
  }

  if (normalizedTitle.includes("artificial intelligence")) {
    return `This source explains core artificial intelligence concepts, terminology and background relevant to ${topic}.`
  }

  return `Extracted reference from "${source.title}" as background material for ${topic}.`
}

export function evidenceRegistry(
  topic: string,
  sources: SourceRecord[]
): EvidenceRegistryResult {
  const evidence = sources.map((source, index) => ({
    id: buildEvidenceId(source, index),
    sourceTitle: source.title,
    sourceUrl: source.url,
    sourceType: source.sourceType,
    extractedText: buildExtractedText(topic, source),
    confidence: source.relevanceScore,
    requiresHumanReview: true,
  })) as EvidenceRecord[]

  return {
    topic,
    evidence,
    evidenceCount: evidence.length,
    registryStatus:
      evidence.length > 0
        ? "Evidence registered from supplied sources."
        : "No evidence registered because no sources were supplied.",
  }
}
