import { lookup as defaultLookup } from "node:dns/promises";
import https from "node:https";
import { Readable } from "node:stream";
import {
  ResearchSourceFetchError,
  type SourceAcquisitionCategory,
} from "./source-acquisition";

export const RESEARCH_FETCH_TIMEOUT_MS = 20_000;
export const RESEARCH_PDF_PARSE_TIMEOUT_MS = 12_000;
export const RESEARCH_FETCH_MAX_BYTES = 4_194_304;
export const RESEARCH_FETCH_MAX_REDIRECTS = 3;
export const RESEARCH_PDF_MAX_SCAN_PAGES = 80;
export const RESEARCH_PDF_HARD_PAGE_LIMIT = 200;
export const RESEARCH_PDF_MAX_SCAN_CHARS = 400_000;
export const RESEARCH_PDF_MAX_PAGE_CHARS = 20_000;
export const RESEARCH_PDF_MAX_PASSAGES = 3;
export const RESEARCH_MAX_PASSAGES_PER_CLAIM = 2;
export const RESEARCH_MAX_UNIQUE_AUDIT_PASSAGES = 24;
export const RESEARCH_MAX_CHUNKS_PER_DOCUMENT = 250;
export async function withResearchTimeout<T>(
  ms: number,
  category: SourceAcquisitionCategory,
  message: string,
  work: () => Promise<T>,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;
  try {
    return await Promise.race([
      work().catch((error: unknown) => {
        if (timedOut) {
          return new Promise<T>(() => undefined);
        }
        throw error;
      }),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          timedOut = true;
          reject(new ResearchSourceFetchError(category, message));
        }, ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export type ResolvedResearchTarget = {
  url: URL;
  addresses: Array<{ address: string; family: number }>;
};

const RESEARCH_REQUEST_HEADERS = {
  Accept: "text/html,application/xhtml+xml,application/pdf,text/plain;q=0.9",
  "User-Agent":
    "EchoesVisionsResearchBot/1.1 (research-audit; +https://sovereign-ai-executive.vercel.app)",
} as const;

export function selectPinnedAddress(
  addresses: Array<{ address: string; family: number }>,
): { address: string; family: number } {
  const ipv4 = addresses.find(
    (record) => record.family === 4 || !record.address.includes(":"),
  );
  return ipv4 ?? addresses[0];
}

export type LookupFn = (
  hostname: string,
) => Promise<Array<{ address: string; family: number }>>;

export type GuardedFetchDeps = {
  lookup?: LookupFn;
  fetch?: typeof fetch;
  fetchTimeoutMs?: number;
  pdfParseTimeoutMs?: number;
};

export class UnsafeResearchUrlError extends ResearchSourceFetchError {
  constructor(
    message: string,
    category: SourceAcquisitionCategory = "unsafe_url",
  ) {
    super(category, message);
    this.name = "UnsafeResearchUrlError";
  }
}

function isBlockedIPv4(address: string): boolean {
  const parts = address.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true;
  return false;
}

function isBlockedIPv6(address: string): boolean {
  const lower = address.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (
    lower.startsWith("fe80:") ||
    lower.startsWith("fc00:") ||
    lower.startsWith("fd") ||
    lower.startsWith("fc")
  ) {
    return true;
  }
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedIPv4(mapped[1]);
  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (!host) return true;
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "metadata.google.internal") return true;
  if (host.endsWith(".internal") || host.endsWith(".local")) return true;
  if (host === "0.0.0.0") return true;
  return false;
}

export async function resolveSafeResearchTarget(
  rawUrl: string,
  deps: GuardedFetchDeps = {},
): Promise<ResolvedResearchTarget> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new UnsafeResearchUrlError("Source URL is not a valid absolute URL.");
  }

  if (parsed.protocol !== "https:") {
    throw new UnsafeResearchUrlError("Only https source URLs are allowed.");
  }
  if (parsed.username || parsed.password) {
    throw new UnsafeResearchUrlError("Source URLs must not include credentials.");
  }
  if (parsed.port && parsed.port !== "443") {
    throw new UnsafeResearchUrlError("Source URLs must use the default https port.");
  }
  if (isBlockedHostname(parsed.hostname)) {
    throw new UnsafeResearchUrlError(
      "Source hostname is not allowed.",
      "dns_rejected",
    );
  }

  if (parsed.hostname.startsWith("[") && parsed.hostname.endsWith("]")) {
    const ip = parsed.hostname.slice(1, -1);
    if (isBlockedIPv6(ip)) {
      throw new UnsafeResearchUrlError(
        "Source address is not allowed.",
        "dns_rejected",
      );
    }
    return { url: parsed, addresses: [{ address: ip, family: 6 }] };
  }

  if (/^\d+\.\d+\.\d+\.\d+$/.test(parsed.hostname)) {
    if (isBlockedIPv4(parsed.hostname)) {
      throw new UnsafeResearchUrlError(
        "Source address is not allowed.",
        "dns_rejected",
      );
    }
    return { url: parsed, addresses: [{ address: parsed.hostname, family: 4 }] };
  }

  const lookup = deps.lookup ?? (async (hostname: string) => defaultLookup(hostname, { all: true }));
  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await lookup(parsed.hostname);
  } catch {
    throw new UnsafeResearchUrlError(
      "Source hostname could not be resolved.",
      "dns_rejected",
    );
  }
  if (!addresses.length) {
    throw new UnsafeResearchUrlError(
      "Source hostname could not be resolved.",
      "dns_rejected",
    );
  }
  for (const record of addresses) {
    if (record.family === 6 || record.address.includes(":")) {
      if (isBlockedIPv6(record.address)) {
        throw new UnsafeResearchUrlError(
          "Source address is not allowed.",
          "dns_rejected",
        );
      }
    } else if (isBlockedIPv4(record.address)) {
      throw new UnsafeResearchUrlError(
        "Source address is not allowed.",
        "dns_rejected",
      );
    }
  }

  return { url: parsed, addresses };
}

