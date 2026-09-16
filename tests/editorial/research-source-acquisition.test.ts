import { describe, expect, it } from "vitest";
import { contentFetcher } from "../../lib/research/content-fetcher";
import { extractPdfText, isEncryptedPdf } from "../../lib/research/pdf-text-extractor";
import {
  httpStatusCategory,
  sanitizedHostname,
} from "../../lib/research/source-acquisition";
import {
  assertSafeResearchUrl,
  fetchGuardedResearchSource,
  RESEARCH_FETCH_MAX_BYTES,
} from "../../lib/research/source-fetch-guard";
import {
  buildEncryptedPdf,
  buildLargeNistStylePdf,
  buildMalformedPdf,
  NIST_PDF_PASSAGE,
} from "../fixtures/research-audit/article-2";

const PUBLIC_LOOKUP = async () => [{ address: "93.184.216.34", family: 4 }];

function mockFetch(responses: Record<string, Response>): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    const response = responses[url];
    if (!response) return new Response("", { status: 404 });
    return response.clone();
  }) as typeof fetch;
}

describe("research source acquisition safety", () => {
  it("rejects private addresses and non-https URLs", async () => {
    await expect(assertSafeResearchUrl("http://example.com/doc")).rejects.toMatchObject({
      category: "unsafe_url",
    });
    await expect(assertSafeResearchUrl("https://127.0.0.1/secret")).rejects.toMatchObject({
      category: "dns_rejected",
    });
    await expect(
      assertSafeResearchUrl("https://192.168.1.20/internal"),
    ).rejects.toMatchObject({
      category: "dns_rejected",
    });
  });

  it("rejects unsafe redirect targets", async () => {
    await expect(
      fetchGuardedResearchSource("https://example.com/start", {
        lookup: PUBLIC_LOOKUP,
        fetch: mockFetch({
          "https://example.com/start": new Response("", {
            status: 302,
            headers: { location: "http://example.com/next" },
          }),
        }),
      }),
    ).rejects.toMatchObject({ category: "unsafe_url" });
  });

  it("classifies HTTP 403 as forbidden and does not return a body", async () => {
    const fetched = await contentFetcher("https://www.pwc.com/ai-predictions", "PwC", {
      lookup: PUBLIC_LOOKUP,
      fetch: mockFetch({
        "https://www.pwc.com/ai-predictions": new Response("blocked", {
          status: 403,
          headers: { "content-type": "text/html" },
        }),
      }),
    });
    expect(fetched.fetchStatus).toBe("failed");
    expect(fetched.extractedText).toBe("");
    expect(fetched.diagnostic.category).toBe("http_forbidden");
    expect(fetched.diagnostic.httpStatusCategory).toBe("forbidden");
    expect(JSON.stringify(fetched.diagnostic)).not.toMatch(/blocked|cookie|authorization/i);
  });

  it("aborts oversized payloads without buffering the remainder", async () => {
    const oversized = new Uint8Array(RESEARCH_FETCH_MAX_BYTES + 64).fill(65);
    const fetched = await contentFetcher("https://example.com/huge.pdf", "Huge", {
      lookup: PUBLIC_LOOKUP,
      fetch: mockFetch({
        "https://example.com/huge.pdf": new Response(oversized, {
          status: 200,
          headers: {
            "content-type": "application/pdf",
            "content-length": String(oversized.byteLength),
          },
        }),
      }),
    });
    expect(fetched.diagnostic.category).toBe("payload_too_large");
    expect(fetched.extractedText).toBe("");
  });

  it("classifies timeouts without exposing internal details", async () => {
    const fetched = await contentFetcher("https://example.com/slow", "Slow", {
      lookup: PUBLIC_LOOKUP,
      fetch: (async () => {
        const error = new Error("The operation was aborted due to timeout");
        error.name = "TimeoutError";
        throw error;
      }) as typeof fetch,
    });
    expect(fetched.diagnostic.category).toBe("timeout");
    expect(fetched.diagnostic.hostname).toBe("example.com");
    expect(fetched.diagnostic.rejectionReason).not.toMatch(/stack|ECONN|192\.168/i);
  });

  it("rejects unsupported content types", async () => {
    const fetched = await contentFetcher("https://example.com/file.bin", "Bin", {
      lookup: PUBLIC_LOOKUP,
      fetch: mockFetch({
        "https://example.com/file.bin": new Response("not a document", {
          status: 200,
          headers: { "content-type": "application/octet-stream" },
        }),
      }),
    });
    expect(fetched.diagnostic.category).toBe("unsupported_content_type");
  });

  it("extracts a NIST-sized PDF and fails closed on encrypted or malformed PDFs", async () => {
    const large = await buildLargeNistStylePdf(NIST_PDF_PASSAGE);
    expect(large.byteLength).toBeGreaterThanOrEqual(1_946_127);
    expect(large.byteLength).toBeLessThanOrEqual(RESEARCH_FETCH_MAX_BYTES);

    const text = await extractPdfText(large);
    expect(text).toContain("AI risk management should be integrated");

    expect(isEncryptedPdf(buildEncryptedPdf())).toBe(true);
    await expect(extractPdfText(buildEncryptedPdf())).rejects.toMatchObject({
      category: "encrypted_pdf",
    });
    await expect(extractPdfText(buildMalformedPdf())).rejects.toMatchObject({
      category: "malformed_pdf",
    });
  });

  it("never returns internal addresses from hostname sanitization", () => {
    expect(sanitizedHostname("https://127.0.0.1/secret")).toBe("literal-address");
    expect(sanitizedHostname("https://metadata.google.internal/x")).toBe("blocked-host");
    expect(httpStatusCategory(403)).toBe("forbidden");
    expect(httpStatusCategory(200)).toBe("ok");
  });

  it("pins dual-stack hosts to a validated IPv4 address", async () => {
    const { selectPinnedAddress } = await import("../../lib/research/source-fetch-guard");
    const pinned = selectPinnedAddress([
      { address: "2606:4700::1", family: 6 },
      { address: "93.184.216.34", family: 4 },
    ]);
    expect(pinned.address).toBe("93.184.216.34");
  });
});
