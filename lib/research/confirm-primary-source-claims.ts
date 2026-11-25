/**
 * Apply human primary-source confirmations on a current EV-REG-SPEC-1.1.0 audit.
 * Does not alter consensus, source-quality, or verification scores.
 *
 * Callers: app/api/articles/confirm-primary-source/route.ts
 * Reads: Article, ArticleResearchAudit.facts/scores, ArticleReviewNote
 * Writes: ArticleResearchAudit.facts + publicationRecommendation only;
 *         ArticleReviewNote action primary-source-confirmation
 * No existing module records per-claim primary-source confirmation.
 *
 * User instruction (verbatim excerpt): "An authorised human editor confirms the
 * exact claim and supporting evidence on the current audit." / "The verifier must
 * retain and report the original consensus, source-quality and verification scores
 * without alteration."
 */
import { prisma } from "@/lib/prisma"
import {
  claimTextChecksum,
  evaluateEvReg11PublicationEligibility,
  isEvReg110Audit,
  resolveEvidenceState,
  type PrimarySourceConfirmation,
  type PrimarySourceEligibleFact,
} from "./primary-source-publication"

export type ConfirmPrimarySourceInput = {
  articleId: string
  auditId: string
  claim: string
  decision: "confirmed" | "declined"
  rationale: string
  actor: string
}

export type ConfirmPrimarySourceResult =
  | {
      ok: true
      audit: {
        id: string
        publicationRecommendation: string | null
        consensusScore: number
        sourceQualityScore: number
        averageVerificationScore: number
        facts: unknown
      }
      alreadyApplied: boolean
    }
  | {
      ok: false
      code:
        | "not_found"
        | "invalid_audit"
        | "claim_not_found"
        | "not_primary_source"
        | "stale_audit"
      error: string
    }

function asFactRows(facts: unknown): PrimarySourceEligibleFact[] {
  if (!Array.isArray(facts)) return []
  return facts.filter(
    (row): row is PrimarySourceEligibleFact =>
      Boolean(row) && typeof row === "object",
  )
}

export async function confirmPrimarySourceClaim(
  input: ConfirmPrimarySourceInput,
): Promise<ConfirmPrimarySourceResult> {
  const article = await prisma.article.findUnique({
    where: { id: input.articleId },
    include: {
      researchAudits: { orderBy: { createdAt: "desc" } },
      reviewNotes: true,
      researchSources: true,
    },
  })
  if (!article) {
    return { ok: false, code: "not_found", error: "Article not found." }
  }

  const audit = article.researchAudits.find((row) => row.id === input.auditId)
  if (!audit) {
    return { ok: false, code: "not_found", error: "Audit not found." }
  }
  if (!isEvReg110Audit(audit.specificationVersion)) {
    return {
      ok: false,
      code: "invalid_audit",
      error: "Primary-source confirmation requires an EV-REG-SPEC-1.1.0 audit.",
    }
  }

  const facts = asFactRows(audit.facts)
  const claim = input.claim.trim()
  const index = facts.findIndex(
    (fact) => typeof fact.claim === "string" && fact.claim === claim,
  )
  if (index < 0) {
    return {
      ok: false,
      code: "claim_not_found",
      error: "Claim was not found on the current audit.",
    }
  }

  const fact = facts[index]
  if (resolveEvidenceState(fact) !== "primary-source supported") {
    return {
      ok: false,
      code: "not_primary_source",
      error: "Only primary-source supported claims can be confirmed on this pathway.",
    }
  }

  const primarySourceUrl =
    typeof fact.sourceUrl === "string" && fact.sourceUrl.trim()
      ? fact.sourceUrl.trim()
      : Array.isArray(fact.supportingSources) &&
          fact.supportingSources[0] &&
          typeof (fact.supportingSources[0] as { sourceUrl?: unknown }).sourceUrl ===
            "string"
        ? String(
            (fact.supportingSources[0] as { sourceUrl: string }).sourceUrl,
          ).trim()
        : ""
  if (!primarySourceUrl) {
    return {
      ok: false,
      code: "not_primary_source",
      error: "Primary-source URL is missing for this claim.",
    }
  }

  const existing = fact.primarySourceConfirmation as
    | PrimarySourceConfirmation
    | undefined
  if (
    existing &&
    existing.decision === input.decision &&
    existing.claimChecksum === claimTextChecksum(claim) &&
    existing.auditId === audit.id
  ) {
    return {
      ok: true,
      alreadyApplied: true,
      audit: {
        id: audit.id,
        publicationRecommendation: audit.publicationRecommendation,
        consensusScore: audit.consensusScore,
        sourceQualityScore: audit.sourceQualityScore,
        averageVerificationScore: audit.averageVerificationScore,
        facts: audit.facts,
      },
    }
  }

  const confirmation: PrimarySourceConfirmation = {
    claimChecksum: claimTextChecksum(claim),
    decision: input.decision,
    decidedBy: input.actor,
    decidedAt: new Date().toISOString(),
    primarySourceUrl,
    rationale: input.rationale.trim() || "Director/editor primary-source confirmation.",
    auditId: audit.id,
  }

  const nextFacts = facts.map((row, i) =>
    i === index ? { ...row, primarySourceConfirmation: confirmation } : row,
  )

  const eligibility = evaluateEvReg11PublicationEligibility({
    auditId: audit.id,
    specificationVersion: audit.specificationVersion,
    consensusScore: audit.consensusScore,
    sourceQualityScore: audit.sourceQualityScore,
    averageVerificationScore: audit.averageVerificationScore,
    facts: nextFacts,
  })

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.articleResearchAudit.update({
      where: { id: audit.id },
      data: {
        facts: nextFacts as object[],
        publicationRecommendation: eligibility.recommendation,
      },
    })
    await tx.articleReviewNote.create({
      data: {
        articleId: article.id,
        action: "primary-source-confirmation",
        reviewer: input.actor,
        note: JSON.stringify({
          auditId: audit.id,
          claim,
          decision: input.decision,
          primarySourceUrl,
          recommendation: eligibility.recommendation,
        }),
      },
    })
    return next
  })

  return {
    ok: true,
    alreadyApplied: false,
    audit: {
      id: updated.id,
      publicationRecommendation: updated.publicationRecommendation,
      consensusScore: updated.consensusScore,
      sourceQualityScore: updated.sourceQualityScore,
      averageVerificationScore: updated.averageVerificationScore,
      facts: updated.facts,
    },
  }
}
