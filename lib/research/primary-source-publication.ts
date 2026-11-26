/**
 * EV-REG-SPEC-1.1.0 primary-source publication eligibility.
 * Scores are never mutated here; confirmation only affects eligibility.
 *
 * Callers:
 * - lib/publishing/publication-guard.ts (researchPublicationBlockReason)
 * - lib/research/versioned-publication.ts (avg-verification gate for 1.1.0)
 * - lib/research/confirm-primary-source-claims.ts (recommendation after confirm)
 * - tests/editorial/ev-reg-1.1.0-primary-source-publication.test.ts
 *
 * No existing module encodes the Director §3.4 redline (primary-source +
 * confirmation pathway without dual-publisher numeric disqualification).
 *
 * User instruction (verbatim excerpt): "Approve an authoritative primary-source
 * publication pathway" / "Numerical thresholds designed to measure independent
 * corroboration must not independently disqualify a properly confirmed
 * primary-source claim merely because a second publisher is absent." /
 * "Implement this as a versioned EV-REG-SPEC-1.1.0 governance change"
 */
import {
  EV_REG_SPEC_1_0_0,
  EV_REG_SPEC_1_1_0,
} from "./audit-specification-compatibility"
import {
  PUBLISH_READY_CONSENSUS_SCORE,
  PUBLISH_READY_RECOMMENDATION,
  PUBLISH_READY_SOURCE_QUALITY_SCORE,
} from "./consensus-engine"
import type { VersionedEvidenceState } from "./versioned-evidence"

export type PrimarySourceConfirmationDecision = "confirmed" | "declined"

export type PrimarySourceConfirmation = {
  claimChecksum: string
  decision: PrimarySourceConfirmationDecision
  decidedBy: string
  decidedAt: string
  primarySourceUrl: string
  rationale: string
  auditId: string
}

export type PrimarySourceEligibleFact = {
  claim?: unknown
  verificationStatus?: unknown
  verificationMethod?: unknown
  verificationCount?: unknown
  verificationScore?: unknown
  evidenceState?: unknown
  sourceUrl?: unknown
  supportingSources?: unknown
  primarySourceConfirmation?: unknown
}

export function claimTextChecksum(claim: string): string {
  let hash = 2166136261
  for (let i = 0; i < claim.length; i += 1) {
    hash ^= claim.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, "0")
}

export function isEvReg110Audit(specificationVersion: unknown): boolean {
  return specificationVersion === EV_REG_SPEC_1_1_0
}

export function isEvReg100Audit(specificationVersion: unknown): boolean {
  return specificationVersion === EV_REG_SPEC_1_0_0
}

export function resolveEvidenceState(
  fact: PrimarySourceEligibleFact,
): VersionedEvidenceState | "unknown" {
  const explicit = fact.evidenceState
  if (
    explicit === "unsupported" ||
    explicit === "partially supported" ||
    explicit === "primary-source supported" ||
    explicit === "independently corroborated" ||
    explicit === "disputed"
  ) {
    return explicit
  }
  if (fact.verificationMethod === "disputed") return "disputed"
  if (fact.verificationStatus === "unverified") return "unsupported"
  if (
    fact.verificationMethod === "exact" &&
    typeof fact.verificationCount === "number" &&
    fact.verificationCount >= 2
  ) {
    return "independently corroborated"
  }
  if (
    fact.verificationStatus === "partially verified" ||
    fact.verificationMethod === "single-source-supported"
  ) {
    return "partially supported"
  }
  return "unknown"
}

function primarySourceUrl(fact: PrimarySourceEligibleFact): string | null {
  if (typeof fact.sourceUrl === "string" && fact.sourceUrl.trim()) {
    return fact.sourceUrl.trim()
  }
  if (!Array.isArray(fact.supportingSources)) return null
  for (const source of fact.supportingSources) {
    if (!source || typeof source !== "object") continue
    const url = (source as { sourceUrl?: unknown }).sourceUrl
    if (typeof url === "string" && url.trim()) return url.trim()
  }
  return null
}

/** Blocks measured outcomes / cross-vendor stats from the primary-source pathway. */
export function claimAssertsNonPrimaryOutcomes(claim: string): boolean {
  return /\b(\d+\s*%|percent|percentage|market size|productivity|revenue|ROI|study found|studies show|compared to|versus|vs\.?)\b/i.test(
    claim,
  )
}

export function readPrimarySourceConfirmation(
  fact: PrimarySourceEligibleFact,
): PrimarySourceConfirmation | null {
  const raw = fact.primarySourceConfirmation
  if (!raw || typeof raw !== "object") return null
  const record = raw as Record<string, unknown>
  if (
    typeof record.claimChecksum !== "string" ||
    (record.decision !== "confirmed" && record.decision !== "declined") ||
    typeof record.decidedBy !== "string" ||
    typeof record.decidedAt !== "string" ||
    typeof record.primarySourceUrl !== "string" ||
    typeof record.rationale !== "string" ||
    typeof record.auditId !== "string"
  ) {
    return null
  }
  return {
    claimChecksum: record.claimChecksum,
    decision: record.decision,
    decidedBy: record.decidedBy,
    decidedAt: record.decidedAt,
    primarySourceUrl: record.primarySourceUrl,
    rationale: record.rationale,
    auditId: record.auditId,
  }
}

