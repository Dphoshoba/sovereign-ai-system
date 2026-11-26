/**
 * Future contract expectations for EV-REG-SPEC-1.0.0 section 14.
 *
 * This module is not a Vitest file. The active suite must not assert these
 * outcomes against article-grounded-v14. An implementation milestone turns
 * each `executable: false` entry into a passing test in the same change that
 * implements that behaviour.
 */
import { createHash } from "node:crypto";

export const CONTRACT_SPECIFICATION = "EV-REG-SPEC-1.0.0" as const;
export const CONTRACT_SUITE_STATUS =
  "not executable against the current baseline" as const;

export function passageChecksum(passage: string): string {
  const normalised = passage.normalize("NFC").trim().replace(/\s+/g, " ");
  return createHash("sha256").update(normalised, "utf8").digest("hex");
}

export function disputeCanonicalText(input: {
  claim: string;
  clause: string;
  contradicting: Array<{ url: string; passage: string }>;
}): string {
  const passages = input.contradicting
    .map((entry) => `${entry.url} ${passageChecksum(entry.passage)}`)
    .sort()
    .join("|");
  return [
    `claim:${input.claim.normalize("NFC").trim().replace(/\s+/g, " ")}`,
    `clause:${input.clause.normalize("NFC").trim().replace(/\s+/g, " ")}`,
    `passages:${passages}`,
  ].join("\n");
}

export function disputeIdFor(input: {
  claim: string;
  clause: string;
  contradicting: Array<{ url: string; passage: string }>;
}): string {
  return createHash("sha256")
    .update(disputeCanonicalText(input), "utf8")
    .digest("hex");
}

const LEARN = "https://learn.microsoft.com/power-platform/copilot/availability";
const SUPPORT = "https://support.microsoft.com/copilot/availability";
const GMAIL = "https://support.google.com/mail/answer/suggest-replies";
const JOINT_PDF = "https://www.cisa.gov/sites/default/files/joint-cybersecurity-information-sheet.pdf";
const NIST = "https://www.nist.gov/publications/ai-risk-management-framework";
const BUSINESS = "https://www.business.gov.au/online/artificial-intelligence";

const SAME_ORG_CLAIM =
  "Some collaboration software can produce a written summary of a meeting.";
const NARROW_CLAIM =
  "Microsoft and Google both state that a person must review an AI-written draft before it is sent.";
const NARROW_GOOGLE = "Gmail can suggest short replies.";
const RESOLVED_CLAIM =
  "Microsoft's documentation states that some Copilot features are not available in every region or language.";
const RESOLVED_CLAUSE =
  "some Copilot features are not available in every region or language";
const RESOLVED_NARROW =
  "A newly released Copilot feature may not appear in every language on the first day.";
const NEW_SPAN = "Copilot features are available in every region and language.";
const JOINT_CLAIM =
  "The joint cybersecurity information sheet states that organisations should validate an AI system before using it.";
const TWO_WORKS_CLAIM =
  "Official guidance and the NIST AI Risk Management Framework both say that AI risk decisions should be documented.";
const ACTOR_CLAIM =
  "Microsoft states that a person must review an AI-written draft before it is sent.";
const ACTOR_PASSAGE =
  "Google states that a person must review an AI-written draft before it is sent.";
const POWER_PLATFORM_CLAIM =
  "Power Platform documentation states that some generative AI features are not available in every region or language.";

const resolvedDispute = {
  claim: RESOLVED_CLAIM,
  clause: RESOLVED_CLAUSE,
  contradicting: [{ url: SUPPORT, passage: RESOLVED_NARROW }],
};
const newSpanDispute = {
  claim: RESOLVED_CLAIM,
  clause: RESOLVED_CLAUSE,
  contradicting: [{ url: LEARN, passage: NEW_SPAN }],
};

export const FIXTURE_URLS = {
  learn: LEARN,
  support: SUPPORT,
  gmail: GMAIL,
  jointPdf: JOINT_PDF,
  nist: NIST,
  business: BUSINESS,
} as const;

export const FIXTURE_TEXT = {
  sameOrgClaim: SAME_ORG_CLAIM,
  narrowClaim: NARROW_CLAIM,
  narrowGoogle: NARROW_GOOGLE,
  resolvedClaim: RESOLVED_CLAIM,
  resolvedClause: RESOLVED_CLAUSE,
  resolvedNarrow: RESOLVED_NARROW,
  newSpan: NEW_SPAN,
  jointClaim: JOINT_CLAIM,
  twoWorksClaim: TWO_WORKS_CLAIM,
  actorClaim: ACTOR_CLAIM,
  actorPassage: ACTOR_PASSAGE,
  powerPlatformClaim: POWER_PLATFORM_CLAIM,
} as const;

