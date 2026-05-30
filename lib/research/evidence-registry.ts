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

function createEvidenceId(index: number) {
  return `evidence-${index + 1}`
}

export function evidenceRegistry(
  topic: string,
  sources: SourceRecord[]
): EvidenceRegistryResult {
  const evidence = sources.map((source, index) => ({
    id: createEvidenceId(index),
    sourceTitle: source.title,
    sourceUrl: source.url,
    sourceType: source.sourceType,
    extractedText:
      `Evidence placeholder derived from source: ${source.title}`,
    confidence: source.relevanceScore,
    requiresHumanReview: true,
  }))

  return {
    topic,
    evidence,
    evidenceCount: evidence.length,
    registryStatus:
      evidence.length > 0
        ? "Evidence registry created."
        : "No evidence available.",
  }
}
