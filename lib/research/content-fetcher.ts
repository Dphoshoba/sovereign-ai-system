import { contentCleaner } from "./content-cleaner";
import { extractHtmlDocument } from "./html-text-extractor";
import { extractPdfText, looksLikePdf } from "./pdf-text-extractor";
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
};

export type ContentFetchDeps = GuardedFetchDeps;

function decodeText(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export async function contentFetcher(
  url: string,
  title: string,
  deps: ContentFetchDeps = {},
): Promise<FetchedContent> {
  try {
    const fetched = await fetchGuardedResearchSource(url, deps);
    const contentType = fetched.contentType.toLowerCase();

    if (looksLikePdf(fetched.body, contentType, fetched.url)) {
      const extractedText = contentCleaner(extractPdfText(fetched.body));
      return {
        title,
        url: fetched.url,
        extractedText,
        fetchStatus: extractedText ? "success" : "failed",
        contentKind: "pdf",
      };
    }

    if (
      contentType &&
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml") &&
      !contentType.includes("text/plain")
    ) {
      return {
        title,
        url: fetched.url,
        extractedText: "",
        fetchStatus: "failed",
        contentKind: "text",
      };
    }

    const html = decodeText(fetched.body);
    const extracted = extractHtmlDocument(html);
    const extractedText = contentCleaner(extracted.extractedText);
    return {
      title: extracted.title || title,
      url: fetched.url,
      extractedText,
      fetchStatus: extractedText ? "success" : "failed",
      contentKind: "html",
    };
  } catch {
    return {
      title,
      url,
      extractedText: "",
      fetchStatus: "failed",
    };
  }
}
