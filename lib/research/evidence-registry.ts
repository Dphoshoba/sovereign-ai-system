import type { SourceRecord } from "./source-collector"
import { contentFetcher } from "./content-fetcher"
import { evidenceChunker } from "./evidence-chunker"
import { chunkRanker } from "./chunk-ranker"

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

export async function evidenceRegistry(
  topic: string,
  sources: SourceRecord[]
): Promise<EvidenceRegistryResult> {
  const evidenceRecords: EvidenceRecord[] = []

  for (const source of sources) {
    const fetched = await contentFetcher(
      source.url,
      source.title
    )

    const chunks = evidenceChunker(
      fetched.extractedText,
      120
    )

    const rankedChunks = chunkRanker(
      topic,
      chunks
    )

    const topChunks = rankedChunks.slice(0, 2)

    for (const chunk of topChunks) {
      evidenceRecords.push({
        id: `${source.title
          .toLowerCase()
          .replace(/\s+/g, "-")}-${chunk.id}`,

        sourceTitle: source.title,
        sourceUrl: source.url,
        sourceType: source.sourceType,

        extractedText: chunk.text,

        confidence: Math.min(
          100,
          source.relevanceScore
        ),

        requiresHumanReview: true,
      })
    }
  }

  return {
    topic,
    evidence: evidenceRecords,
    evidenceCount: evidenceRecords.length,
    registryStatus:
      evidenceRecords.length > 0
        ? "Evidence registry created from ranked chunks."
        : "No evidence available.",
  }
}
