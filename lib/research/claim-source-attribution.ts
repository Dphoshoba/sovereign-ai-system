import { canonicalizeSourceUrl } from "./article-audit-fingerprint";

export const ATTRIBUTED_PUBLISHERS = [
  "nist",
  "deloitte",
  "pwc",
  "cdo",
] as const;

export type AttributedPublisher = (typeof ATTRIBUTED_PUBLISHERS)[number];

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

export type AttributableSource = {
  url: string;
  title?: string | null;
  publisher?: string | null;
};

function hostnameOf(url: string): string {
  try {
    return new URL(canonicalizeSourceUrl(url)).hostname.toLowerCase();
  } catch {
    return "";
  }
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

export function claimAllowsEvidence(
  claim: string,
  source: AttributableSource,
): boolean {
  const named = publishersNamedInClaim(claim);
  if (named.length === 0) return true;
  const sourcePublishers = publishersForSource(source);
  return named.some((id) => sourcePublishers.includes(id));
}

export function isMultiSourceSynthesisClaim(claim: string): boolean {
  return publishersNamedInClaim(claim).length > 1;
}