export function primarySourcePathwaySatisfied(
  fact: PrimarySourceEligibleFact,
  auditId: string,
): boolean {
  if (resolveEvidenceState(fact) !== "primary-source supported") return false
  const claim = typeof fact.claim === "string" ? fact.claim : ""
  if (!claim || claimAssertsNonPrimaryOutcomes(claim)) return false
  const url = primarySourceUrl(fact)
  if (!url) return false
  const confirmation = readPrimarySourceConfirmation(fact)
  if (!confirmation || confirmation.decision !== "confirmed") return false
  if (confirmation.auditId !== auditId) return false
  if (confirmation.claimChecksum !== claimTextChecksum(claim)) return false
  if (confirmation.primarySourceUrl.trim().length === 0) return false
  return true
}

export function independentPathwaySatisfied(
  fact: PrimarySourceEligibleFact,
): boolean {
  return resolveEvidenceState(fact) === "independently corroborated"
}

export type EvReg11EligibilityResult = {
  ready: boolean
  reason: string | null
  usesIndependentPathway: boolean
  usesPrimarySourcePathway: boolean
  recommendation: typeof PUBLISH_READY_RECOMMENDATION | "review-required"
}

export function evaluateEvReg11PublicationEligibility(input: {
  auditId?: string | null
  specificationVersion?: unknown
  consensusScore?: unknown
  sourceQualityScore?: unknown
  averageVerificationScore?: unknown
  publicationRecommendation?: unknown
  facts?: unknown
}): EvReg11EligibilityResult {
  if (!isEvReg110Audit(input.specificationVersion)) {
    return {
      ready: false,
      reason: "Audit is not EV-REG-SPEC-1.1.0.",
      usesIndependentPathway: false,
      usesPrimarySourcePathway: false,
      recommendation: "review-required",
    }
  }
  if (!Array.isArray(input.facts) || input.facts.length === 0) {
    return {
      ready: false,
      reason: "Versioned audit facts are missing.",
      usesIndependentPathway: false,
      usesPrimarySourcePathway: false,
      recommendation: "review-required",
    }
  }
  if (
    typeof input.sourceQualityScore !== "number" ||
    !Number.isFinite(input.sourceQualityScore) ||
    input.sourceQualityScore < PUBLISH_READY_SOURCE_QUALITY_SCORE
  ) {
    return {
      ready: false,
      reason: "Source quality is below the publication threshold.",
      usesIndependentPathway: false,
      usesPrimarySourcePathway: false,
      recommendation: "review-required",
    }
  }

  const auditId = typeof input.auditId === "string" ? input.auditId : ""
  let usesIndependentPathway = false
  let usesPrimarySourcePathway = false

  for (const row of input.facts) {
    if (!row || typeof row !== "object") {
      return {
        ready: false,
        reason: "Independent verification metadata is missing.",
        usesIndependentPathway,
        usesPrimarySourcePathway,
        recommendation: "review-required",
      }
    }
    const fact = row as PrimarySourceEligibleFact
    const state = resolveEvidenceState(fact)
    if (state === "independently corroborated") {
      usesIndependentPathway = true
      if (!independentPathwaySatisfied(fact)) {
        return {
          ready: false,
          reason:
            "Unverified or single-source claims remain. Human review is required before publication.",
          usesIndependentPathway,
          usesPrimarySourcePathway,
          recommendation: "review-required",
        }
      }
      continue
    }
    if (state === "primary-source supported") {
      usesPrimarySourcePathway = true
      if (!auditId || !primarySourcePathwaySatisfied(fact, auditId)) {
        return {
          ready: false,
          reason:
            "Primary-source claims require valid human confirmation on the current audit before publication.",
          usesIndependentPathway,
          usesPrimarySourcePathway,
          recommendation: "review-required",
        }
      }
      continue
    }
    return {
      ready: false,
      reason:
        "Unverified or single-source claims remain. Human review is required before publication.",
      usesIndependentPathway,
      usesPrimarySourcePathway,
      recommendation: "review-required",
    }
  }

  if (usesIndependentPathway) {
    if (
      typeof input.consensusScore !== "number" ||
      input.consensusScore < PUBLISH_READY_CONSENSUS_SCORE ||
      typeof input.averageVerificationScore !== "number" ||
      input.averageVerificationScore < PUBLISH_READY_CONSENSUS_SCORE
    ) {
      return {
        ready: false,
        reason: "Current research audit is not publish-ready.",
        usesIndependentPathway,
        usesPrimarySourcePathway,
        recommendation: "review-required",
      }
    }
  }

  return {
    ready: true,
    reason: null,
    usesIndependentPathway,
    usesPrimarySourcePathway,
    recommendation: PUBLISH_READY_RECOMMENDATION,
  }
}

export function recommendationAfterPrimarySourceConfirmations(input: {
  auditId: string
  specificationVersion?: unknown
  consensusScore?: unknown
  sourceQualityScore?: unknown
  averageVerificationScore?: unknown
  facts: PrimarySourceEligibleFact[]
}): typeof PUBLISH_READY_RECOMMENDATION | "review-required" {
  return evaluateEvReg11PublicationEligibility(input).recommendation
}
