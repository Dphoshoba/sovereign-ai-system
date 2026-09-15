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
