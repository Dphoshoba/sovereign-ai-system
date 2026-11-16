import { canonicalizeSourceUrl } from "./article-audit-fingerprint";
import { assessPassageSupport } from "./article-claim-extractor";
import {
  publishersNamedInClaim,
  type AttributedPublisher,
} from "./claim-source-attribution";

const HOST_REGISTRY: Array<{ id: AttributedPublisher; host: RegExp }> = [
  { id: "nist", host: /(^|\.)nist\.gov$/i },
  { id: "deloitte", host: /(^|\.)deloitte\.com$/i },
  { id: "pwc", host: /(^|\.)pwc\.com$/i },
  { id: "cdo", host: /(^|\.)cdomagazine\.tech$/i },
  { id: "microsoft", host: /(^|\.)microsoft\.com$/i },
  { id: "google", host: /(^|\.)google\.com$/i },
  { id: "meta", host: /(^|\.)(?:about\.fb\.com|meta\.com|facebook\.com)$/i },
  { id: "intuit", host: /(^|\.)intuit\.com$/i },
  { id: "xero", host: /(^|\.)xero\.com$/i },
  { id: "zapier", host: /(^|\.)zapier\.com$/i },
  {
    id: "openai",
    host: /(^|\.)(?:openai\.com|developers\.openai\.com|platform\.openai\.com)$/i,
  },
];

const ACTOR_WORDS: Record<string, AttributedPublisher> = {
  microsoft: "microsoft",
  copilot: "microsoft",
  outlook: "microsoft",
  "power platform": "microsoft",
  google: "google",
  gmail: "google",
  nist: "nist",
  meta: "meta",
  deloitte: "deloitte",
  pwc: "pwc",
  intuit: "intuit",
  xero: "xero",
  zapier: "zapier",
  openai: "openai",
  chatgpt: "openai",
};

export type VersionedPassagePolarity = "supports" | "does-not-address" | "contradicts";

export type VersionedPassage = {
  url: string;
  passage: string;
  polarity?: VersionedPassagePolarity;
  title?: string | null;
};

export type VersionedEvidenceState =
  | "unsupported"
  | "partially supported"
  | "primary-source supported"
  | "independently corroborated"
  | "disputed";

export type VersionedEvidenceResult = {
  evidenceState: VersionedEvidenceState;
  verificationStatus: "unverified" | "partially verified" | "verified";
  verificationCount: number;
  verificationMethod: "single-source-supported" | "exact" | "disputed";
  verificationScore: number;
  identities: string[];
  compatibilityStatus: "unverified" | "partially verified" | "verified";
  publication: "not publish-ready" | "publish-ready only when every other section 11 invariant holds";
};

export function versionedHostname(url: string): string | null {
  try {
    const hostname = new URL(canonicalizeSourceUrl(url)).hostname
      .toLowerCase()
      .replace(/^www\./, "");
    return hostname.length > 0 ? hostname : null;
  } catch {
    return null;
  }
}

export function versionedCanonicalIdentity(source: {
  url: string;
  title?: string | null;
}): string | null {
  const hostname = versionedHostname(source.url);
  if (!hostname) return null;
  const registered = HOST_REGISTRY.find((entry) => entry.host.test(hostname));
  return registered ? `publisher:${registered.id}` : hostname;
}

export function versionedPublishersNamedInClaim(claim: string): AttributedPublisher[] {
  const found = new Set<AttributedPublisher>(publishersNamedInClaim(claim));
  if (/\bpower platform\b/i.test(claim)) found.add("microsoft");
  return [...found];
}

function attributesSharedFact(claim: string): boolean {
  return /\bboth\b/i.test(claim) || /\bofficial guidance\b/i.test(claim);
}

function leadingActor(text: string): AttributedPublisher | null {
  const match = text.match(
    /^(?:according to\s+)?(power platform|microsoft|google|gmail|copilot|outlook|nist|meta|deloitte|pwc|intuit|xero|zapier|openai|chatgpt)\b/i,
  );
  if (!match) return null;
  return ACTOR_WORDS[match[1].toLowerCase()] ?? null;
}

