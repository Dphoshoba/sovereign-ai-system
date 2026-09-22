import { canonicalizeSourceUrl } from "./article-audit-fingerprint";

export const ATTRIBUTED_PUBLISHERS = [
  "nist",
  "deloitte",
  "pwc",
  "cdo",
] as const;

export type AttributedPublisher = (typeof ATTRIBUTED_PUBLISHERS)[number];

export type SourceRole =
  | "primary-scripture"
  | "secondary-document"
  | "publisher"
  | "unattributed";

export type NamedSecondaryDocument = "samuel-guide" | "king-david-article";

export type AttributableSource = {
  url: string;
  title?: string | null;
  publisher?: string | null;
};

export type ClaimSourceBinding = {
  role: SourceRole;
  exclusiveUrl: string | null;
  exclusiveDocumentKey: string | null;
  isMultiSource: boolean;
};

type PublisherPattern = {
  id: AttributedPublisher;
  claimPatterns: RegExp[];
  hostPatterns: RegExp[];
  namePatterns: RegExp[];
};

const PUBLISHERS: PublisherPattern[] = [
  {
    id: "nist",
    claimPatterns: [
      /\bnist\b/i,
      /\bai rmf\b/i,
      /\bai risk management framework\b/i,
      /\brisk management framework\b/i,
      /\bnvlpubs\.nist\.gov\b/i,
    ],
    hostPatterns: [/(^|\.)nist\.gov$/i],
    namePatterns: [
      /\bnist\b/i,
      /\bnational institute of standards\b/i,
      /\bai rmf\b/i,
      /\brisk management framework\b/i,
    ],
  },
  {
    id: "deloitte",
    claimPatterns: [/\bdeloitte\b/i],
    hostPatterns: [/(^|\.)deloitte\.com$/i],
    namePatterns: [/\bdeloitte\b/i],
  },
  {
    id: "pwc",
    claimPatterns: [/\bpwc\b/i, /\bpricewaterhousecoopers\b/i],
    hostPatterns: [/(^|\.)pwc\.com$/i],
    namePatterns: [/\bpwc\b/i, /\bpricewaterhousecoopers\b/i],
  },
  {
    id: "cdo",
    claimPatterns: [/\bcdo magazine\b/i, /\bcdo-style\b/i, /\bcdomagazine\b/i],
    hostPatterns: [/(^|\.)cdomagazine\.tech$/i],
    namePatterns: [/\bcdo magazine\b/i, /\bcdomagazine\b/i],
  },
];

const PRIMARY_SCRIPTURE_CLAIM_PATTERNS = [
  /\baccording to\s+1\s+samuel\s+17\b/i,
  /\bthe narrative in\s+1\s+samuel\s+17\b/i,
  /\b1\s+samuel\s+17\s+(states|describes|says|records)\b/i,
];

const SAMUEL_GUIDE_CLAIM_PATTERNS = [
  /\bguide to\s+1\s+and\s+2\s+samuel\b/i,
  /\bsamuel guide\b/i,
  /\bbooks of\s+1\s+and\s+2\s+samuel\b/i,
];

const KING_DAVID_ARTICLE_CLAIM_PATTERNS = [
  /\bking david article\b/i,
  /\barticle on king david\b/i,
  /\bdavid[- ]whats[- ]the[- ]big[- ]deal\b/i,
];