export type ContractEvidenceState =
  | "unsupported"
  | "partially supported"
  | "primary-source supported"
  | "independently corroborated"
  | "disputed";

export type FutureContractCase = {
  id: string;
  executable: false;
  claim: string;
  passages: Array<{ url: string; passage: string; polarity: string }>;
  evidenceState: ContractEvidenceState;
  identityCount: number;
  identities: string[];
  verificationMethod: "single-source-supported" | "exact" | "disputed";
  verificationScore: number | null;
  compatibilityStatus: "unverified" | "partially verified" | "verified" | null;
  publication: "not publish-ready" | "publish-ready only when every other section 11 invariant holds";
  disputeIds: string[];
  note: string;
};

export const FUTURE_CONTRACT_CASES: FutureContractCase[] = [
  {
    id: "T-SAME-ORG",
    executable: false,
    claim: SAME_ORG_CLAIM,
    passages: [
      { url: LEARN, passage: SAME_ORG_CLAIM, polarity: "supports" },
      { url: SUPPORT, passage: SAME_ORG_CLAIM, polarity: "supports" },
    ],
    evidenceState: "partially supported",
    identityCount: 1,
    identities: ["publisher:microsoft"],
    verificationMethod: "single-source-supported",
    verificationScore: null,
    compatibilityStatus: "partially verified",
    publication: "not publish-ready",
    disputeIds: [],
    note: "Learn and Support are one registry publisher. The claim names no exclusive primary source.",
  },
  {
    id: "T-NARROW",
    executable: false,
    claim: NARROW_CLAIM,
    passages: [
      { url: LEARN, passage: NARROW_CLAIM, polarity: "supports" },
      { url: GMAIL, passage: NARROW_GOOGLE, polarity: "does-not-address" },
    ],
    evidenceState: "partially supported",
    identityCount: 1,
    identities: ["publisher:microsoft"],
    verificationMethod: "single-source-supported",
    verificationScore: null,
    compatibilityStatus: "partially verified",
    publication: "not publish-ready",
    disputeIds: [],
    note: "The Gmail sentence does not substantiate the full Microsoft-and-Google claim.",
  },
  {
    id: "T-RESOLVED",
    executable: false,
    claim: RESOLVED_CLAIM,
    passages: [
      { url: LEARN, passage: RESOLVED_CLAIM, polarity: "supports" },
      { url: SUPPORT, passage: RESOLVED_NARROW, polarity: "does-not-address" },
    ],
    evidenceState: "primary-source supported",
    identityCount: 1,
    identities: ["publisher:microsoft"],
    verificationMethod: "single-source-supported",
    verificationScore: null,
    compatibilityStatus: "partially verified",
    publication: "not publish-ready",
    disputeIds: [disputeIdFor(resolvedDispute)],
    note: "D1 is not-a-contradiction, still bound to its disputeId, fingerprint, and checksums. No other dispute remains, so the claim is primary-source supported and D1 stays visible.",
  },
  {
    id: "T-NEW-SPAN",
    executable: false,
    claim: RESOLVED_CLAIM,
    passages: [
      { url: LEARN, passage: RESOLVED_CLAIM, polarity: "supports" },
      { url: SUPPORT, passage: RESOLVED_NARROW, polarity: "does-not-address" },
      { url: LEARN, passage: NEW_SPAN, polarity: "contradicts" },
    ],
    evidenceState: "disputed",
    identityCount: 1,
    identities: ["publisher:microsoft"],
    verificationMethod: "disputed",
    verificationScore: 0,
    compatibilityStatus: "unverified",
    publication: "not publish-ready",
    disputeIds: [disputeIdFor(resolvedDispute), disputeIdFor(newSpanDispute)],
    note: "The new Learn span creates a second disputeId. The valid D1 resolution does not cover it.",
  },
  {
    id: "T-JOINT",
    executable: false,
    claim: JOINT_CLAIM,
    passages: [{ url: JOINT_PDF, passage: JOINT_CLAIM, polarity: "supports" }],
    evidenceState: "primary-source supported",
    identityCount: 1,
    identities: ["cisa.gov"],
    verificationMethod: "single-source-supported",
    verificationScore: null,
    compatibilityStatus: "partially verified",
    publication: "not publish-ready",
    disputeIds: [],
    note: "NSA, CISA, and ACSC printed on one PDF contribute one work identity.",
  },
  {
    id: "T-JOINT-PLUS-SECOND-WORK",
    executable: false,
    claim: JOINT_CLAIM,
    passages: [
      { url: JOINT_PDF, passage: JOINT_CLAIM, polarity: "supports" },
      { url: NIST, passage: JOINT_CLAIM, polarity: "supports" },
    ],
    evidenceState: "independently corroborated",
    identityCount: 2,
    identities: ["cisa.gov", "publisher:nist"],
    verificationMethod: "exact",
    verificationScore: null,
    compatibilityStatus: "verified",
    publication: "publish-ready only when every other section 11 invariant holds",
    disputeIds: [],
    note: "The NIST page is a second independently authored work containing the full sentence.",
  },
  {
    id: "T-TWO-WORKS",
    executable: false,
    claim: TWO_WORKS_CLAIM,
    passages: [
      { url: BUSINESS, passage: TWO_WORKS_CLAIM, polarity: "supports" },
      { url: NIST, passage: TWO_WORKS_CLAIM, polarity: "supports" },
    ],
    evidenceState: "independently corroborated",
    identityCount: 2,
    identities: ["business.gov.au", "publisher:nist"],
    verificationMethod: "exact",
    verificationScore: null,
    compatibilityStatus: "verified",
    publication: "publish-ready only when every other section 11 invariant holds",
    disputeIds: [],
    note: "business.gov.au keeps its full hostname. NIST is the registry publisher.",
  },
];

