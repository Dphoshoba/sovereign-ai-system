import { lookup as defaultLookup } from "node:dns/promises";

export const RESEARCH_FETCH_TIMEOUT_MS = 10_000;
export const RESEARCH_FETCH_MAX_BYTES = 2_097_152;
export const RESEARCH_FETCH_MAX_REDIRECTS = 3;

export type LookupFn = (
  hostname: string,
) => Promise<Array<{ address: string; family: number }>>;

export type GuardedFetchDeps = {
  lookup?: LookupFn;
  fetch?: typeof fetch;
};

export class UnsafeResearchUrlError extends Error {
  constructor(message: string) {
    super(message);
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
  if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) {
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

export async function assertSafeResearchUrl(
  rawUrl: string,
  deps: GuardedFetchDeps = {},
): Promise<URL> {
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
    throw new UnsafeResearchUrlError("Source hostname is not allowed.");
  }

  if (parsed.hostname.startsWith("[") && parsed.hostname.endsWith("]")) {
    const ip = parsed.hostname.slice(1, -1);
    if (isBlockedIPv6(ip)) {
      throw new UnsafeResearchUrlError("Source address is not allowed.");
    }
    return parsed;
  }

  if (/^\d+\.\d+\.\d+\.\d+$/.test(parsed.hostname)) {
    if (isBlockedIPv4(parsed.hostname)) {
      throw new UnsafeResearchUrlError("Source address is not allowed.");
    }
    return parsed;
  }

  const lookup = deps.lookup ?? (async (hostname: string) => defaultLookup(hostname, { all: true }));
  const addresses = await lookup(parsed.hostname);
  if (!addresses.length) {
    throw new UnsafeResearchUrlError("Source hostname could not be resolved.");
  }
  for (const record of addresses) {
    if (record.family === 6 || record.address.includes(":")) {
      if (isBlockedIPv6(record.address)) {
        throw new UnsafeResearchUrlError("Source address is not allowed.");
      }
    } else if (isBlockedIPv4(record.address)) {
      throw new UnsafeResearchUrlError("Source address is not allowed.");
    }
  }

  return parsed;
}

export async function fetchGuardedResearchSource(
  rawUrl: string,
  deps: GuardedFetchDeps = {},
): Promise<{ url: string; contentType: string; body: Uint8Array }> {
  const fetchImpl = deps.fetch ?? fetch;
  let current = rawUrl;

  for (let hop = 0; hop <= RESEARCH_FETCH_MAX_REDIRECTS; hop += 1) {
    const safeUrl = await assertSafeResearchUrl(current, deps);
    const response = await fetchImpl(safeUrl.toString(), {
      method: "GET",
      redirect: "manual",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/pdf,text/plain;q=0.9",
        "User-Agent": "EchoesVisionsResearchBot/1.0",
      },
      signal: AbortSignal.timeout(RESEARCH_FETCH_TIMEOUT_MS),
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new UnsafeResearchUrlError("Redirect is missing a Location header.");
      }
      current = new URL(location, safeUrl).toString();
      continue;
    }

    if (!response.ok) {
      throw new Error(`Source fetch failed with status ${response.status}.`);
    }

    const contentType = response.headers.get("content-type") || "";
    const buffer = await readLimitedBody(response);
    return {
      url: safeUrl.toString(),
      contentType,
      body: buffer,
    };
  }

  throw new UnsafeResearchUrlError("Too many redirects.");
}

async function readLimitedBody(response: Response): Promise<Uint8Array> {
  const declared = Number(response.headers.get("content-length") || "0");
  if (declared > RESEARCH_FETCH_MAX_BYTES) {
    throw new Error("Source payload exceeds the allowed size.");
  }

  if (!response.body) {
    const fallback = new Uint8Array(await response.arrayBuffer());
    if (fallback.byteLength > RESEARCH_FETCH_MAX_BYTES) {
      throw new Error("Source payload exceeds the allowed size.");
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
      await reader.cancel();
      throw new Error("Source payload exceeds the allowed size.");
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