function hostnameOf(url: string): string {
  try {
    return new URL(canonicalizeSourceUrl(url)).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function canonicalSourceUrl(url: string): string {
  try {
    return canonicalizeSourceUrl(url);
  } catch {
    return url.trim();
  }
}

export function sameDocumentIdentity(
  left: string,
  right: string,
): boolean {
  return canonicalSourceUrl(left) === canonicalSourceUrl(right);
}

function sourceIdentityText(source: AttributableSource): string {
  return `${source.title ?? ""} ${source.publisher ?? ""} ${source.url}`;
}

export function isPrimaryScriptureClaim(claim: string): boolean {
  return PRIMARY_SCRIPTURE_CLAIM_PATTERNS.some((pattern) => pattern.test(claim));
}

export function namedSecondaryDocuments(claim: string): NamedSecondaryDocument[] {
  const named: NamedSecondaryDocument[] = [];
  if (SAMUEL_GUIDE_CLAIM_PATTERNS.some((pattern) => pattern.test(claim))) {
    named.push("samuel-guide");
  }
  if (KING_DAVID_ARTICLE_CLAIM_PATTERNS.some((pattern) => pattern.test(claim))) {
    named.push("king-david-article");
  }
  return named;
}

export function isBibleProjectClaim(claim: string): boolean {
  return /\bbibleproject\b/i.test(claim);
}

export function isPrimaryScriptureSource(source: AttributableSource): boolean {
  const url = source.url.toLowerCase();
  const identity = sourceIdentityText(source);
  const hasSamuel17 =
    /1[\s%+_-]*samuel[\s%+_-]*17/i.test(identity) ||
    /search=1(%20|\+| )samuel(%20|\+| )17/i.test(url);
  const isBibleGateway =
    /biblegateway\.com/i.test(url) || /\bbiblegateway\b/i.test(identity);
  return hasSamuel17 && isBibleGateway;
}

export function isBibleProjectSource(source: AttributableSource): boolean {
  const url = source.url.toLowerCase();
  const identity = sourceIdentityText(source);
  return /bibleproject\.com/i.test(url) || /\bbibleproject\b/i.test(identity);
}

export function sourceMatchesNamedDocument(
  source: AttributableSource,
  document: NamedSecondaryDocument,
): boolean {
  const url = source.url.toLowerCase();
  const identity = sourceIdentityText(source);
  if (document === "samuel-guide") {
    return (
      /\/guides\/books-of-samuel/i.test(url) ||
      (/bibleproject/i.test(identity) &&
        /\bguides?\b/i.test(identity) &&
        /\bsamuel\b/i.test(identity) &&
        !/david-whats-big-deal/i.test(url))
    );
  }
  return (
    /\/articles\/david-whats-big-deal/i.test(url) ||
    (/bibleproject/i.test(identity) &&
      /\bking david\b/i.test(identity) &&
      /\barticle\b/i.test(identity) &&
      !/\/guides\/books-of-samuel/i.test(url))
  );
}

export function isExplicitMultiSourceClaim(claim: string): boolean {
  if (publishersNamedInClaim(claim).length > 1) return true;
  const namedDocs = namedSecondaryDocuments(claim);
  if (namedDocs.length > 1) return true;
  const scripture = isPrimaryScriptureClaim(claim);
  const secondary = namedDocs.length > 0 || isBibleProjectClaim(claim);
  if (!scripture || !secondary) return false;
  return (
    /\baccording to\s+1\s+samuel\s+17\b/i.test(claim) &&
    /\b(and|together with|as well as)\b.{0,80}\b(according to\s+)?bibleproject\b/i.test(
      claim,
    )
  );
}

export function publishersNamedInClaim(claim: string): AttributedPublisher[] {
  const found = new Set<AttributedPublisher>();
  for (const publisher of PUBLISHERS) {
    if (publisher.claimPatterns.some((pattern) => pattern.test(claim))) {
      found.add(publisher.id);
    }
  }
  return ATTRIBUTED_PUBLISHERS.filter((id) => found.has(id));
}

export function publishersForSource(
  source: AttributableSource,
): AttributedPublisher[] {
  const hostname = hostnameOf(source.url);
  const identity = `${source.title ?? ""} ${source.publisher ?? ""}`;
  const found = new Set<AttributedPublisher>();
  for (const publisher of PUBLISHERS) {
    if (
      (hostname && publisher.hostPatterns.some((pattern) => pattern.test(hostname))) ||
      publisher.namePatterns.some((pattern) => pattern.test(identity))
    ) {
      found.add(publisher.id);
    }
  }
  return ATTRIBUTED_PUBLISHERS.filter((id) => found.has(id));
}

function resolveExclusiveUrl(
  listedSources: AttributableSource[],
  predicate: (source: AttributableSource) => boolean,
): string | null {
  const match = listedSources.find(predicate);
  return match ? canonicalSourceUrl(match.url) : null;
}

export function resolveClaimSourceBinding(
  claim: string,
  listedSources: AttributableSource[] = [],
): ClaimSourceBinding {
  const multiSource = isExplicitMultiSourceClaim(claim);
  const namedDocs = namedSecondaryDocuments(claim);

  if (isPrimaryScriptureClaim(claim) && !multiSource) {
    return {
      role: "primary-scripture",
      exclusiveUrl: resolveExclusiveUrl(listedSources, isPrimaryScriptureSource),
      exclusiveDocumentKey: "1-samuel-17",
      isMultiSource: false,
    };
  }

  if (namedDocs.length === 1 && !multiSource) {
    const document = namedDocs[0];
    return {
      role: "secondary-document",
      exclusiveUrl: resolveExclusiveUrl(listedSources, (source) =>
        sourceMatchesNamedDocument(source, document),
      ),
      exclusiveDocumentKey: document,
      isMultiSource: false,
    };
  }

  const namedPublishers = publishersNamedInClaim(claim);
  return {
    role:
      namedPublishers.length > 0 || isBibleProjectClaim(claim)
        ? "publisher"
        : "unattributed",
    exclusiveUrl: null,
    exclusiveDocumentKey: null,
    isMultiSource: multiSource,
  };
}

export function claimAllowsEvidence(
  claim: string,
  source: AttributableSource,
  listedSources: AttributableSource[] = [],
): boolean {
  const binding = resolveClaimSourceBinding(claim, listedSources);

  if (binding.role === "primary-scripture") {
    if (listedSources.length > 0) {
      if (!binding.exclusiveUrl) return false;
      return sameDocumentIdentity(source.url, binding.exclusiveUrl);
    }
    return isPrimaryScriptureSource(source);
  }

  if (binding.role === "secondary-document") {
    if (listedSources.length > 0) {
      if (!binding.exclusiveUrl) return false;
      return sameDocumentIdentity(source.url, binding.exclusiveUrl);
    }
    return Boolean(
      binding.exclusiveDocumentKey &&
        sourceMatchesNamedDocument(
          source,
          binding.exclusiveDocumentKey as NamedSecondaryDocument,
        ),
    );
  }

  if (isBibleProjectClaim(claim) && !isPrimaryScriptureClaim(claim)) {
    return isBibleProjectSource(source);
  }

  const named = publishersNamedInClaim(claim);
  if (named.length === 0) return true;
  const sourcePublishers = publishersForSource(source);
  return named.some((id) => sourcePublishers.includes(id));
}

export function evidenceCorroborationKey(
  claim: string,
  source: AttributableSource,
  listedSources: AttributableSource[] = [],
): string {
  const binding = resolveClaimSourceBinding(claim, listedSources);
  if (binding.isMultiSource) {
    return canonicalSourceUrl(source.url);
  }
  if (binding.exclusiveUrl) {
    return binding.exclusiveUrl;
  }
  return hostnameOf(source.url) || canonicalSourceUrl(source.url);
}

export function isMultiSourceSynthesisClaim(claim: string): boolean {
  return isExplicitMultiSourceClaim(claim);
}
