/**
 * EV-BIBLE-AUTHORITY-001 Category B / L2 pastoral publication eligibility.
 *
 * Category B (biblical interpretation / pastoral teaching) is evaluated under
 * Director pastoral authority (L2). Documented article approval satisfies that
 * human gate without inventing primary-source status, fabricating scores, or
 * requiring a quote rewrite of pastoral paraphrase.
 *
 * Callers: lib/publishing/publication-guard.ts
 * Scores and audit.publicationRecommendation are never mutated here.
 */
import {
  classifyBiblicalClaimCategory,
  isBiblicalTeachingArticle,
} from "./biblical-editorial-evidence-profile"
import {
  claimAssertsNonPrimaryOutcomes,
  independentPathwaySatisfied,
  isEvReg110Audit,
  primarySourcePathwaySatisfied,
  resolveEvidenceState,
  type PrimarySourceEligibleFact,
} from "./primary-source-publication"
import { PUBLISH_READY_SOURCE_QUALITY_SCORE } from "./consensus-engine"

export type BiblicalPastoralPublicationContext = {
  articleStatus?: unknown
  approvedAt?: unknown
  approvedBy?: unknown
  category?: string | null
  content?: string | null
  sourceTypes?: Array<string | null | undefined>
}

export type BiblicalPastoralEligibilityResult = {
  ready: boolean
  reason: string | null
  usesPastoralL2Pathway: boolean
}

function asFacts(facts: unknown): PrimarySourceEligibleFact[] {
  if (!Array.isArray(facts)) return []
  return facts.filter(
    (row): row is PrimarySourceEligibleFact =>
      Boolean(row) && typeof row === "object",
  )
}

function hasDocumentedPastoralApproval(
  ctx: BiblicalPastoralPublicationContext,
): boolean {
  if (ctx.articleStatus !== "approved" && ctx.articleStatus !== "scheduled") {
    return false
  }
  if (typeof ctx.approvedBy !== "string" || !ctx.approvedBy.trim()) return false
  if (ctx.approvedAt == null || ctx.approvedAt === "") return false
  return true
}

/**
 * A scored fact may pass under L2 pastoral approval when it is Category B
 * pastoral/interpretive (or a partially-supported biblical paraphrase that is
 * not Category C / non-primary outcome), with human review still required by
 * the verifier — satisfied by documented Director approve, not by inventing
 * primary-source confirmation.
 */
export function pastoralL2FactSatisfied(
  fact: PrimarySourceEligibleFact,
): boolean {
  const claim = typeof fact.claim === "string" ? fact.claim.trim() : ""
  if (!claim) return false
  if (claimAssertsNonPrimaryOutcomes(claim)) return false

  const category = classifyBiblicalClaimCategory(claim)
  if (category === "C") return false

  const state = resolveEvidenceState(fact)
  if (state === "unsupported" || state === "disputed" || state === "unknown") {
    return false
  }
  if (state === "independently corroborated") {
    return independentPathwaySatisfied(fact)
  }
  if (state === "primary-source supported") {
    // Category A exclusive-primary still needs §9 confirm — not L2 alone.
    return false
  }
  // partially supported: Category A must not sneak through without §9;
  // Category B pastoral paraphrase is the L2 pathway.
  if (state !== "partially supported") return false
  if (category === "A") return false
  return category === "B"
}

export function evaluateBiblicalPastoralPublicationEligibility(input: {
  audit: {
    id?: unknown
    specificationVersion?: unknown
    sourceQualityScore?: unknown
    unverifiedCount?: unknown
    facts?: unknown
  }
  context: BiblicalPastoralPublicationContext
}): BiblicalPastoralEligibilityResult {
  if (!isEvReg110Audit(input.audit.specificationVersion)) {
    return {
      ready: false,
      reason: "Pastoral L2 pathway requires an EV-REG-SPEC-1.1.0 audit.",
      usesPastoralL2Pathway: false,
    }
  }
  if (
    !isBiblicalTeachingArticle({
      category: input.context.category,
      sourceTypes: input.context.sourceTypes,
      content: input.context.content,
    })
  ) {
    return {
      ready: false,
      reason: "Pastoral L2 pathway applies only to biblical teaching articles.",
      usesPastoralL2Pathway: false,
    }
  }
  if (!hasDocumentedPastoralApproval(input.context)) {
    return {
      ready: false,
      reason:
        "Pastoral L2 pathway requires documented Director/editor article approval.",
      usesPastoralL2Pathway: false,
    }
  }
  if (
    typeof input.audit.sourceQualityScore !== "number" ||
    !Number.isFinite(input.audit.sourceQualityScore) ||
    input.audit.sourceQualityScore < PUBLISH_READY_SOURCE_QUALITY_SCORE
  ) {
    return {
      ready: false,
      reason: "Source quality is below the publication threshold.",
      usesPastoralL2Pathway: true,
    }
  }
  if (
    typeof input.audit.unverifiedCount === "number" &&
    input.audit.unverifiedCount > 0
  ) {
    return {
      ready: false,
      reason:
        "Unverified claims remain. Human review is required before publication.",
      usesPastoralL2Pathway: true,
    }
  }

  const facts = asFacts(input.audit.facts)
  if (facts.length === 0) {
    return {
      ready: false,
      reason: "Versioned audit facts are missing.",
      usesPastoralL2Pathway: true,
    }
  }

  const auditId = typeof input.audit.id === "string" ? input.audit.id : ""
  let sawPastoralPartial = false

  for (const fact of facts) {
    const state = resolveEvidenceState(fact)
    if (state === "independently corroborated") {
      if (!independentPathwaySatisfied(fact)) {
        return {
          ready: false,
          reason:
            "Unverified or single-source claims remain. Human review is required before publication.",
          usesPastoralL2Pathway: true,
        }
      }
      continue
    }
    if (state === "primary-source supported") {
      if (!auditId || !primarySourcePathwaySatisfied(fact, auditId)) {
        return {
          ready: false,
          reason:
            "Primary-source claims require valid human confirmation on the current audit before publication.",
          usesPastoralL2Pathway: true,
        }
      }
      continue
    }
    if (pastoralL2FactSatisfied(fact)) {
      sawPastoralPartial = true
      continue
    }
    return {
      ready: false,
      reason:
        "Claim is not eligible under Category B pastoral L2 approval or a confirmed scripture pathway.",
      usesPastoralL2Pathway: true,
    }
  }

  if (!sawPastoralPartial) {
    // Pure Category A / independent mixes use existing pathways, not this one.
    return {
      ready: false,
      reason:
        "No Category B pastoral claims present for the L2 pastoral pathway.",
      usesPastoralL2Pathway: false,
    }
  }

  return {
    ready: true,
    reason: null,
    usesPastoralL2Pathway: true,
  }
}
