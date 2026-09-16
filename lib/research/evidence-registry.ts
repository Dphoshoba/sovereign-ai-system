import type { SourceRecord } from "./source-collector"
import { contentFetcher, type ContentFetchDeps } from "./content-fetcher"
import { evidenceChunker } from "./evidence-chunker"
import { chunkRanker } from "./chunk-ranker"
import { isChromePassage } from "./evidence-chrome"
import { passageSupportsClaim } from "./article-claim-extractor"
import {
  emptyDiagnostic,
  rejectionReasonFor,
  sourceIdFromTitle,
  type SourceAcquisitionDiagnostic,
} from "./source-acquisition"

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
  sourceDiagnostics?: SourceAcquisitionDiagnostic[]
  listedSourceCount?: number
  acceptedSourceCount?: number
  unavailableSourceCount?: number
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

async function collectFromSource(
  topic: string,
  source: SourceRecord,
  options: EvidenceRegistryOptions,
): Promise<{
  evidence: EvidenceRecord[]
  diagnostic: SourceAcquisitionDiagnostic
}> {
  const fetchContent = options.fetchContent ?? contentFetcher
  const claimTexts = options.claimTexts ?? []
  const fetched = await fetchContent(source.url, source.title, options)
  const diagnostic: SourceAcquisitionDiagnostic = {
    ...fetched.diagnostic,
    sourceId: fetched.diagnostic.sourceId || sourceIdFromTitle(source.title, source.url),
  }

  if (fetched.fetchStatus !== "success" || !fetched.extractedText) {
    return { evidence: [], diagnostic }
  }

  if (isChromePassage(fetched.extractedText)) {
    return {
      evidence: [],
      diagnostic: {
        ...diagnostic,
        category: "chrome_only",
        acceptedPassageCount: 0,
        rejectionReason: rejectionReasonFor("chrome_only"),
      },
    }
  }

  const chunks = evidenceChunker(fetched.extractedText, 120)
  const rankedChunks = chunkRanker(
    [topic, ...claimTexts].filter(Boolean).join(" "),
    chunks,
  )
    .filter((chunk) => isUsefulEvidence(chunk.text, claimTexts))
    .slice(0, 3)

  if (rankedChunks.length === 0) {
    return {
      evidence: [],
      diagnostic: {
        ...diagnostic,
        category: "no_relevant_passage",
        acceptedPassageCount: 0,
        rejectionReason: rejectionReasonFor("no_relevant_passage"),
      },
    }
  }

  const evidence = rankedChunks.map((chunk) => ({
    id: `${source.title.toLowerCase().replace(/\s+/g, "-")}-${chunk.id}`,
    sourceTitle: fetched.title || source.title,
    sourceUrl: source.url,
    sourceType: source.sourceType,
    extractedText: chunk.text,
    confidence: Math.min(
      100,
      (source.relevanceScore ?? 70) + sourceTypeBoost(source.sourceType),
    ),
    requiresHumanReview: true,
  }))

  return {
    evidence,
    diagnostic: {
      ...diagnostic,
      category: "accepted",
      acceptedPassageCount: evidence.length,
      rejectionReason: "",
    },
  }
}

export async function evidenceRegistry(
  topic: string,
  sources: SourceRecord[],
  options: EvidenceRegistryOptions = {},
): Promise<EvidenceRegistryResult> {
  const collected = await Promise.all(
    sources.map((source) => collectFromSource(topic, source, options)),
  )

  const evidenceRecords: EvidenceRecord[] = []
  const sourceDiagnostics: SourceAcquisitionDiagnostic[] = []

  for (const item of collected) {
    sourceDiagnostics.push(item.diagnostic)
    evidenceRecords.push(...item.evidence)
  }

  const acceptedSourceCount = sourceDiagnostics.filter(
    (diagnostic) => diagnostic.category === "accepted",
  ).length
  const unavailableSourceCount = sourceDiagnostics.filter(
    (diagnostic) => diagnostic.category !== "accepted",
  ).length

  return {
    topic,
    evidence: evidenceRecords,
    evidenceCount: evidenceRecords.length,
    sourceDiagnostics:
      sourceDiagnostics.length > 0
        ? sourceDiagnostics
        : sources.map((source) =>
            emptyDiagnostic(
              sourceIdFromTitle(source.title, source.url),
              source.url,
              "fetch_failed",
              rejectionReasonFor("fetch_failed"),
            ),
          ),
    listedSourceCount: sources.length,
    acceptedSourceCount,
    unavailableSourceCount,
    registryStatus:
      evidenceRecords.length > 0
        ? "Evidence registry created from filtered and ranked evidence chunks."
        : "No useful evidence available after filtering.",
  }
}