export async function assertSafeResearchUrl(
  rawUrl: string,
  deps: GuardedFetchDeps = {},
): Promise<URL> {
  return (await resolveSafeResearchTarget(rawUrl, deps)).url;
}

function fetchPinnedHttps(
  target: ResolvedResearchTarget,
  timeoutMs = RESEARCH_FETCH_TIMEOUT_MS,
): Promise<Response> {
  const pinned = selectPinnedAddress(target.addresses);
  const ip = pinned.address.replace(/^\[|\]$/g, "");
  const { url } = target;

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        protocol: "https:",
        hostname: ip,
        port: 443,
        path: `${url.pathname}${url.search}`,
        method: "GET",
        servername: url.hostname,
        headers: {
          ...RESEARCH_REQUEST_HEADERS,
          Host: url.hostname,
        },
        timeout: timeoutMs,
      },
      (incoming) => {
        const headers = new Headers();
        for (const [key, value] of Object.entries(incoming.headers)) {
          if (value == null) continue;
          headers.set(key, Array.isArray(value) ? value.join(", ") : value);
        }
        const body = Readable.toWeb(incoming) as ReadableStream<Uint8Array>;
        resolve(
          new Response(body, {
            status: incoming.statusCode || 0,
            headers,
          }),
        );
      },
    );
    req.on("timeout", () => {
      req.destroy();
      reject(new ResearchSourceFetchError("timeout", "Source fetch timed out."));
    });
    req.on("error", (error) => reject(mapFetchException(error)));
    req.end();
  });
}

