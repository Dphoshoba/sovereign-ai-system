import {
  passageSupportsClaim,
  significantTokens,
} from "./article-claim-extractor";
import {
  canonicalSourceUrl,
  claimAllowsEvidence,
  isBibleProjectClaim,
  isBibleProjectSource,
  isPrimaryScriptureClaim,
  resolveClaimSourceBinding,
  type AttributableSource,
} from "./claim-source-attribution";
import type { EvidenceChunk } from "./evidence-chunker";
import type { EvidenceRecord } from "./evidence-registry";
import {
  locateVerseWindows,
  parseScriptureVerseRanges,
  passageOverlapsVerseWindow,
} from "./scripture-verse-locator";
import {
  RESEARCH_MAX_CHUNKS_PER_DOCUMENT,
  RESEARCH_MAX_PASSAGES_PER_CLAIM,
  RESEARCH_MAX_UNIQUE_AUDIT_PASSAGES,
} from "./source-fetch-guard";

export type SelectableDocument = {
  url: string;
  title: string;
  fetchedTitle?: string;
  sourceType: string;
  relevanceScore?: number;
  extractedText: string;
  chunks: EvidenceChunk[];
};

export type ClaimEvidenceMapping = {
  claim: string;
  evidenceIds: string[];
};

export type ClaimAwareSelection = {
  evidence: EvidenceRecord[];
  mappings: ClaimEvidenceMapping[];
  uniquePassageCount: number;
  bounded: boolean;
};

type RankedCandidate = {
  evidence: EvidenceRecord;
  overlap: number;
  verseBoost: number;
  documentOrder: number;
};

function sourceTypeBoost(sourceType: string): number {
  switch (sourceType) {
    case "government":
      return 15;
    case "academic":
      return 15;
    case "industry-research":
      return 12;
    case "research-media":
      return 10;
    case "policy":
      return 10;
    case "authority":
      return 8;
    default:
      return 0;
  }
}

function evidenceId(title: string, chunkId: string): string {
  return `${title.toLowerCase().replace(/\s+/g, "-")}-${chunkId}`;
}

function passageKey(url: string, text: string): string {
  return `${canonicalSourceUrl(url)}::${text.replace(/\s+/g, " ").trim().toLowerCase()}`;
}

function isBibleProjectUrl(url: string, title?: string | null): boolean {
  return isBibleProjectSource({ url, title });
}

function recordsFromDocument(document: SelectableDocument): EvidenceRecord[] {
  const chunks = document.chunks.slice(0, RESEARCH_MAX_CHUNKS_PER_DOCUMENT);
  return chunks.map((chunk) => ({
    id: evidenceId(document.title, chunk.id),
    sourceTitle: document.fetchedTitle || document.title,
    sourceUrl: document.url,
    sourceType: document.sourceType,
    extractedText: chunk.text,
    confidence: Math.min(
      100,
      (document.relevanceScore ?? 70) + sourceTypeBoost(document.sourceType),
    ),
    requiresHumanReview: true,
  }));
}

function verseWindowRecords(
  claim: string,
  document: SelectableDocument,
): EvidenceRecord[] {
  if (!isPrimaryScriptureClaim(claim)) return [];
  const ranges = parseScriptureVerseRanges(claim);
  if (ranges.length === 0) return [];
  return ranges.flatMap((range) =>
    locateVerseWindows(document.extractedText, [range]).map((text) => ({
    id: evidenceId(document.title, `verse-${range.start}-${range.end}`),
    sourceTitle: document.fetchedTitle || document.title,
    sourceUrl: document.url,
    sourceType: document.sourceType,
    extractedText: text,
    confidence: Math.min(
      100,
      (document.relevanceScore ?? 70) + sourceTypeBoost(document.sourceType),
    ),
    requiresHumanReview: true,
  })),
  );
}

function overlapScore(claim: string, passage: string): number {
  const claimTokens = significantTokens(claim);
  if (claimTokens.length === 0) return 0;
  const passageTokens = new Set(significantTokens(passage));
  return claimTokens.filter((token) => passageTokens.has(token)).length;
}

function compareCandidates(left: RankedCandidate, right: RankedCandidate): number {
  return (
    right.overlap + right.verseBoost - (left.overlap + left.verseBoost) ||
    right.overlap - left.overlap ||
    left.documentOrder - right.documentOrder ||
    left.evidence.id.localeCompare(right.evidence.id)
  );
}

function disambiguatePublisherMatches(
  claim: string,
  listedSources: AttributableSource[],
  matches: RankedCandidate[],
): RankedCandidate[] {
  const binding = resolveClaimSourceBinding(claim, listedSources);
  if (binding.role !== "publisher" || !isBibleProjectClaim(claim)) {
    return matches;
  }
  const documentUrls = new Set<string>();
  for (const match of matches) {
    if (!isBibleProjectUrl(match.evidence.sourceUrl, match.evidence.sourceTitle)) {
      continue;
    }
    documentUrls.add(canonicalSourceUrl(match.evidence.sourceUrl));
  }
  if (documentUrls.size > 1) return [];
  return matches;
}

