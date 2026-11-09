import {
  PUBLISH_READY_CONSENSUS_SCORE,
  PUBLISH_READY_RECOMMENDATION,
  PUBLISH_READY_SOURCE_QUALITY_SCORE,
} from "../research/consensus-engine"

export type ArticlePublishStatus =
  | "draft"
  | "review-required"
  | "approved"
  | "scheduled"
  | "published"
  | "rejected"

export type PublicationGuardResult = {
  allowed: boolean
  status: ArticlePublishStatus | string
  reason: string
}

export type ResearchPublishabilityAudit = {
  consensusScore?: unknown
  sourceQualityScore?: unknown
  publicationRecommendation?: unknown
  unverifiedCount?: unknown
  facts?: unknown
}

function isFiniteScore(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function storedVerificationProblem(
  audit: ResearchPublishabilityAudit,
): "missing" | "insufficient" | null {
  if (typeof audit.unverifiedCount !== "number" || !Array.isArray(audit.facts)) {
    return "missing"
  }
  if (audit.unverifiedCount > 0 || audit.facts.length === 0) {
    return audit.facts.length === 0 ? "missing" : "insufficient"
  }

  for (const fact of audit.facts) {
    if (!fact || typeof fact !== "object") return "missing"
    const record = fact as Record<string, unknown>
    const status = record.verificationStatus
    const method = record.verificationMethod
    const count = record.verificationCount
    const sources = record.supportingSources
    if (status === "unverified" || method === "single-source-supported") {
      return "insufficient"
    }
    if (typeof count === "number" && count < 2) return "insufficient"
    if (status == null || method == null || count == null || sources == null) {
      return "missing"
    }
    if (
      (status !== "verified" && status !== "partially verified") ||
      (method !== "exact" && method !== "semantic") ||
      typeof count !== "number" ||
      count < 2 ||
      !Array.isArray(sources) ||
      sources.length < 2 ||
      sources.some((source) => {
        if (!source || typeof source !== "object") return true
        const url = (source as Record<string, unknown>).sourceUrl
        return typeof url !== "string" || url.length === 0
      })
    ) {
      return "missing"
    }
  }

  return audit.unverifiedCount === 0 ? null : "insufficient"
}

export function researchPublicationBlockReason(
  audit: ResearchPublishabilityAudit | null | undefined,
): string | null {
  if (!audit) {
    return "A current publish-ready research audit is required before scheduling or publication."
  }

  const consensusReady =
    isFiniteScore(audit.consensusScore) &&
    audit.consensusScore >= PUBLISH_READY_CONSENSUS_SCORE
  const qualityReady =
    isFiniteScore(audit.sourceQualityScore) &&
    audit.sourceQualityScore >= PUBLISH_READY_SOURCE_QUALITY_SCORE
  const recommendationReady =
    audit.publicationRecommendation === PUBLISH_READY_RECOMMENDATION

  if (!(consensusReady && qualityReady && recommendationReady)) {
    return "Current research audit is not publish-ready."
  }

  const verificationProblem = storedVerificationProblem(audit)
  if (verificationProblem === "insufficient") {
    return "Unverified or single-source claims remain. Human review is required before publication."
  }
  if (verificationProblem === "missing") {
    return "Independent verification metadata is missing. Renew the research audit or return the article to review before scheduling or publication."
  }

  return null
}

export function publicationGuard(
  status: string,
  auditState: { hasCurrentAudit: boolean },
): PublicationGuardResult {
  if (
    (status === "approved" || status === "scheduled") &&
    !auditState.hasCurrentAudit
  ) {
    return {
      allowed: false,
      status,
      reason:
        "Article requires a current research audit matching this content revision before publishing.",
    }
  }

  if (status === "approved") {
    return {
      allowed: true,
      status,
      reason: "Article is approved for publishing.",
    }
  }

  if (status === "scheduled") {
    return {
      allowed: true,
      status,
      reason: "Article is scheduled and may be published by the scheduler.",
    }
  }

  if (status === "published") {
    return {
      allowed: false,
      status,
      reason: "Article has already been published.",
    }
  }

  if (status === "review-required") {
    return {
      allowed: false,
      status,
      reason: "Article requires human review before publishing.",
    }
  }

  if (status === "rejected") {
    return {
      allowed: false,
      status,
      reason: "Article has been rejected and cannot be published.",
    }
  }

  return {
    allowed: false,
    status,
    reason: "Article must be approved before publishing.",
  }
}
