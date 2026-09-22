import type { SourceRecord } from "./source-collector"
import { contentFetcher, type ContentFetchDeps } from "./content-fetcher"
import { evidenceChunker } from "./evidence-chunker"
import { isChromePassage } from "./evidence-chrome"
import {
  type AttributableSource,
} from "./claim-source-attribution"
import {
  selectClaimAwareEvidence,
  type SelectableDocument,
} from "./claim-evidence-selector"
import { collectPdfPassages } from "./pdf-evidence"
import {
  RESEARCH_MAX_CHUNKS_PER_DOCUMENT,
  RESEARCH_MAX_UNIQUE_AUDIT_PASSAGES,
} from "./source-fetch-guard"
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
  factualClaimCount?: number
  mappedClaimCount?: number
  claimEvidenceCoverage?: number
}

export type EvidenceRegistryOptions = ContentFetchDeps & {
  fetchContent?: typeof contentFetcher
  claimTexts?: string[]
  listedSources?: AttributableSource[]
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

type CollectedDocument = {
  document: SelectableDocument | null
  diagnostic: SourceAcquisitionDiagnostic
}

function htmlDocumentChunks(extractedText: string) {
  return evidenceChunker(extractedText, 120)
    .slice(0, RESEARCH_MAX_CHUNKS_PER_DOCUMENT)
    .filter(
      (chunk) => chunk.text.trim().length >= 80 && !isChromePassage(chunk.text),
    )
}

async function collectFromSource(
  source: SourceRecord,
  options: EvidenceRegistryOptions,
): Promise<CollectedDocument> {
  const fetchContent = options.fetchContent ?? contentFetcher
  const claimTexts = options.claimTexts ?? []
  const listedSources = options.listedSources ?? []
  const fetched = await fetchContent(source.url, source.title, options)
  const diagnostic: SourceAcquisitionDiagnostic = {
    ...fetched.diagnostic,
    sourceId: fetched.diagnostic.sourceId || sourceIdFromTitle(source.title, source.url),
  }
  const sourceIdentity = { url: source.url, title: source.title }

  if (fetched.fetchStatus !== "success" || !fetched.extractedText) {
    return { document: null, diagnostic }
  }

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
        document: null,
        diagnostic: {
          ...pdfDiagnostic,
          category: scanned.categoryIfEmpty,
          acceptedPassageCount: 0,
          rejectionReason: rejectionReasonFor(scanned.categoryIfEmpty),
        },
      }
    }
    return {
      document: {
        url: source.url,
        title: source.title,
        fetchedTitle: fetched.title,
        sourceType: source.sourceType,
        relevanceScore: source.relevanceScore,
        extractedText: fetched.extractedText,
        chunks: scanned.passages,
      },
      diagnostic: pdfDiagnostic,
    }
  }

  if (isChromePassage(fetched.extractedText)) {
    return {
      document: null,
      diagnostic: {
        ...diagnostic,
        category: "chrome_only",
        acceptedPassageCount: 0,
        rejectionReason: rejectionReasonFor("chrome_only"),
      },
    }
  }

  const chunks = htmlDocumentChunks(fetched.extractedText)
  if (chunks.length === 0 && fetched.extractedText.trim().length < 80) {
    return {
      document: null,
      diagnostic: {
        ...diagnostic,
        category: "no_relevant_passage",
        acceptedPassageCount: 0,
        rejectionReason: rejectionReasonFor("no_relevant_passage"),
      },
    }
  }

  return {
    document: {
      url: source.url,
      title: source.title,
      fetchedTitle: fetched.title,
      sourceType: source.sourceType,
      relevanceScore: source.relevanceScore,
      extractedText: fetched.extractedText,
      chunks,
    },
    diagnostic,
  }
}

function applySelectedPassages(
  collected: CollectedDocument[],
  selected: EvidenceRecord[],
): SourceAcquisitionDiagnostic[] {
  return collected.map((item) => {
    if (!item.document) return item.diagnostic
    const acceptedPassageCount = selected.filter(
      (record) => record.sourceUrl === item.document?.url,
    ).length
    if (acceptedPassageCount === 0) {
      return {
        ...item.diagnostic,
        category: "no_relevant_passage",
        acceptedPassageCount: 0,
        rejectionReason: rejectionReasonFor("no_relevant_passage"),
      }
    }
    return {
      ...item.diagnostic,
      category: "accepted",
      acceptedPassageCount,
      rejectionReason: "",
    }
  })
}

export async function evidenceRegistry(
  topic: string,
  sources: SourceRecord[],
  options: EvidenceRegistryOptions = {},
): Promise<EvidenceRegistryResult> {
  const listedSources =
    options.listedSources ??
    sources.map((source) => ({ url: source.url, title: source.title }))
  const claimTexts = options.claimTexts ?? []
  const collected = await Promise.all(
    sources.map((source) =>
      collectFromSource(source, { ...options, listedSources }),
    ),
  )

  const documents = collected
    .map((item) => item.document)
    .filter((document): document is SelectableDocument => Boolean(document))

  const selection =
    claimTexts.length > 0
      ? selectClaimAwareEvidence({
          claims: claimTexts,
          documents,
          listedSources,
        })
      : {
          evidence: documents.flatMap((document) =>
            evidenceFromChunks(
              {
                title: document.title,
                url: document.url,
                sourceType: document.sourceType,
                relevanceScore: document.relevanceScore,
              } as SourceRecord,
              document.fetchedTitle || document.title,
              document.chunks,
            ),
          ).slice(0, RESEARCH_MAX_UNIQUE_AUDIT_PASSAGES),
          mappings: [],
          uniquePassageCount: 0,
          bounded: false,
        }

  const evidenceRecords = selection.evidence
  const sourceDiagnostics = applySelectedPassages(collected, evidenceRecords)

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
  const mappedClaimCount = selection.mappings.filter(
    (mapping) => mapping.evidenceIds.length > 0,
  ).length
  const factualClaimCount = claimTexts.length

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
    factualClaimCount,
    mappedClaimCount,
    claimEvidenceCoverage:
      factualClaimCount <= 0
        ? 0
        : Math.round(Math.min(1, mappedClaimCount / factualClaimCount) * 100),
    registryStatus:
      evidenceRecords.length > 0
        ? "Evidence registry created from filtered and ranked evidence chunks."
        : "No useful evidence available after filtering.",
  }
}