export function selectClaimAwareEvidence(input: {
  claims: string[];
  documents: SelectableDocument[];
  listedSources: AttributableSource[];
}): ClaimAwareSelection {
  const listedSources = input.listedSources;
  const documents = input.documents.map((document) => ({
    ...document,
    chunks: document.chunks.slice(0, RESEARCH_MAX_CHUNKS_PER_DOCUMENT),
  }));

  const mappings: Array<{ claim: string; candidates: RankedCandidate[] }> = [];

  for (const claim of input.claims) {
    const windowsByUrl = new Map<string, string[]>();
    const candidates: RankedCandidate[] = [];
    let documentOrder = 0;

    for (const document of documents) {
      const source = {
        url: document.url,
        title: document.title,
      };
      if (!claimAllowsEvidence(claim, source, listedSources)) continue;

      const records = [
        ...recordsFromDocument(document),
        ...verseWindowRecords(claim, document),
      ];
      const ranges = isPrimaryScriptureClaim(claim)
        ? parseScriptureVerseRanges(claim)
        : [];
      const windows =
        ranges.length > 0
          ? locateVerseWindows(document.extractedText, ranges)
          : [];
      windowsByUrl.set(canonicalSourceUrl(document.url), windows);

      const documentKind = /\.pdf(?:$|[?#])/i.test(document.url) ? "pdf" : "html";
      for (const record of records) {
        if (
          !passageSupportsClaim(claim, record.extractedText, { documentKind })
        ) {
          documentOrder += 1;
          continue;
        }
        const windowsForSource =
          windowsByUrl.get(canonicalSourceUrl(record.sourceUrl)) ?? [];
        candidates.push({
          evidence: record,
          overlap: overlapScore(claim, record.extractedText),
          verseBoost: passageOverlapsVerseWindow(
            record.extractedText,
            windowsForSource,
          )
            ? 8
            : 0,
          documentOrder,
        });
        documentOrder += 1;
      }
    }

    const allowed = disambiguatePublisherMatches(
      claim,
      listedSources,
      candidates,
    )
      .sort(compareCandidates)
      .slice(0, RESEARCH_MAX_PASSAGES_PER_CLAIM);

    mappings.push({ claim, candidates: allowed });
  }

  const selectedByKey = new Map<
    string,
    { evidence: EvidenceRecord; score: number }
  >();
  const claimKeys = new Map<string, string[]>();

  for (const mapping of mappings) {
    const keys: string[] = [];
    for (const candidate of mapping.candidates) {
      const key = passageKey(
        candidate.evidence.sourceUrl,
        candidate.evidence.extractedText,
      );
      const score = candidate.overlap + candidate.verseBoost;
      const existing = selectedByKey.get(key);
      if (!existing || score > existing.score) {
        selectedByKey.set(key, { evidence: candidate.evidence, score });
      } else if (existing && candidate.evidence.id < existing.evidence.id) {
        selectedByKey.set(key, {
          evidence: { ...existing.evidence, id: existing.evidence.id },
          score: existing.score,
        });
      }
      keys.push(key);
    }
    claimKeys.set(mapping.claim, keys);
  }

  const rankedUnique = Array.from(selectedByKey.entries()).sort((left, right) => {
    return (
      right[1].score - left[1].score ||
      left[1].evidence.sourceUrl.localeCompare(right[1].evidence.sourceUrl) ||
      left[1].evidence.id.localeCompare(right[1].evidence.id)
    );
  });
  const bounded = rankedUnique.length > RESEARCH_MAX_UNIQUE_AUDIT_PASSAGES;
  const kept = rankedUnique.slice(0, RESEARCH_MAX_UNIQUE_AUDIT_PASSAGES);
  const keptKeys = new Set(kept.map(([key]) => key));
  const evidence = kept.map(([, value]) => value.evidence);
  const evidenceByKey = new Map(
    kept.map(([key, value]) => [key, value.evidence] as const),
  );

  const resultMappings: ClaimEvidenceMapping[] = input.claims.map((claim) => {
    const ids: string[] = [];
    const seenIds = new Set<string>();
    for (const key of claimKeys.get(claim) ?? []) {
      if (!keptKeys.has(key)) continue;
      const record = evidenceByKey.get(key);
      if (!record || seenIds.has(record.id)) continue;
      seenIds.add(record.id);
      ids.push(record.id);
    }
    return { claim, evidenceIds: ids };
  });

  return {
    evidence,
    mappings: resultMappings,
    uniquePassageCount: evidence.length,
    bounded,
  };
}
