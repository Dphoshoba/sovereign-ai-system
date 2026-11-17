/**
 * EV-REG-SPEC-1.1.0 — machine identifiers and traceability for verified
 * editorial provenance controls. Not a registry engine.
 */
import { FEATURED_IMAGE_PROMPT_APPROVED_ACTION } from "../ai/featured-image-prompt"
import { RESEARCH_AUDIT_FINGERPRINT_ACTION } from "../research/article-audit-association"
import { ARTICLE_AUDIT_FINGERPRINT_BOUNDARY } from "../research/article-audit-fingerprint"
import { CURRENT_RESEARCH_AUDIT_ENGINE_REVISION } from "../research/research-audit-engine-revision"
import {
  PUBLISH_READY_CONSENSUS_SCORE,
  PUBLISH_READY_RECOMMENDATION,
  PUBLISH_READY_SOURCE_QUALITY_SCORE,
} from "../research/consensus-engine"
import { CORRECTED_AND_UNPUBLISHED_ACTION } from "./correct-and-withdraw"
import { EV_BIBLE_AUTHORITY_CONTRACT_ID } from "../research/claim-source-attribution"

export const EV_REG_SPEC_CONTRACT_ID = "EV-REG-SPEC" as const
export const EV_REG_SPEC_CONTRACT_VERSION = "1.1.0" as const
export const EV_REG_SPEC_FULL_ID = "EV-REG-SPEC-1.1.0" as const

/** Verified requirement IDs documented in docs/editorial/EV-REG-SPEC-1.1.0.md */
export const EV_REG_SPEC_REQUIREMENTS = [
  "REG-R1",
  "REG-R2",
  "REG-R3",
  "REG-R4",
  "REG-R5",
  "REG-R6",
  "REG-R7",
  "REG-R8",
  "REG-R9",
  "REG-R10",
] as const

export type EvRegSpecRequirementId = (typeof EV_REG_SPEC_REQUIREMENTS)[number]

export type EvRegRequirementStatus = "implemented_tested" | "proposed"

/**
 * Provenance review-note actions verified in editorial lifecycle / research /
 * featured-image paths. String actions remain the store of record.
 */
export const EV_REG_PROVENANCE_NOTE_ACTIONS = [
  RESEARCH_AUDIT_FINGERPRINT_ACTION,
  "prepared-for-review",
  "approved",
  "rejected",
  "archived",
  CORRECTED_AND_UNPUBLISHED_ACTION,
  FEATURED_IMAGE_PROMPT_APPROVED_ACTION,
] as const

export const EV_REG_SOCIAL_OPERATIONAL_EVENT_TYPES = [
  "social_publish_claimed",
  "social_publish",
  "social_publish_failed",
  "social_publish_uncertain",
] as const

export type EvRegTraceabilityRow = {
  id: EvRegSpecRequirementId
  status: EvRegRequirementStatus
  summary: string
  codePaths: string[]
}

