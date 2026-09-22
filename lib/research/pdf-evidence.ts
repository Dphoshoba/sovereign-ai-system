import type { EvidenceChunk } from "./evidence-chunker";
import { evidenceChunker } from "./evidence-chunker";
import { passageSupportsClaim, significantTokens } from "./article-claim-extractor";
import {
  claimAllowsEvidence,
  type AttributableSource,
} from "./claim-source-attribution";
import { isPdfChromeOnly, type PdfPageText } from "./pdf-text-extractor";
import {
  RESEARCH_MAX_CHUNKS_PER_DOCUMENT,
  RESEARCH_PDF_MAX_SCAN_CHARS,
  RESEARCH_PDF_MAX_SCAN_PAGES,
} from "./source-fetch-guard";
import type { SourceAcquisitionCategory } from "./source-acquisition";

export type PdfPassageCandidate = EvidenceChunk & {
  pageNumber: number;
  overlap: number;
};

export type PdfEvidenceScan = {
  passages: PdfPassageCandidate[];
  pagesScanned: number;
  textLimitReached: boolean;
  pageLimitReached: boolean;
  categoryIfEmpty: SourceAcquisitionCategory;
};

function pdfPassageOverlap(claim: string, passage: string): number {
  const claimTokens = significantTokens(claim);
  if (claimTokens.length === 0) return 0;
  const passageTokens = new Set(significantTokens(passage));
  return claimTokens.filter((token) => passageTokens.has(token)).length;
}

export function pdfPassageSupportsClaim(claim: string, passage: string): boolean {
  if (!passage || isPdfChromeOnly(passage)) return false;
  return passageSupportsClaim(claim, passage, { documentKind: "pdf" });
}

export function collectPdfPassages(input: {
  pages: PdfPageText[];
  claimTexts: string[];
  source: { url: string; title?: string | null };
  listedSources?: AttributableSource[];
  pageLimitReached?: boolean;
}): PdfEvidenceScan {
  const candidates: PdfPassageCandidate[] = [];
  let scannedChars = 0;
  let pagesScanned = 0;
  let textLimitReached = false;
  let pageLimitReached = Boolean(input.pageLimitReached);
  let sawSubstantive = false;

  for (const page of input.pages) {
    if (pagesScanned >= RESEARCH_PDF_MAX_SCAN_PAGES) {
      pageLimitReached = true;
      break;
    }
    if (scannedChars >= RESEARCH_PDF_MAX_SCAN_CHARS) {
      textLimitReached = true;
      break;
    }
    const remaining = RESEARCH_PDF_MAX_SCAN_CHARS - scannedChars;
    const pageText =
      page.text.length > remaining ? page.text.slice(0, remaining) : page.text;
    if (page.text.length > remaining) textLimitReached = true;

    pagesScanned += 1;
    scannedChars += pageText.length;
    if (!isPdfChromeOnly(pageText)) sawSubstantive = true;

    const chunks = evidenceChunker(pageText, 120);
    for (const chunk of chunks) {
      if (isPdfChromeOnly(chunk.text)) continue;
      sawSubstantive = true;
      if (chunk.text.trim().length < 80) continue;
      const matchingClaims = input.claimTexts.filter((claim) => {
        if (
          !claimAllowsEvidence(
            claim,
            {
              url: input.source.url,
              title: input.source.title,
            },
            input.listedSources ?? [],
          )
        ) {
          return false;
        }
        return pdfPassageSupportsClaim(claim, chunk.text);
      });
      if (matchingClaims.length === 0) continue;
      const overlap = Math.max(
        ...matchingClaims.map((claim) => pdfPassageOverlap(claim, chunk.text)),
      );
      candidates.push({
        ...chunk,
        pageNumber: page.pageNumber,
        overlap,
      });
    }
  }

  const passages = candidates
    .sort(
      (left, right) =>
        left.pageNumber - right.pageNumber || left.id.localeCompare(right.id),
    )
    .slice(0, RESEARCH_MAX_CHUNKS_PER_DOCUMENT)
    .map((passage, index) => ({
      ...passage,
      id: `page-${passage.pageNumber}-chunk-${index + 1}`,
    }));

  let categoryIfEmpty: SourceAcquisitionCategory = "no_relevant_passage";
  if (passages.length === 0) {
    if (pageLimitReached) categoryIfEmpty = "pdf_page_limit";
    else if (textLimitReached) categoryIfEmpty = "pdf_text_limit";
    else if (!sawSubstantive) categoryIfEmpty = "chrome_only";
  }

  return {
    passages,
    pagesScanned,
    textLimitReached,
    pageLimitReached,
    categoryIfEmpty,
  };
}
