/**
 * EV-EDITORIAL-07-P0U — presentation helpers for Director prepare outcomes.
 * Pure UI/contract helpers; no publishing side effects.
 */

export type DirectorPrepareOutcome =
  | "ready_for_human_review"
  | "hold"
  | "already_applied"
  | "failed"

export type DirectorPrepareSideEffects = {
  approved: boolean
  scheduled: boolean
  published: boolean
  socialDistributed: boolean
  featuredImageGenerated: boolean
}

export const DIRECTOR_PREPARE_FORBIDDEN_SIDE_EFFECTS: DirectorPrepareSideEffects =
  {
    approved: false,
    scheduled: false,
    published: false,
    socialDistributed: false,
    featuredImageGenerated: false,
  }

export function directorPrepareReviewPath(articleId: string): string {
  return `/admin/articles/${encodeURIComponent(articleId)}/edit`
}

export function describeDirectorPrepareOutcome(
  outcome: DirectorPrepareOutcome | string | null | undefined,
): string {
  switch (outcome) {
    case "ready_for_human_review":
      return "Preparation complete. The article is ready for Director review."
    case "already_applied":
      return "Preparation already applied. The article is awaiting Director review."
    case "hold":
      return "Preparation placed on HOLD. Resolve the listed reason, then retry if permitted."
    case "failed":
      return "Preparation failed. Review the error before retrying."
    default:
      return "Preparation finished with an unrecognised outcome."
  }
}

/** Safe retry only for recoverable HOLD / transient prepare failure. */
export function canRetryDirectorPrepare(result: {
  ok?: boolean
  outcome?: string | null
  code?: string | null
}): boolean {
  if (result.outcome === "hold") return true
  if (result.outcome === "failed" && result.code === "prepare_failed") {
    return true
  }
  return false
}

export function assertNoDirectorPrepareSideEffects(
  sideEffects: Partial<DirectorPrepareSideEffects> | null | undefined,
): boolean {
  if (!sideEffects) return true
  return (
    sideEffects.approved !== true &&
    sideEffects.scheduled !== true &&
    sideEffects.published !== true &&
    sideEffects.socialDistributed !== true &&
    sideEffects.featuredImageGenerated !== true
  )
}