export const EV_REG_SPEC_TRACEABILITY: EvRegTraceabilityRow[] = [
  {
    id: "REG-R1",
    status: "implemented_tested",
    summary: "SHA-256 content fingerprint boundary for auditable fields + sources.",
    codePaths: [
      "lib/research/article-audit-fingerprint.ts",
      "ARTICLE_AUDIT_FINGERPRINT_BOUNDARY",
    ],
  },
  {
    id: "REG-R2",
    status: "implemented_tested",
    summary: "research-audit-fingerprint association payload version 2.",
    codePaths: [
      "lib/research/article-audit-association.ts",
      RESEARCH_AUDIT_FINGERPRINT_ACTION,
    ],
  },
  {
    id: "REG-R3",
    status: "implemented_tested",
    summary: "Fail-closed current-audit matching (fingerprint/revision/timestamp).",
    codePaths: [
      "lib/research/article-audit-association.ts",
      "lib/research/current-article-audit.ts",
      CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
    ],
  },
  {
    id: "REG-R4",
    status: "implemented_tested",
    summary: "Human approval / reject / archive / correct provenance notes + actors.",
    codePaths: [
      "lib/publishing/article-lifecycle.ts",
      "lib/publishing/correct-and-withdraw.ts",
      CORRECTED_AND_UNPUBLISHED_ACTION,
    ],
  },
  {
    id: "REG-R5",
    status: "implemented_tested",
    summary: "Fingerprint-bound featured-image prompt approval notes.",
    codePaths: [
      "lib/ai/featured-image-prompt.ts",
      "lib/ai/approve-featured-image-prompt.ts",
      FEATURED_IMAGE_PROMPT_APPROVED_ACTION,
    ],
  },
  {
    id: "REG-R6",
    status: "implemented_tested",
    summary: "Publication guard requires current publish-ready audit thresholds.",
    codePaths: [
      "lib/publishing/publication-guard.ts",
      `consensus>=${PUBLISH_READY_CONSENSUS_SCORE}`,
      `sourceQuality>=${PUBLISH_READY_SOURCE_QUALITY_SCORE}`,
      PUBLISH_READY_RECOMMENDATION,
    ],
  },
  {
    id: "REG-R7",
    status: "implemented_tested",
    summary: "Prepare-for-review writes association + prepared-for-review note only.",
    codePaths: ["lib/research/prepare-article-for-review.ts", "prepared-for-review"],
  },
  {
    id: "REG-R8",
    status: "implemented_tested",
    summary: "Unauthorised/disallowed mutations fail closed with articleUnchanged.",
    codePaths: [
      "lib/publishing/require-editor-auth.ts",
      "lib/publishing/article-lifecycle.ts",
    ],
  },
  {
    id: "REG-R9",
    status: "implemented_tested",
    summary: "Social OperationalEvent provenance; uncertain is non-retry.",
    codePaths: [
      "lib/social/publish-twitter-post.ts",
      ...EV_REG_SOCIAL_OPERATIONAL_EVENT_TYPES,
    ],
  },
  {
    id: "REG-R10",
    status: "implemented_tested",
    summary: "No separate EV-REG runtime engine; existing stores are authoritative.",
    codePaths: [
      "docs/editorial/EV-REG-SPEC-1.1.0.md",
      "ArticleReviewNote",
      "ArticleResearchAudit",
      "OperationalEvent",
    ],
  },
]

export type EvRegSpecInventory = {
  contractId: typeof EV_REG_SPEC_CONTRACT_ID
  contractVersion: typeof EV_REG_SPEC_CONTRACT_VERSION
  fullId: typeof EV_REG_SPEC_FULL_ID
  createsRegistryEngine: false
  relatedBibleAuthorityContract: typeof EV_BIBLE_AUTHORITY_CONTRACT_ID
  fingerprintIncludedFields: typeof ARTICLE_AUDIT_FINGERPRINT_BOUNDARY.included
  provenanceNoteActions: typeof EV_REG_PROVENANCE_NOTE_ACTIONS
  socialOperationalEventTypes: typeof EV_REG_SOCIAL_OPERATIONAL_EVENT_TYPES
  publishReady: {
    consensusScore: typeof PUBLISH_READY_CONSENSUS_SCORE
    sourceQualityScore: typeof PUBLISH_READY_SOURCE_QUALITY_SCORE
    recommendation: typeof PUBLISH_READY_RECOMMENDATION
  }
  currentResearchAuditEngineRevision: typeof CURRENT_RESEARCH_AUDIT_ENGINE_REVISION
  traceability: EvRegTraceabilityRow[]
}

/**
 * Deterministic inventory of the reconciled specification bindings.
 * Does not write registry records or evaluate article theology/quality.
 */
export function getEvRegSpecInventory(): EvRegSpecInventory {
  return {
    contractId: EV_REG_SPEC_CONTRACT_ID,
    contractVersion: EV_REG_SPEC_CONTRACT_VERSION,
    fullId: EV_REG_SPEC_FULL_ID,
    createsRegistryEngine: false,
    relatedBibleAuthorityContract: EV_BIBLE_AUTHORITY_CONTRACT_ID,
    fingerprintIncludedFields: ARTICLE_AUDIT_FINGERPRINT_BOUNDARY.included,
    provenanceNoteActions: EV_REG_PROVENANCE_NOTE_ACTIONS,
    socialOperationalEventTypes: EV_REG_SOCIAL_OPERATIONAL_EVENT_TYPES,
    publishReady: {
      consensusScore: PUBLISH_READY_CONSENSUS_SCORE,
      sourceQualityScore: PUBLISH_READY_SOURCE_QUALITY_SCORE,
      recommendation: PUBLISH_READY_RECOMMENDATION,
    },
    currentResearchAuditEngineRevision: CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
    traceability: EV_REG_SPEC_TRACEABILITY,
  }
}

export function implementedEvRegRequirementIds(): EvRegSpecRequirementId[] {
  return EV_REG_SPEC_TRACEABILITY.filter(
    (row) => row.status === "implemented_tested",
  ).map((row) => row.id)
}
