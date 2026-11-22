/**
 * EV-EDITORIAL-07-P3 — queue grouping for the Director Decision Board.
 */
import { EDITORIAL_STAGE_HOLD_ACTION } from "./editorial-stage-runner"
import { buildEditorialDecisionBoard } from "./editorial-decision-board"

export type DirectorQueueArticle = {
  id: string
  title: string
  slug: string
  category: string
  status: string
  featuredImage: string | null
  approvedAt?: Date | string | null
  scheduledFor?: Date | string | null
  publishedAt?: Date | string | null
  updatedAt?: Date | string | null
  researchAudits?: Array<{
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
    createdAt?: Date | string
  }>
  reviewNotes?: Array<{ action: string; note: string | null }>
  socialPosts?: Array<{ id: string; platform: string; status: string }>
}

export type DirectorQueueBucket =
  | "preparing"
  | "review_ready"
  | "hold"
  | "approved"
  | "scheduled"
  | "published"
  | "failed"
  | "suggested"

export type DirectorQueueItem = {
  articleId: string
  title: string
  slug: string
  category: string
  status: string
  bucket: DirectorQueueBucket
  href: string
  featuredImage: boolean
  holdReason: string | null
  auditSummary: string | null
  socialDraftCount: number
  socialApprovedCount: number
}

function latestAudit(article: DirectorQueueArticle) {
  return article.researchAudits?.[0] ?? null
}

function holdReason(article: DirectorQueueArticle): string | null {
  const note = [...(article.reviewNotes || [])]
    .reverse()
    .find((row) => row.action === EDITORIAL_STAGE_HOLD_ACTION)
  return note?.note || null
}

export function classifyDirectorQueueBucket(
  article: DirectorQueueArticle,
): DirectorQueueBucket {
  if (article.status === "published") return "published"
  if (article.status === "scheduled") return "scheduled"
  if (article.status === "approved") return "approved"
  if (holdReason(article)) return "hold"

  if (article.status === "draft") return "preparing"

  if (article.status === "review-required" || article.status === "review") {
    const audit = latestAudit(article)
    if (!audit) return "preparing"
    const board = buildEditorialDecisionBoard(audit)
    if (board.blockers.some((b) => /unsupported|HOLD|incomplete/i.test(b))) {
      return "hold"
    }
    return "review_ready"
  }

  if (article.status === "rejected") return "failed"
  return "suggested"
}

export function buildDirectorDecisionQueue(
  articles: DirectorQueueArticle[],
): DirectorQueueItem[] {
  return articles.map((article) => {
    const audit = latestAudit(article)
    const board = buildEditorialDecisionBoard(audit)
    const social = article.socialPosts || []
    return {
      articleId: article.id,
      title: article.title,
      slug: article.slug,
      category: article.category,
      status: article.status,
      bucket: classifyDirectorQueueBucket(article),
      href: `/admin/articles/${article.id}/edit`,
      featuredImage: Boolean(article.featuredImage),
      holdReason: holdReason(article),
      auditSummary: audit
        ? `${board.recommendation} · consensus ${audit.consensusScore ?? "n/a"}`
        : null,
      socialDraftCount: social.filter((p) => p.status === "draft").length,
      socialApprovedCount: social.filter(
        (p) => p.status === "approved" || p.status === "published",
      ).length,
    }
  })
}

export function groupDirectorDecisionQueue(items: DirectorQueueItem[]) {
  const groups: Record<DirectorQueueBucket, DirectorQueueItem[]> = {
    suggested: [],
    preparing: [],
    review_ready: [],
    hold: [],
    approved: [],
    scheduled: [],
    published: [],
    failed: [],
  }
  for (const item of items) {
    groups[item.bucket].push(item)
  }
  return groups
}
