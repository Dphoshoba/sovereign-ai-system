/**
 * Behaviour: editorial decision board view-model for audit UI blockers/summary.
 * Callers: app/admin/articles/ArticleAuditPanel.tsx / Director Decision Board.
 */
import {
  evaluateEvReg11PublicationEligibility,
  isEvReg110Audit,
  resolveEvidenceState,
  type PrimarySourceEligibleFact,
} from "../research/primary-source-publication"

export type EditorialDecisionBoardAudit = {
  id: string
  publicationRecommendation?: string | null
  consensusScore?: number | null
  sourceQualityScore?: number | null
  averageVerificationScore?: number | null
  verifiedCount?: number | null
  partiallyVerifiedCount?: number | null
  unverifiedCount?: number | null
  specificationVersion?: string | null
  facts?: unknown
}

export type EditorialDecisionBoardView = {
  publicationPermitted: boolean
  recommendation: string
  canApproveWorkflow: boolean
  decisionRequired: string
  blockers: string[]
  summaryLines: string[]
  usesPrimarySourcePathway: boolean
  usesIndependentPathway: boolean
}

function asFacts(facts: unknown): PrimarySourceEligibleFact[] {
  if (!Array.isArray(facts)) return []
  return facts.filter(
    (row): row is PrimarySourceEligibleFact =>
      Boolean(row) && typeof row === "object",
  )
}

function countEvidenceStates(
  facts: PrimarySourceEligibleFact[],
  auditId: string,
): {
  independent: number
  primaryConfirmed: number
  primaryUnconfirmed: number
  partial: number
  unsupported: number
} {
  let independent = 0
  let primaryConfirmed = 0
  let primaryUnconfirmed = 0
  let partial = 0
  let unsupported = 0
  for (const fact of facts) {
    const state = resolveEvidenceState(fact)
    if (state === "independently corroborated") {
      independent += 1
      continue
    }
    if (state === "primary-source supported") {
      const conf = fact.primarySourceConfirmation
      const confirmed =
        conf &&
        typeof conf === "object" &&
        (conf as { decision?: unknown }).decision === "confirmed" &&
        (conf as { auditId?: unknown }).auditId === auditId
      if (confirmed) primaryConfirmed += 1
      else primaryUnconfirmed += 1
      continue
    }
    if (state === "partially supported") {
      partial += 1
      continue
    }
    unsupported += 1
  }
  return {
    independent,
    primaryConfirmed,
    primaryUnconfirmed,
    partial,
    unsupported,
  }
}

export function buildEditorialDecisionBoard(
  audit: EditorialDecisionBoardAudit | null | undefined,
): EditorialDecisionBoardView {
  if (!audit) {
    return {
      publicationPermitted: false,
      recommendation: "missing-audit",
      canApproveWorkflow: false,
      decisionRequired: "Run preparation to create a current research audit.",
      blockers: ["No current research audit"],
      summaryLines: ["No audit available for Director decision."],
      usesPrimarySourcePathway: false,
      usesIndependentPathway: false,
    }
  }

  const recommendation = String(audit.publicationRecommendation || "review")
  const facts = asFacts(audit.facts)
  const counts = countEvidenceStates(facts, audit.id)
  const blockers: string[] = []
  const summaryLines: string[] = [
    `Recommendation: ${recommendation}`,
    `Consensus: ${audit.consensusScore ?? "n/a"} · Source quality: ${audit.sourceQualityScore ?? "n/a"}`,
    `Verified ${audit.verifiedCount ?? 0} · Partial ${audit.partiallyVerifiedCount ?? 0} · Unverified ${audit.unverifiedCount ?? 0}`,
  ]

  const usesPrimarySourcePathway = isEvReg110Audit(audit.specificationVersion)
  let publicationPermitted = false

  if (usesPrimarySourcePathway) {
    const eligibility = evaluateEvReg11PublicationEligibility({
      auditId: audit.id,
      specificationVersion: audit.specificationVersion,
      consensusScore: audit.consensusScore,
      sourceQualityScore: audit.sourceQualityScore,
      averageVerificationScore: audit.averageVerificationScore,
      publicationRecommendation: audit.publicationRecommendation,
      facts,
    })
    publicationPermitted = eligibility.ready
    if (!eligibility.ready && eligibility.reason) blockers.push(eligibility.reason)
  } else {
    publicationPermitted = recommendation === "publish-ready"
    if (!publicationPermitted) {
      blockers.push("Current research audit is not publish-ready.")
    }
  }

  if (counts.unsupported > 0) {
    blockers.push(`${counts.unsupported} unsupported claim(s) remain.`)
  }
  if (counts.primaryUnconfirmed > 0) {
    blockers.push(
      `${counts.primaryUnconfirmed} primary-source claim(s) await Director confirmation.`,
    )
  }

  summaryLines.push(
    `Evidence states — independent ${counts.independent}, primary confirmed ${counts.primaryConfirmed}, primary unconfirmed ${counts.primaryUnconfirmed}, partial ${counts.partial}, unsupported ${counts.unsupported}.`,
  )

  return {
    publicationPermitted,
    recommendation,
    canApproveWorkflow: recommendation !== "blocked",
    decisionRequired: publicationPermitted
      ? "Director may approve when lifecycle gates are satisfied."
      : "Resolve blockers or approve for editorial revision only.",
    blockers,
    summaryLines,
    usesPrimarySourcePathway,
    usesIndependentPathway: counts.independent > 0,
  }
}
