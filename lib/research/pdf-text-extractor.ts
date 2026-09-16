import { inflateRawSync, inflateSync } from "node:zlib";

function decodePdfLiteral(raw: string): string {
  return raw
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\\([0-7]{1,3})/g, (_match, octal: string) =>
      String.fromCharCode(parseInt(octal, 8)),
    );
}

function extractShownText(content: string): string[] {
  const parts: string[] = [];
  const literal = /\((?:\\.|[^\\)])*\)/g;
  const show = /\((?:\\.|[^\\)])*\)\s*Tj/g;
  const arrayShow = /\[(?:[^\[\]]|\[[^\[\]]*\])*\]\s*TJ/g;

  for (const match of content.matchAll(show)) {
    const inner = match[0].slice(1, match[0].lastIndexOf(")"));
    parts.push(decodePdfLiteral(inner));
  }

  for (const match of content.matchAll(arrayShow)) {
    const body = match[0];
    for (const literalMatch of body.matchAll(literal)) {
      const inner = literalMatch[0].slice(1, -1);
      parts.push(decodePdfLiteral(inner));
    }
  }

  return parts;
}

function inflatePdfStream(payload: Buffer): string {
  for (const inflate of [inflateSync, inflateRawSync]) {
    try {
      return inflate(payload).toString("latin1");
    } catch {
      continue;
    }
  }
  return "";
}

export function extractPdfText(bytes: Uint8Array): string {
  if (bytes.byteLength < 5) return "";
  const header = Buffer.from(bytes.subarray(0, 5)).toString("latin1");
  if (header !== "%PDF-") return "";

  const latin1 = Buffer.from(bytes).toString("latin1");
  const parts = extractShownText(latin1);

  const streamPattern = /stream\r?\n([\s\S]*?)endstream/g;
  for (const match of latin1.matchAll(streamPattern)) {
    const payload = Buffer.from(match[1], "latin1");
    const decoded = inflatePdfStream(payload);
    if (decoded) {
      parts.push(...extractShownText(decoded));
    }
  }

  return parts
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function looksLikePdf(bytes: Uint8Array, contentType = "", url = ""): boolean {
  if (bytes.byteLength >= 5) {
    const header = Buffer.from(bytes.subarray(0, 5)).toString("latin1");
    if (header === "%PDF-") return true;
  }
  if (contentType.toLowerCase().includes("application/pdf")) return true;
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return url.toLowerCase().includes(".pdf");
  }
}
