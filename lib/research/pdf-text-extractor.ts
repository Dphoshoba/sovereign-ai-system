import { extractText } from "unpdf";
import { ResearchSourceFetchError } from "./source-acquisition";

export class PdfExtractionError extends ResearchSourceFetchError {
  constructor(
    category: "encrypted_pdf" | "malformed_pdf" | "pdf_extraction_empty",
    message: string,
  ) {
    super(category, message);
    this.name = "PdfExtractionError";
  }
}

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

export async function extractPdfText(bytes: Uint8Array): Promise<string> {
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

  try {
    const extracted = await extractText(new Uint8Array(bytes), { mergePages: true });
    const raw = Array.isArray(extracted.text)
      ? extracted.text.join("\n")
      : extracted.text;
    const text = String(raw || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) {
      throw new PdfExtractionError(
        "pdf_extraction_empty",
        "PDF was fetched but yielded no extractable text.",
      );
    }
    return text;
  } catch (error) {
    if (error instanceof PdfExtractionError) throw error;
    const message = error instanceof Error ? error.message : "";
    if (/password|encrypt/i.test(message)) {
      throw new PdfExtractionError("encrypted_pdf", "Encrypted PDFs are not opened.");
    }
    throw new PdfExtractionError("malformed_pdf", "PDF is malformed or unsupported.");
  }
}
