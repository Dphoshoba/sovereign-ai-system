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
}

function isFiniteScore(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
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

  if (consensusReady && qualityReady && recommendationReady) return null

  return "Current research audit is not publish-ready."
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
