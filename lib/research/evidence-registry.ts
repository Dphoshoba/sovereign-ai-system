import type { SourceRecord } from "./source-collector"
import { contentFetcher, type ContentFetchDeps } from "./content-fetcher"
import { evidenceChunker } from "./evidence-chunker"
import { chunkRanker } from "./chunk-ranker"
import { isChromePassage } from "./evidence-chrome"
import { passageSupportsClaim } from "./article-claim-extractor"
import {
  claimAllowsEvidence,
  type AttributableSource,
} from "./claim-source-attribution"
import { collectPdfPassages } from "./pdf-evidence"
import {
  emptyDiagnostic,
  isUnavailableAcquisitionCategory,
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
  availableSourceCount?: number
  unavailableSourceCount?: number
  noRelevantPassageCount?: number
}

export type EvidenceRegistryOptions = ContentFetchDeps & {
  fetchContent?: typeof contentFetcher
  claimTexts?: string[]
  listedSources?: AttributableSource[]
}

function isUsefulHtmlEvidence(
  text: string,
  claimTexts: string[] = [],
  source?: { url: string; title?: string | null },
  listedSources: AttributableSource[] = [],
): boolean {
  const normalized = text.toLowerCase().trim()

  if (normalized.length < 80) return false
  if (isChromePassage(text)) return false

  if (claimTexts.length > 0) {
    return claimTexts.some((claim) => {
      if (
        source &&
        !claimAllowsEvidence(
          claim,
          { url: source.url, title: source.title },
          listedSources,
        )
      ) {
        return false
      }
      return passageSupportsClaim(claim, text, { documentKind: "html" })
    })
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

function evidenceFromChunks(
  source: SourceRecord,
  fetchedTitle: string,
  chunks: Array<{ id: string; text: string }>,
): EvidenceRecord[] {
  return chunks.map((chunk) => ({
    id: `${source.title.toLowerCase().replace(/\s+/g, "-")}-${chunk.id}`,
    sourceTitle: fetchedTitle || source.title,
    sourceUrl: source.url,
    sourceType: source.sourceType,
    extractedText: chunk.text,
    confidence: Math.min(
      100,
      (source.relevanceScore ?? 70) + sourceTypeBoost(source.sourceType),
    ),
    requiresHumanReview: true,
  }))
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
  const listedSources = options.listedSources ?? []
  const fetched = await fetchContent(source.url, source.title, options)
  const diagnostic: SourceAcquisitionDiagnostic = {
    ...fetched.diagnostic,
    sourceId: fetched.diagnostic.sourceId || sourceIdFromTitle(source.title, source.url),
  }

  if (fetched.fetchStatus !== "success" || !fetched.extractedText) {
    return { evidence: [], diagnostic }
  }

  const sourceIdentity = { url: source.url, title: source.title }

  if (fetched.contentKind === "pdf") {
    const scanned = collectPdfPassages({
      pages: fetched.pdfPages ?? [{ pageNumber: 1, text: fetched.extractedText }],
      claimTexts,
      source: sourceIdentity,
      listedSources,
      pageLimitReached: fetched.pdfPageLimitReached,
    })
    const pdfDiagnostic: SourceAcquisitionDiagnostic = {
      ...diagnostic,
      pagesParsed: diagnostic.pagesParsed,
      pagesScanned: scanned.pagesScanned,
      textLimitReached: scanned.textLimitReached,
    }
    if (scanned.passages.length === 0) {
      return {
        evidence: [],
        diagnostic: {
          ...pdfDiagnostic,
          category: scanned.categoryIfEmpty,
          acceptedPassageCount: 0,
          rejectionReason: rejectionReasonFor(scanned.categoryIfEmpty),
        },
      }
    }
    return {
      evidence: evidenceFromChunks(source, fetched.title, scanned.passages),
      diagnostic: {
        ...pdfDiagnostic,
        category: "accepted",
        acceptedPassageCount: scanned.passages.length,
        rejectionReason: "",
      },
    }
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
  const supporting: typeof chunks = []
  if (claimTexts.length > 0) {
    for (const chunk of chunks) {
      if (!isUsefulHtmlEvidence(chunk.text, claimTexts, sourceIdentity, listedSources)) continue
      supporting.push(chunk)
      if (supporting.length >= 3) break
    }
  }

  const rankedChunks = (
    supporting.length > 0
      ? supporting
      : chunkRanker(
          [topic, ...claimTexts].filter(Boolean).join(" "),
          chunks,
        ).filter((chunk) =>
          isUsefulHtmlEvidence(chunk.text, claimTexts, sourceIdentity, listedSources),
        )
  ).slice(0, 3)

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

  return {
    evidence: evidenceFromChunks(source, fetched.title, rankedChunks),
    diagnostic: {
      ...diagnostic,
      category: "accepted",
      acceptedPassageCount: rankedChunks.length,
      rejectionReason: "",
    },
  }
}

export async function evidenceRegistry(
  topic: string,
  sources: SourceRecord[],
  options: EvidenceRegistryOptions = {},
): Promise<EvidenceRegistryResult> {
  const listedSources =
    options.listedSources ??
    sources.map((source) => ({ url: source.url, title: source.title }))
  const collected = await Promise.all(
    sources.map((source) =>
      collectFromSource(topic, source, { ...options, listedSources }),
    ),
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
  const unavailableSourceCount = sourceDiagnostics.filter((diagnostic) =>
    isUnavailableAcquisitionCategory(diagnostic.category),
  ).length
  const noRelevantPassageCount = sourceDiagnostics.filter(
    (diagnostic) =>
      diagnostic.category === "no_relevant_passage" ||
      diagnostic.category === "chrome_only",
  ).length
  const availableSourceCount = Math.max(0, sources.length - unavailableSourceCount)

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
    availableSourceCount,
    unavailableSourceCount,
    noRelevantPassageCount,
    registryStatus:
      evidenceRecords.length > 0
        ? "Evidence registry created from filtered and ranked evidence chunks."
        : "No useful evidence available after filtering.",
  }
}