export function versionedPassageSubstantiates(claim: string, passage: string): boolean {
  const claimActor = leadingActor(claim);
  const passageActor = leadingActor(passage);
  if (claimActor && passageActor && claimActor !== passageActor) return false;
  return assessPassageSupport(claim, passage).supported;
}

function sourceEligible(claim: string, identity: string): boolean {
  const named = versionedPublishersNamedInClaim(claim);
  if (named.length >= 2) return named.some((id) => identity === `publisher:${id}`);
  if (named.length === 1 && !attributesSharedFact(claim)) {
    return identity === `publisher:${named[0]}`;
  }
  return true;
}

function exclusivePrimary(claim: string, identities: string[]): boolean {
  if (identities.length !== 1) return false;
  if (/\bpower platform\b/i.test(claim) && identities[0] === "publisher:microsoft") return true;
  const named = versionedPublishersNamedInClaim(claim);
  if (named.length === 1 && !attributesSharedFact(claim)) return true;
  // Vendor-doc claims ("Zapier's … guide…") stay exclusive to that vendor even
  // when the documented product names another registry alias (e.g. ChatGPT/OpenAI).
  const docOwner = claim.match(
    /\b(zapier|microsoft|google|openai|nist|meta|intuit|xero)'?s\b/i,
  );
  if (
    docOwner &&
    identities[0] === `publisher:${docOwner[1].toLowerCase()}` &&
    !attributesSharedFact(claim)
  ) {
    return true;
  }
  return (
    named.length === 0 &&
    /\b(information sheet|official guidance|documentation)\b/i.test(claim)
  );
}

function hostnameAuthority(url: string): number {
  const hostname = versionedHostname(url) ?? "";
  if (hostname.endsWith(".gov") || hostname === "nist.gov" || hostname.endsWith(".nist.gov")) {
    return 100;
  }
  if (hostname.endsWith(".edu")) return 95;
  if (hostname.endsWith("pwc.com") || hostname.endsWith("deloitte.com")) return 80;
  return 50;
}

function verificationScore(count: number, urls: string[], disputed: boolean): number {
  if (disputed || count === 0) return 0;
  const authority = urls.length === 0 ? 0 : Math.max(...urls.map(hostnameAuthority));
  if (count === 1) return Math.min(70, 40 + Math.round(authority * 0.25));
  return Math.min(100, 55 + count * 15 + Math.round(authority * 0.2));
}

export function evaluateVersionedClaim(input: {
  claim: string;
  passages: VersionedPassage[];
  unresolvedDisputes?: number;
}): VersionedEvidenceResult {
  const substantiating = new Map<string, string>();
  for (const passage of input.passages) {
    if (passage.polarity === "does-not-address" || passage.polarity === "contradicts") continue;
    const identity = versionedCanonicalIdentity(passage);
    if (!identity || !sourceEligible(input.claim, identity)) continue;
    if (!versionedPassageSubstantiates(input.claim, passage.passage)) continue;
    substantiating.set(identity, passage.url);
  }

  const identities = [...substantiating.keys()].sort();
  const disputed = (input.unresolvedDisputes ?? 0) > 0;
  const count = identities.length;
  let evidenceState: VersionedEvidenceState;
  if (disputed) evidenceState = "disputed";
  else if (count === 0) evidenceState = "unsupported";
  else if (count >= 2) evidenceState = "independently corroborated";
  else if (exclusivePrimary(input.claim, identities)) evidenceState = "primary-source supported";
  else evidenceState = "partially supported";

  const verificationStatus =
    evidenceState === "independently corroborated"
      ? "verified"
      : evidenceState === "partially supported" || evidenceState === "primary-source supported"
        ? "partially verified"
        : "unverified";
  const verificationMethod =
    evidenceState === "disputed"
      ? "disputed"
      : evidenceState === "independently corroborated"
        ? "exact"
        : "single-source-supported";

  return {
    evidenceState,
    verificationStatus,
    verificationCount: count,
    verificationMethod,
    verificationScore: verificationScore(count, [...substantiating.values()], disputed),
    identities,
    compatibilityStatus: verificationStatus,
    publication:
      evidenceState === "independently corroborated"
        ? "publish-ready only when every other section 11 invariant holds"
        : "not publish-ready",
  };
}