export const FUTURE_SAFETY_SPECIFICATIONS = [
  {
    id: "missing-versioned-metadata",
    executable: false,
    requirement:
      "A versioned audit whose disputes array is missing, null, or malformed fails closed. disputes: [] means no recorded dispute.",
  },
  {
    id: "historical-audit-compatibility",
    executable: false,
    requirement:
      "An audit without specification version EV-REG-SPEC-1.0.0 stays on the baseline gate. A missing disputes field is not a versioned conformance pass.",
  },
  {
    id: "publisher-spoofing",
    executable: false,
    requirement:
      "A title or path containing Microsoft on a host outside the Microsoft registry does not receive publisher:microsoft.",
  },
  {
    id: "duplicate-corroboration",
    executable: false,
    requirement:
      "Two hostnames of one registry publisher count as one identity for every claim shape, including an unattributed claim.",
  },
  {
    id: "primary-source-restrictions",
    executable: false,
    requirement:
      "Primary-source supported remains single-source. Confirmation cannot make it publish-ready or change the content fingerprint.",
  },
  {
    id: "dispute-precedence",
    executable: false,
    requirement:
      "An unresolved material contradiction sets state disputed, score 0, status unverified, and method disputed before every other state.",
  },
  {
    id: "stale-dispute-resolution",
    executable: false,
    requirement:
      "A resolution retires only its own disputeId. A new contradictory checksum, including one from an already listed URL, stays unresolved.",
  },
  {
    id: "human-approval-boundaries",
    executable: false,
    requirement:
      "Confirmation, dispute clearance, approval, scheduling, and publication remain separate. Clearance does not approve or publish.",
  },
  {
    id: "legacy-publication-gate-isolation",
    executable: false,
    requirement:
      "factVerificationEngine and POST /api/research/publication-gate JSON cannot authorise article approval, scheduling, or publication.",
  },
  {
    id: "verification-average-consistency",
    executable: false,
    requirement:
      "A versioned audit stores the average verification score used for the recommendation. A zero-score claim remains in that average.",
  },
  {
    id: "actor-overlap",
    executable: false,
    requirement:
      "A passage that overlaps the claim and names a different actor does not substantiate it.",
    claim: ACTOR_CLAIM,
    passage: ACTOR_PASSAGE,
  },
  {
    id: "power-platform-alias",
    executable: false,
    requirement:
      "A Power Platform availability claim that does not say Microsoft or Copilot is exclusive to publisher:microsoft, count 1, primary-source supported, and not publish-ready.",
    claim: POWER_PLATFORM_CLAIM,
  },
] as const;

export const T_RESOLVED_CONTRACT = FUTURE_CONTRACT_CASES.find(
  (entry) => entry.id === "T-RESOLVED",
)!;

export const T_NEW_SPAN_CONTRACT = FUTURE_CONTRACT_CASES.find(
  (entry) => entry.id === "T-NEW-SPAN",
)!;
