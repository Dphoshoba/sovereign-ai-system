import { contentCleaner } from "./content-cleaner";
import { extractHtmlDocument } from "./html-text-extractor";
import { extractPdfText, looksLikePdf } from "./pdf-text-extractor";
import {
  emptyDiagnostic,
  httpStatusCategory,
  rejectionReasonFor,
  ResearchSourceFetchError,
  sourceIdFromTitle,
  type SourceAcquisitionCategory,
  type SourceAcquisitionDiagnostic,
  type SourceDocumentType,
} from "./source-acquisition";
import {
  fetchGuardedResearchSource,
  type GuardedFetchDeps,
} from "./source-fetch-guard";

export type FetchedContent = {
  title: string;
  url: string;
  extractedText: string;
  fetchStatus: string;
  contentKind?: "html" | "pdf" | "text";
  diagnostic: SourceAcquisitionDiagnostic;
};

export type ContentFetchDeps = GuardedFetchDeps;

function decodeText(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

function failedFetch(
  title: string,
  url: string,
  category: SourceAcquisitionCategory,
  extras: Partial<SourceAcquisitionDiagnostic> = {},
): FetchedContent {
  return {
    title,
    url,
    extractedText: "",
    fetchStatus: "failed",
    diagnostic: {
      ...emptyDiagnostic(sourceIdFromTitle(title, url), url, category, rejectionReasonFor(category)),
      ...extras,
    },
  };
}

export async function contentFetcher(
  url: string,
  title: string,
  deps: ContentFetchDeps = {},
): Promise<FetchedContent> {
  try {
    const fetched = await fetchGuardedResearchSource(url, deps);
    const contentType = fetched.contentType.toLowerCase();
    const sourceId = sourceIdFromTitle(title, url);
    const base = {
      sourceId,
      hostname: emptyDiagnostic(sourceId, url, "fetch_failed", "").hostname,
      httpStatusCategory: httpStatusCategory(fetched.httpStatus),
      bytesReceived: fetched.body.byteLength,
    };

    if (looksLikePdf(fetched.body, contentType, fetched.url)) {
      const extractedText = contentCleaner(await extractPdfText(fetched.body));
      return {
        title,
        url: fetched.url,
        extractedText,
        fetchStatus: extractedText ? "success" : "failed",
        contentKind: "pdf",
        diagnostic: {
          ...base,
          documentType: "pdf",
          category: extractedText ? "accepted" : "pdf_extraction_empty",
          extractedCharacterCount: extractedText.length,
          acceptedPassageCount: 0,
          rejectionReason: extractedText
            ? ""
            : rejectionReasonFor("pdf_extraction_empty"),
        },
      };
    }

    if (
      contentType &&
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml") &&
      !contentType.includes("text/plain")
    ) {
      return failedFetch(title, url, "unsupported_content_type", {
        ...base,
        documentType: "unknown",
        extractedCharacterCount: 0,
      });
    }

    const html = decodeText(fetched.body);
    const extracted = extractHtmlDocument(html);
    const extractedText = contentCleaner(extracted.extractedText);
    const documentType: SourceDocumentType = contentType.includes("text/plain")
      ? "text"
      : "html";
    if (!extractedText) {
      return {
        title: extracted.title || title,
        url: fetched.url,
        extractedText: "",
        fetchStatus: "failed",
        contentKind: documentType === "text" ? "text" : "html",
        diagnostic: {
          ...base,
          documentType,
          category: "html_extraction_empty",
          extractedCharacterCount: 0,
          acceptedPassageCount: 0,
          rejectionReason: rejectionReasonFor("html_extraction_empty"),
        },
      };
    }

    return {
      title: extracted.title || title,
      url: fetched.url,
      extractedText,
      fetchStatus: "success",
      contentKind: documentType === "text" ? "text" : "html",
      diagnostic: {
        ...base,
        documentType,
        category: "accepted",
        extractedCharacterCount: extractedText.length,
        acceptedPassageCount: 0,
        rejectionReason: "",
      },
    };
  } catch (error) {
    if (error instanceof ResearchSourceFetchError) {
      return failedFetch(title, url, error.category, {
        httpStatusCategory: httpStatusCategory(error.httpStatus),
      });
    }
    return failedFetch(title, url, "fetch_failed");
  }
}