export async function fetchGuardedResearchSource(
  rawUrl: string,
  deps: GuardedFetchDeps = {},
): Promise<{ url: string; contentType: string; body: Uint8Array; httpStatus: number }> {
  let current = rawUrl;

  for (let hop = 0; hop <= RESEARCH_FETCH_MAX_REDIRECTS; hop += 1) {
    const target = await resolveSafeResearchTarget(current, deps);
    const fetchTimeoutMs = deps.fetchTimeoutMs ?? RESEARCH_FETCH_TIMEOUT_MS;
    let inflight: Response | undefined;
    let response: Response;
    let body: Uint8Array | null = null;
    try {
      const fetched = await withResearchTimeout(
        fetchTimeoutMs,
        "timeout",
        "Source fetch timed out.",
        async () => {
          const nextResponse = deps.fetch
            ? await deps.fetch(target.url.toString(), {
                method: "GET",
                redirect: "manual",
                headers: RESEARCH_REQUEST_HEADERS,
                signal: AbortSignal.timeout(fetchTimeoutMs),
              })
            : await fetchPinnedHttps(target, fetchTimeoutMs);
          inflight = nextResponse;
          if (nextResponse.status >= 300 && nextResponse.status < 400) {
            return { response: nextResponse, body: null as Uint8Array | null };
          }
          return {
            response: nextResponse,
            body: await readLimitedBody(nextResponse),
          };
        },
      );
      response = fetched.response;
      body = fetched.body;
    } catch (error) {
      if (inflight?.body) {
        void inflight.body.cancel().catch(() => undefined);
      }
      throw mapFetchException(error);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new UnsafeResearchUrlError(
          "Redirect is missing a Location header.",
          "redirect_rejected",
        );
      }
      let nextUrl: string;
      try {
        nextUrl = new URL(location, target.url).toString();
      } catch {
        throw new UnsafeResearchUrlError(
          "Redirect target is not a valid URL.",
          "redirect_rejected",
        );
      }
      current = nextUrl;
      continue;
    }

    if (response.status === 401 || response.status === 403 || response.status === 407) {
      throw new ResearchSourceFetchError(
        "http_forbidden",
        "Source refused the request.",
        response.status,
      );
    }

    if (!response.ok) {
      throw new ResearchSourceFetchError(
        "http_error",
        "Source returned an HTTP error.",
        response.status,
      );
    }

    const contentType = response.headers.get("content-type") || "";
    return {
      url: target.url.toString(),
      contentType,
      body: body ?? new Uint8Array(),
      httpStatus: response.status,
    };
  }

  throw new UnsafeResearchUrlError("Too many redirects.", "redirect_rejected");
}

function mapFetchException(error: unknown): ResearchSourceFetchError {
  if (error instanceof ResearchSourceFetchError) return error;
  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (
    name === "TimeoutError" ||
    name === "AbortError" ||
    message.includes("timeout") ||
    message.includes("aborted")
  ) {
    return new ResearchSourceFetchError("timeout", "Source fetch timed out.");
  }
  return new ResearchSourceFetchError("fetch_failed", "Source fetch failed.");
}

async function readLimitedBody(response: Response): Promise<Uint8Array> {
  const declared = Number(response.headers.get("content-length") || "0");
  if (Number.isFinite(declared) && declared > RESEARCH_FETCH_MAX_BYTES) {
    void response.body?.cancel().catch(() => undefined);
    throw new ResearchSourceFetchError(
      "payload_too_large",
      "Source payload exceeded the bounded size cap.",
    );
  }

  if (!response.body) {
    const fallback = new Uint8Array(await response.arrayBuffer());
    if (fallback.byteLength > RESEARCH_FETCH_MAX_BYTES) {
      throw new ResearchSourceFetchError(
        "payload_too_large",
        "Source payload exceeded the bounded size cap.",
      );
    }
    return fallback;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    received += value.byteLength;
    if (received > RESEARCH_FETCH_MAX_BYTES) {
      void reader.cancel().catch(() => undefined);
      throw new ResearchSourceFetchError(
        "payload_too_large",
        "Source payload exceeded the bounded size cap.",
      );
    }
    chunks.push(value);
  }
  const body = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}
