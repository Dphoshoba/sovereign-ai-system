export const SOURCE_ACQUISITION_CATEGORIES = [
  "accepted",
  "dns_rejected",
  "redirect_rejected",
  "unsafe_url",
  "http_forbidden",
  "http_error",
  "timeout",
  "unsupported_content_type",
  "payload_too_large",
  "pdf_extraction_empty",
  "html_extraction_empty",
  "encrypted_pdf",
  "malformed_pdf",
  "chrome_only",
  "no_relevant_passage",
  "fetch_failed",
] as const;

export type SourceAcquisitionCategory =
  (typeof SOURCE_ACQUISITION_CATEGORIES)[number];

export type HttpStatusCategory =
  | "ok"
  | "redirect"
  | "forbidden"
  | "client_error"
  | "server_error"
  | "none";

export type SourceDocumentType = "html" | "pdf" | "text" | "unknown";

export type SourceAcquisitionDiagnostic = {
  sourceId: string;
  hostname: string;
  documentType: SourceDocumentType;
  category: SourceAcquisitionCategory;
  httpStatusCategory: HttpStatusCategory;
  bytesReceived: number;
  extractedCharacterCount: number;
  acceptedPassageCount: number;
  rejectionReason: string;
};

export class ResearchSourceFetchError extends Error {
  readonly category: SourceAcquisitionCategory;
  readonly httpStatus: number | null;

  constructor(
    category: SourceAcquisitionCategory,
    message: string,
    httpStatus: number | null = null,
  ) {
    super(message);
    this.name = "ResearchSourceFetchError";
    this.category = category;
    this.httpStatus = httpStatus;
  }
}

export function sanitizedHostname(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/\.$/, "");
    if (!hostname) return "invalid-host";
    if (hostname === "localhost" || hostname.endsWith(".localhost")) {
      return "blocked-host";
    }
    if (hostname.endsWith(".internal") || hostname.endsWith(".local")) {
      return "blocked-host";
    }
    if (hostname === "metadata.google.internal") return "blocked-host";
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return "literal-address";
    if (hostname.startsWith("[") && hostname.endsWith("]")) {
      return "literal-address";
    }
    return hostname;
  } catch {
    return "invalid-host";
  }
}

export function httpStatusCategory(status: number | null): HttpStatusCategory {
  if (status == null || status <= 0) return "none";
  if (status >= 200 && status < 300) return "ok";
  if (status >= 300 && status < 400) return "redirect";
  if (status === 401 || status === 403 || status === 407) return "forbidden";
  if (status >= 400 && status < 500) return "client_error";
  if (status >= 500 && status < 600) return "server_error";
  return "none";
}

export function sourceIdFromTitle(title: string, url: string): string {
  const fromTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return fromTitle || sanitizedHostname(url);
}

export function emptyDiagnostic(
  sourceId: string,
  url: string,
  category: SourceAcquisitionCategory,
  rejectionReason: string,
): SourceAcquisitionDiagnostic {
  return {
    sourceId,
    hostname: sanitizedHostname(url),
    documentType: "unknown",
    category,
    httpStatusCategory: "none",
    bytesReceived: 0,
    extractedCharacterCount: 0,
    acceptedPassageCount: 0,
    rejectionReason,
  };
}

export function logSourceAcquisition(
  diagnostics: SourceAcquisitionDiagnostic[],
): void {
  console.info(
    JSON.stringify({
      event: "research-source-acquisition",
      sources: diagnostics,
    }),
  );
}

export function rejectionReasonFor(
  category: SourceAcquisitionCategory,
): string {
  switch (category) {
    case "accepted":
      return "";
    case "dns_rejected":
      return "Source hostname or resolved address is not allowed.";
    case "redirect_rejected":
      return "Redirect target is missing, unsafe, or exceeds the hop limit.";
    case "unsafe_url":
      return "Source URL failed HTTPS or safety checks.";
    case "http_forbidden":
      return "Source refused the request.";
    case "http_error":
      return "Source returned an HTTP error.";
    case "timeout":
      return "Source fetch timed out.";
    case "unsupported_content_type":
      return "Source content type is not HTML, PDF, or plain text.";
    case "payload_too_large":
      return "Source payload exceeded the bounded size cap.";
    case "pdf_extraction_empty":
      return "PDF was fetched but yielded no extractable text.";
    case "html_extraction_empty":
      return "HTML was fetched but yielded no extractable article text.";
    case "encrypted_pdf":
      return "Encrypted PDFs are not opened.";
    case "malformed_pdf":
      return "PDF is malformed or unsupported.";
    case "chrome_only":
      return "Extracted text was only navigation, cookie, or site chrome.";
    case "no_relevant_passage":
      return "Source text was reachable but not relevant to the audited claims.";
    default:
      return "Source could not be acquired.";
  }
}
