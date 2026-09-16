import type { SourceRecord } from "./source-collector"
import { contentFetcher, type ContentFetchDeps } from "./content-fetcher"
import { evidenceChunker } from "./evidence-chunker"
import { chunkRanker } from "./chunk-ranker"
import { isChromePassage } from "./evidence-chrome"
import { passageSupportsClaim } from "./article-claim-extractor"

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

export type EvidenceRegistryOptions = ContentFetchDeps & {
  fetchContent?: typeof contentFetcher
  claimTexts?: string[]
}

function isUsefulEvidence(text: string, claimTexts: string[] = []): boolean {
  const normalized = text.toLowerCase().trim()

  if (normalized.length < 80) return false
  if (isChromePassage(text)) return false

  if (claimTexts.length > 0) {
    return claimTexts.some((claim) => passageSupportsClaim(claim, text))
  }

  const blocked = [
    "cookie",
    "privacy policy",
    "terms of service",
    "subscribe",
    "newsletter",
    "contact us",
    "sign up",
    "menu",
    "copyright",
    "all rights reserved",
    "read more",
    "follow us",
    "table of contents",
  ]

  if (blocked.some((phrase) => normalized.includes(phrase))) {
    return false
  }

  const useful = [
    "research",
    "study",
    "survey",
    "report",
    "analysis",
    "evidence",
    "automation",
    "artificial intelligence",
    "generative ai",
    "workflow",
    "productivity",
    "ethics",
    "responsible",
    "governance",
    "risk",
    "trend",
  ]

  return useful.some((word) => normalized.includes(word))
}

function sourceTypeBoost(sourceType: string): number {
  switch (sourceType) {
    case "government":
      return 15
    case "academic":
      return 15
    case "industry-research":
      return 12
    case "research-media":
      return 10
    case "policy":
      return 10
    case "authority":
      return 8
    default:
      return 0
  }
}

export async function evidenceRegistry(
  topic: string,
  sources: SourceRecord[],
  options: EvidenceRegistryOptions = {},
): Promise<EvidenceRegistryResult> {
  const evidenceRecords: EvidenceRecord[] = []
  const fetchContent = options.fetchContent ?? contentFetcher
  const claimTexts = options.claimTexts ?? []

  for (const source of sources) {
    const fetched = await fetchContent(source.url, source.title, options)

    if (fetched.fetchStatus !== "success" || !fetched.extractedText) {
      continue
    }

    const chunks = evidenceChunker(fetched.extractedText, 120)
    const rankedChunks = chunkRanker(
      [topic, ...claimTexts].filter(Boolean).join(" "),
      chunks,
    )
      .filter((chunk) => isUsefulEvidence(chunk.text, claimTexts))
      .slice(0, 3)

    for (const chunk of rankedChunks) {
      evidenceRecords.push({
        id: `${source.title
          .toLowerCase()
          .replace(/\s+/g, "-")}-${chunk.id}`,

        sourceTitle: fetched.title || source.title,
        sourceUrl: source.url,
        sourceType: source.sourceType,

        extractedText: chunk.text,

        confidence: Math.min(
          100,
          (source.relevanceScore ?? 70) + sourceTypeBoost(source.sourceType)
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
        ? "Evidence registry created from filtered and ranked evidence chunks."
        : "No useful evidence available after filtering.",
  }
}
