import {
  boundContinuationExcerpt,
  distinctiveSupportScore,
  passageSupportsClaim,
  passageSupportsContinuationSentence,
  planClaimBatches,
  verifiableClauses,
  uniqueContentOverlap,
  type ClaimBatch,
  type ClaimBatchPlan,
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
import { evidenceSatisfiesProductIdentity } from "./product-identity";
import type { EvidenceRecord } from "./evidence-registry";
import {
  locateVerseWindows,
  parseScriptureVerseRanges,
  passageOverlapsVerseWindow,
} from "./scripture-verse-locator";
import type { ScriptureRef } from "./scripture-ref";
import {
  sourceMatchesScriptureRef,
} from "./scripture-ref";
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
  distinctive: number;
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
  return uniqueContentOverlap(claim, passage).overlap.length;
}

function compareCandidates(left: RankedCandidate, right: RankedCandidate): number {
  return (
    right.overlap +
      right.distinctive +
      right.verseBoost -
      (left.overlap + left.distinctive + left.verseBoost) ||
    right.distinctive - left.distinctive ||
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
      const continuationExcerpt = boundContinuationExcerpt(claim);
      const singleContinuation =
        continuationExcerpt !== null && verifiableClauses(claim).length === 1;
      for (const record of records) {
        const overlapSupported = passageSupportsClaim(
          singleContinuation ? continuationExcerpt : claim,
          record.extractedText,
          { documentKind },
        );
        if (
          !overlapSupported ||
          !evidenceSatisfiesProductIdentity(
            claim,
            record.sourceTitle,
            record.extractedText,
          ) ||
          (continuationExcerpt !== null &&
            !passageSupportsContinuationSentence(
              continuationExcerpt,
              record.extractedText,
              { documentKind },
            ))
        ) {
          documentOrder += 1;
          continue;
        }
        const windowsForSource =
          windowsByUrl.get(canonicalSourceUrl(record.sourceUrl)) ?? [];
        candidates.push({
          evidence: record,
          overlap: overlapScore(claim, record.extractedText),
          distinctive: distinctiveSupportScore(claim, record.extractedText),
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
      const score =
        candidate.overlap + candidate.distinctive + candidate.verseBoost;
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

export type BatchEvidenceRun = {
  index: number;
  claimCount: number;
  uniquePassageCount: number;
  bounded: boolean;
};

export type BatchClaimEvidenceSelection = {
  evidence: EvidenceRecord[];
  mappings: ClaimEvidenceMapping[];
  unsupportedClaims: string[];
  overflowClaims: string[];
  uniquePassageCount: number;
  batches: BatchEvidenceRun[];
};

export type BatchEvidenceSelectionRun = {
  batch: ClaimBatch<string>;
  selection: ClaimAwareSelection;
};

export function assembleBatchEvidenceSelections(
  plan: ClaimBatchPlan<string>,
  runs: readonly BatchEvidenceSelectionRun[],
): BatchClaimEvidenceSelection {
  const evidenceByKey = new Map<string, EvidenceRecord>();
  const keyOrder: string[] = [];
  const recordById = new Map<string, EvidenceRecord>();

  for (const run of runs) {
    for (const record of run.selection.evidence) {
      recordById.set(record.id, record);
      const key = passageKey(record.sourceUrl, record.extractedText);
      const existing = evidenceByKey.get(key);
      if (!existing) {
        evidenceByKey.set(key, record);
        keyOrder.push(key);
        continue;
      }
      if (record.id < existing.id) {
        evidenceByKey.set(key, { ...existing, id: record.id });
      }
    }
  }

  const mappings: ClaimEvidenceMapping[] = [];
  for (const run of runs) {
    for (const mapping of run.selection.mappings) {
      const evidenceIds: string[] = [];
      const seen = new Set<string>();
      for (const id of mapping.evidenceIds) {
        const record = recordById.get(id);
        const canonical = record
          ? evidenceByKey.get(passageKey(record.sourceUrl, record.extractedText))
          : undefined;
        if (!canonical || seen.has(canonical.id)) continue;
        seen.add(canonical.id);
        evidenceIds.push(canonical.id);
      }
      mappings.push({ claim: mapping.claim, evidenceIds });
    }
  }

  const evidence: EvidenceRecord[] = [];
  for (const key of keyOrder) {
    const record = evidenceByKey.get(key);
    if (record) evidence.push(record);
  }

  return {
    evidence,
    mappings,
    unsupportedClaims: mappings
      .filter((mapping) => mapping.evidenceIds.length === 0)
      .map((mapping) => mapping.claim),
    overflowClaims: [...plan.overflowClaims],
    uniquePassageCount: keyOrder.length,
    batches: runs.map((run) => ({
      index: run.batch.index,
      claimCount: run.batch.claims.length,
      uniquePassageCount: run.selection.uniquePassageCount,
      bounded: run.selection.bounded,
    })),
  };
}

export function selectClaimEvidenceInBatches(input: {
  claims: readonly string[];
  documents: SelectableDocument[];
  listedSources: AttributableSource[];
}): BatchClaimEvidenceSelection {
  const plan = planClaimBatches(input.claims);
  const runs: BatchEvidenceSelectionRun[] = [];
  for (const batch of plan.batches) {
    runs.push({
      batch,
      selection: selectClaimAwareEvidence({
        claims: batch.claims,
        documents: input.documents,
        listedSources: input.listedSources,
      }),
    });
  }
  return assembleBatchEvidenceSelections(plan, runs);
}

/**
 * Non-claim generate path: round-robin passages across documents so early
 * verbose sources cannot consume RESEARCH_MAX_UNIQUE_AUDIT_PASSAGES before
 * later required chapters contribute evidence.
 * Called by evidenceRegistry() when claimTexts is empty and no teaching
 * relevance patterns are supplied.
 */
export function selectSourceBalancedEvidence(
  documents: SelectableDocument[],
  maxPassages: number = RESEARCH_MAX_UNIQUE_AUDIT_PASSAGES,
): ClaimAwareSelection {
  const perDocument = documents.map((document) => recordsFromDocument(document));
  const selected: EvidenceRecord[] = [];
  const seenKeys = new Set<string>();
  let round = 0;
  let progressed = true;
  const totalAvailable = perDocument.reduce(
    (sum, records) => sum + records.length,
    0,
  );

  while (selected.length < maxPassages && progressed) {
    progressed = false;
    for (const records of perDocument) {
      if (selected.length >= maxPassages) break;
      const record = records[round];
      if (!record) continue;
      const key = passageKey(record.sourceUrl, record.extractedText);
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      selected.push(record);
      progressed = true;
    }
    round += 1;
  }

  return {
    evidence: selected,
    mappings: [],
    uniquePassageCount: selected.length,
    bounded: totalAvailable > selected.length,
  };
}

/**
 * Mission 006R4: prefer passages that match required teaching movements /
 * verse markers before filling remaining slots with balanced round-robin.
 * Prevents early-chapter plague chunks from starving Exodus 8:25–28 / 10:24–26.
 */
export function selectTeachingBalancedEvidence(
  documents: SelectableDocument[],
  relevancePatterns: readonly RegExp[],
  maxPassages: number = RESEARCH_MAX_UNIQUE_AUDIT_PASSAGES,
  requiredRefs: readonly ScriptureRef[] = [],
): ClaimAwareSelection {
  if (!relevancePatterns.length && requiredRefs.length === 0) {
    return selectSourceBalancedEvidence(documents, maxPassages);
  }

  const perDocument = documents.map((document) => recordsFromDocument(document));
  const selected: EvidenceRecord[] = [];
  const seenKeys = new Set<string>();
  const totalAvailable = perDocument.reduce(
    (sum, records) => sum + records.length,
    0,
  );

  const tryPush = (record: EvidenceRecord | undefined): boolean => {
    if (!record || selected.length >= maxPassages) return false;
    const key = passageKey(record.sourceUrl, record.extractedText);
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    selected.push(record);
    return true;
  };

  const isRelevant = (record: EvidenceRecord): boolean =>
    relevancePatterns.some((pattern) => pattern.test(record.extractedText));

  // Pass -1: exact verse windows for cited ranges (Exodus 10:8-11 / 10:24-26).
  for (const ref of requiredRefs) {
    if (selected.length >= maxPassages) break;
    if (ref.verseStart == null) continue;
    for (const document of documents) {
      if (selected.length >= maxPassages) break;
      if (!sourceMatchesScriptureRef(document.url, document.title, ref)) {
        continue;
      }
      const windows = locateVerseWindows(document.extractedText, [
        {
          start: ref.verseStart,
          end: ref.verseEnd ?? ref.verseStart,
          chapter: ref.chapter,
          book: ref.book,
        },
      ]);
      for (const text of windows) {
        tryPush({
          id: evidenceId(
            document.title,
            `teach-verse-${ref.chapter}-${ref.verseStart}-${ref.verseEnd ?? ref.verseStart}`,
          ),
          sourceTitle: document.fetchedTitle || document.title,
          sourceUrl: document.url,
          sourceType: document.sourceType,
          extractedText: text,
          confidence: Math.min(
            100,
            (document.relevanceScore ?? 70) +
              sourceTypeBoost(document.sourceType) +
              5,
          ),
          requiresHumanReview: true,
        });
      }
    }
  }

  // Pass 0: one passage per document so supporting NT chapters are not
  // starved by multi-hit Exodus movement selection. Prefer a relevant chunk.
  for (const records of perDocument) {
    if (selected.length >= maxPassages) break;
    const preferred = records.find((record) => isRelevant(record)) ?? records[0];
    tryPush(preferred);
  }

  // Pass 1: one relevant hit per pattern (movement / verse), scanning all docs.
  for (const pattern of relevancePatterns) {
    if (selected.length >= maxPassages) break;
    outer: for (const records of perDocument) {
      for (const record of records) {
        if (pattern.test(record.extractedText) && tryPush(record)) {
          break outer;
        }
      }
    }
  }

  // Pass 2: within each document, prefer remaining relevant chunks before
  // falling through to document order (covers multi-hit chapters).
  for (const records of perDocument) {
    if (selected.length >= maxPassages) break;
    for (const record of records.filter((item) => isRelevant(item))) {
      if (!tryPush(record)) break;
    }
  }

  // Pass 3: balanced fill for remaining capacity / corroboration.
  let round = 0;
  let progressed = true;
  while (selected.length < maxPassages && progressed) {
    progressed = false;
    for (const records of perDocument) {
      if (selected.length >= maxPassages) break;
      if (tryPush(records[round])) progressed = true;
    }
    round += 1;
  }

  return {
    evidence: selected,
    mappings: [],
    uniquePassageCount: selected.length,
    bounded: totalAvailable > selected.length,
  };
}
