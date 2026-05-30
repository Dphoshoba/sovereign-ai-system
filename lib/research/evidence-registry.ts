import type { SourceRecord } from "./source-collector"
import { contentFetcher } from "./content-fetcher"

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

export async function evidenceRegistry(
  topic: string,
  sources: SourceRecord[]
): Promise<EvidenceRegistryResult> {
  const evidence = await Promise.all(
    sources.map(async (source, index) => {
      const fetched = await contentFetcher(source.url, source.title)

      return {
        id: createEvidenceId(index),
        sourceTitle: fetched.title,
        sourceUrl: fetched.url,
        sourceType: source.sourceType,
        extractedText: fetched.extractedText,
        confidence: source.relevanceScore,
        requiresHumanReview: true,
      }
    })
  )

  return {
    topic,
    evidence,
    evidenceCount: evidence.length,
    registryStatus:
      evidence.length > 0
        ? "Evidence registry created from fetched source content."
        : "No evidence available.",
  }
}
