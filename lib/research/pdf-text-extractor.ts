import { extractText } from "unpdf";
import { ResearchSourceFetchError } from "./source-acquisition";
import {
  RESEARCH_PDF_HARD_PAGE_LIMIT,
  RESEARCH_PDF_MAX_PAGE_CHARS,
  RESEARCH_PDF_MAX_SCAN_PAGES,
} from "./source-fetch-guard";

export class PdfExtractionError extends ResearchSourceFetchError {
  constructor(
    category:
      | "encrypted_pdf"
      | "malformed_pdf"
      | "pdf_extraction_empty"
      | "pdf_page_limit",
    message: string,
  ) {
    super(category, message);
    this.name = "PdfExtractionError";
  }
}

export type PdfPageText = {
  pageNumber: number;
  text: string;
};

export type PdfExtractionResult = {
  pages: PdfPageText[];
  totalPages: number;
  pagesParsed: number;
  pageLimitReached: boolean;
  extractedCharacterCount: number;
};

function latin1Head(bytes: Uint8Array, max = 32_768): string {
  return Buffer.from(bytes.subarray(0, Math.min(bytes.byteLength, max))).toString(
    "latin1",
  );
}

export function isEncryptedPdf(bytes: Uint8Array): boolean {
  return /\/Encrypt(?:[\s\/>])/.test(latin1Head(bytes));
}

export function looksLikePdf(bytes: Uint8Array, contentType = "", url = ""): boolean {
  if (bytes.byteLength >= 5) {
    const header = Buffer.from(bytes.subarray(0, 5)).toString("latin1");
    if (header === "%PDF-") return true;
  }

  const type = contentType.toLowerCase();
  if (type.includes("text/html") || type.includes("application/xhtml")) {
    return false;
  }
  if (type.includes("application/pdf")) return true;

  try {
    return new URL(url).pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return false;
  }
}

export function dehyphenatePdfLineBreaks(text: string): string {
  return text.replace(/(\p{L}{2,})-\r?\n(\p{Ll}\p{L}*)/gu, "$1$2");
}

export function normalizePdfPageText(text: string): string {
  const normalized = dehyphenatePdfLineBreaks(String(text || "").normalize("NFC"))
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (normalized.length <= RESEARCH_PDF_MAX_PAGE_CHARS) return normalized;
  return normalized.slice(0, RESEARCH_PDF_MAX_PAGE_CHARS);
}

function repeatedPdfChromeLines(pages: string[]): Set<string> {
  if (pages.length < 3) return new Set();
  const counts = new Map<string, number>();
  for (const page of pages) {
    const unique = new Set(
      page
        .split("\n")
        .map((line) => line.trim().toLowerCase())
        .filter((line) => line.length > 0 && line.length <= 80),
    );
    for (const line of unique) {
      counts.set(line, (counts.get(line) ?? 0) + 1);
    }
  }
  const threshold = Math.max(3, Math.ceil(pages.length * 0.5));
  const repeated = new Set<string>();
  for (const [line, count] of counts) {
    if (count >= threshold) repeated.add(line);
  }
  return repeated;
}

const PAGE_NUMBER_LINE = /^(?:page\s+)?\d+(?:\s*(?:\/|of)\s*\d+)?$/i;

export function stripRepeatedPdfChrome(pages: string[]): string[] {
  const repeated = repeatedPdfChromeLines(pages);
  return pages.map((page) =>
    page
      .split("\n")
      .filter((line) => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        if (PAGE_NUMBER_LINE.test(trimmed)) return false;
        if (repeated.has(trimmed.toLowerCase())) return false;
        return true;
      })
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}

export function isPdfChromeOnly(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return true;
  const withoutPageNumbers = normalized
    .replace(/\bpage\s+\d+(?:\s*(?:\/|of)\s*\d+)?\b/gi, " ")
    .replace(/\b\d+\s+of\s+\d+\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (withoutPageNumbers.length < 80) return true;
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return true;
  const substantive = lines.filter(
    (line) =>
      line.length >= 40 &&
      !PAGE_NUMBER_LINE.test(line) &&
      !/^table of contents$/i.test(line),
  );
  return substantive.length === 0;
}

function assertReadablePdf(bytes: Uint8Array): void {
  if (bytes.byteLength < 5) {
    throw new PdfExtractionError("malformed_pdf", "PDF is malformed or unsupported.");
  }
  const header = Buffer.from(bytes.subarray(0, 5)).toString("latin1");
  if (header !== "%PDF-") {
    throw new PdfExtractionError("malformed_pdf", "PDF is malformed or unsupported.");
  }
  if (isEncryptedPdf(bytes)) {
    throw new PdfExtractionError("encrypted_pdf", "Encrypted PDFs are not opened.");
  }
}

export async function extractPdfDocument(
  bytes: Uint8Array,
): Promise<PdfExtractionResult> {
  assertReadablePdf(bytes);

  try {
    const extracted = await extractText(new Uint8Array(bytes), { mergePages: false });
    const rawPages = Array.isArray(extracted.text)
      ? extracted.text.map((page) => String(page || ""))
      : [String(extracted.text || "")];
    const reportedPages = (extracted as { totalPages?: number }).totalPages;
    const totalPages =
      typeof reportedPages === "number" && reportedPages > 0
        ? reportedPages
        : rawPages.length;
    if (totalPages > RESEARCH_PDF_HARD_PAGE_LIMIT) {
      throw new PdfExtractionError(
        "pdf_page_limit",
        "PDF page count exceeded the bounded scan limit before relevant passages were found.",
      );
    }

    const normalized = rawPages.map((page) => normalizePdfPageText(page));
    const cleaned = stripRepeatedPdfChrome(normalized);
    const pagesForScan = cleaned.some((page) => page.trim()) ? cleaned : normalized;
    const pageLimitReached = totalPages > RESEARCH_PDF_MAX_SCAN_PAGES;
    const pages = pagesForScan
      .slice(0, RESEARCH_PDF_MAX_SCAN_PAGES)
      .flatMap((text, index) =>
        text
          ? [
              {
                pageNumber: index + 1,
                text,
              },
            ]
          : [],
      );
    const extractedCharacterCount = pages.reduce(
      (sum, page) => sum + page.text.length,
      0,
    );
    if (extractedCharacterCount === 0) {
      throw new PdfExtractionError(
        "pdf_extraction_empty",
        "PDF was fetched but yielded no extractable text.",
      );
    }

    return {
      pages,
      totalPages,
      pagesParsed: Math.min(cleaned.length, RESEARCH_PDF_MAX_SCAN_PAGES),
      pageLimitReached,
      extractedCharacterCount,
    };
  } catch (error) {
    if (error instanceof PdfExtractionError) throw error;
    const message = error instanceof Error ? error.message : "";
    if (/password|encrypt/i.test(message)) {
      throw new PdfExtractionError("encrypted_pdf", "Encrypted PDFs are not opened.");
    }
    throw new PdfExtractionError("malformed_pdf", "PDF is malformed or unsupported.");
  }
}

export function pdfExtractionToText(result: PdfExtractionResult): string {
  return result.pages.map((page) => page.text).join("\n\n");
}

export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  return pdfExtractionToText(await extractPdfDocument(bytes));
}

export function pdfResultFromText(text: string): PdfExtractionResult {
  const normalized = normalizePdfPageText(text);
  return {
    pages: normalized ? [{ pageNumber: 1, text: normalized }] : [],
    totalPages: 1,
    pagesParsed: normalized ? 1 : 0,
    pageLimitReached: false,
    extractedCharacterCount: normalized.length,
  };
}
