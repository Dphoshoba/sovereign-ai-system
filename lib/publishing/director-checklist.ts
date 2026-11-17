import {
  inspectFeaturedImagePromptState,
  type FeaturedImagePromptArticle,
} from "../ai/featured-image-prompt"
import { researchPublicationBlockReason } from "./publication-guard"
import {
  canShowImmediatePublishAction,
  canShowPrepareForReviewAction,
  canShowScheduleAction,
  hasApprovalMetadata,
  publicationReadinessMessage,
} from "./article-action-visibility"
import { resolveArticleAuditState } from "../research/current-article-audit"
import type {
  ArticleAuditAssociationNote,
  AssociatedAudit,
} from "../research/article-audit-association"
import type { StoredArticleSource } from "../research/article-source-links"

function canApproveWithCurrentAudit(status: string, hasCurrentAudit: boolean) {
  return (
    (status === "review-required" || status === "review") && hasCurrentAudit
  )
}

export const DIRECTOR_CHECKLIST_STEP_IDS = [
  "generate_research",
  "audit_verification",
  "human_approval",
  "featured_image",
  "publication",
  "social_distribution",
] as const

export type DirectorChecklistStepId =
  (typeof DIRECTOR_CHECKLIST_STEP_IDS)[number]

export type DirectorChecklistStepState =
  | "complete"
  | "action_required"
  | "blocked"
  | "not_started"

export type DirectorChecklistSocialPost = {
  id: string
  platform: string
  status: string
  publishedAt?: Date | string | null
}

export type DirectorChecklistArticle = FeaturedImagePromptArticle & {
  title: string
  slug: string
  approvedAt?: Date | string | null
  approvedBy?: string | null
  publishedAt?: Date | string | null
  scheduledFor?: Date | string | null
  researchSources?: StoredArticleSource[] | null
  researchAudits: Array<
    AssociatedAudit & {
      consensusScore?: number | null
      sourceQualityScore?: number | null
      publicationRecommendation?: string | null
    }
  >
  reviewNotes: Array<ArticleAuditAssociationNote & { action: string; note: string | null }>
  socialPosts: DirectorChecklistSocialPost[]
}

export type DirectorChecklistStep = {
  id: DirectorChecklistStepId
  label: string
  state: DirectorChecklistStepState
  detail: string
  href: string
  evidence: Record<string, string | number | boolean | null | undefined>
}

export type DirectorChecklist = {
  articleId: string
  title: string
  slug: string
  articleStatus: string
  steps: DirectorChecklistStep[]
  nextAction: DirectorChecklistStep | null
}

const STEP_LABELS: Record<DirectorChecklistStepId, string> = {
  generate_research: "Generate / research",
  audit_verification: "Audit / verification",
  human_approval: "Human approval",
  featured_image: "Featured image",
  publication: "Publication",
  social_distribution: "Social distribution",
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(typeof value === "string" && value.trim())
}

function editHref(articleId: string) {
  return `/admin/articles/${articleId}/edit`
}

function auditHref(articleId: string) {
  return `/admin/articles/${articleId}/audit`
}

function socialHref(status?: string) {
  return status ? `/admin/social?status=${encodeURIComponent(status)}` : "/admin/social"
}

function twitterPosts(posts: DirectorChecklistSocialPost[]) {
  return posts.filter((post) => post.platform.toLowerCase() === "twitter")
}

/**
 * Derive Director checklist state from authoritative article, audit,
 * approval, featured-image, and social records. Does not invent completion.
 */
export function buildDirectorChecklist(
  article: DirectorChecklistArticle,
): DirectorChecklist {
  const { currentAudit, historicalAudits } = resolveArticleAuditState(article)
  const hasCurrentAudit = Boolean(currentAudit)
  const hasFeaturedImage = hasText(article.featuredImage)
  const sourceCount = Array.isArray(article.researchSources)
    ? article.researchSources.length
    : 0
  const hasContent = hasText(article.content)
  const approvalReady = hasApprovalMetadata(article.approvedAt, article.approvedBy)
  const publishReadyAudit =
    hasCurrentAudit && researchPublicationBlockReason(currentAudit) === null
  const featuredPrompt = inspectFeaturedImagePromptState(article)
  const promptStatus = featuredPrompt.promptStatus
  const promptCurrent = promptStatus === "current"
  const xPosts = twitterPosts(article.socialPosts)
  const xPublished = xPosts.filter((post) => post.status === "published")
  const xApproved = xPosts.filter((post) => post.status === "approved")
  const xReview = xPosts.filter((post) => post.status === "review-required")
  const xPublishing = xPosts.filter((post) => post.status === "publishing")

  const visibility = {
    status: article.status,
    hasCurrentAudit,
    approvedAt: article.approvedAt,
    approvedBy: article.approvedBy,
    hasFeaturedImage,
  }

  const generateStep: DirectorChecklistStep = (() => {
    if (hasContent && (sourceCount > 0 || article.researchAudits.length > 0)) {
      return {
        id: "generate_research",
        label: STEP_LABELS.generate_research,
        state: "complete",
        detail: "Article content exists with research sources or audits on record.",
        href: editHref(article.id),
        evidence: {
          hasContent: true,
          sourceCount,
          auditCount: article.researchAudits.length,
        },
      }
    }
    if (hasContent) {
      return {
        id: "generate_research",
        label: STEP_LABELS.generate_research,
        state: "action_required",
        detail:
          "Article content exists without research sources or audits. Use Prepare for Review or regenerate via AI Generator.",
        href: editHref(article.id),
        evidence: {
          hasContent: true,
          sourceCount: 0,
          auditCount: 0,
        },
      }
    }
    return {
      id: "generate_research",
      label: STEP_LABELS.generate_research,
      state: "not_started",
      detail: "No article content yet. Create via AI Generator.",
      href: "/admin/ai-generator",
      evidence: {
        hasContent: false,
        sourceCount,
        auditCount: article.researchAudits.length,
      },
    }
  })()

  const auditStep: DirectorChecklistStep = (() => {
    if (hasCurrentAudit) {
      return {
        id: "audit_verification",
        label: STEP_LABELS.audit_verification,
        state: "complete",
        detail: publishReadyAudit
          ? "Current research audit matches this revision and is publish-ready."
          : "Current research audit matches this revision; recommendation is not publish-ready.",
        href: auditHref(article.id),
        evidence: {
          hasCurrentAudit: true,
          publishReadyAudit,
          consensusScore: currentAudit?.consensusScore ?? null,
          sourceQualityScore: currentAudit?.sourceQualityScore ?? null,
          publicationRecommendation:
            currentAudit?.publicationRecommendation ?? null,
          historicalAuditCount: historicalAudits.length,
        },
      }
    }
    if (
      canShowPrepareForReviewAction({
        status: article.status,
        hasCurrentAudit,
      })
    ) {
      return {
        id: "audit_verification",
        label: STEP_LABELS.audit_verification,
        state: "action_required",
        detail:
          historicalAudits.length > 0
            ? "No current audit for this content revision. Run Prepare for Review."
            : "No research audit on record. Run Prepare for Review.",
        href: editHref(article.id),
        evidence: {
          hasCurrentAudit: false,
          historicalAuditCount: historicalAudits.length,
        },
      }
    }
    return {
      id: "audit_verification",
      label: STEP_LABELS.audit_verification,
      state: historicalAudits.length > 0 ? "blocked" : "not_started",
      detail:
        historicalAudits.length > 0
          ? "Historical audits exist but none are current for this revision."
          : "Audit has not started.",
      href: auditHref(article.id),
      evidence: {
        hasCurrentAudit: false,
        historicalAuditCount: historicalAudits.length,
        articleStatus: article.status,
      },
    }
  })()

  const approvalStep: DirectorChecklistStep = (() => {
    if (
      (article.status === "approved" ||
        article.status === "scheduled" ||
        article.status === "published") &&
      approvalReady
    ) {
      return {
        id: "human_approval",
        label: STEP_LABELS.human_approval,
        state: "complete",
        detail: `Approved by ${String(article.approvedBy)}.`,
        href: editHref(article.id),
        evidence: {
          articleStatus: article.status,
          approvedBy: String(article.approvedBy),
          approvedAt:
            article.approvedAt instanceof Date
              ? article.approvedAt.toISOString()
              : article.approvedAt
                ? String(article.approvedAt)
                : null,
        },
      }
    }
    if (canApproveWithCurrentAudit(article.status, hasCurrentAudit)) {
      return {
        id: "human_approval",
        label: STEP_LABELS.human_approval,
        state: "action_required",
        detail: "Current audit is present. Human approval is required before featured-image and publish steps.",
        href: editHref(article.id),
        evidence: {
          articleStatus: article.status,
          hasCurrentAudit: true,
        },
      }
    }
    if (article.status === "review-required" || article.status === "review") {
      return {
        id: "human_approval",
        label: STEP_LABELS.human_approval,
        state: "blocked",
        detail: "Approval stays blocked until a current research audit exists.",
        href: editHref(article.id),
        evidence: {
          articleStatus: article.status,
          hasCurrentAudit: false,
        },
      }
    }
    return {
      id: "human_approval",
      label: STEP_LABELS.human_approval,
      state: "not_started",
      detail: "Human approval has not started.",
      href: editHref(article.id),
      evidence: {
        articleStatus: article.status,
        hasCurrentAudit,
      },
    }
  })()

  const featuredStep: DirectorChecklistStep = (() => {
    if (hasFeaturedImage && promptCurrent) {
      return {
        id: "featured_image",
        label: STEP_LABELS.featured_image,
        state: "complete",
        detail: "Current featured-image prompt is approved and an image is stored.",
        href: editHref(article.id),
        evidence: {
          hasFeaturedImage: true,
          promptStatus,
        },
      }
    }
    if (hasFeaturedImage && !promptCurrent) {
      return {
        id: "featured_image",
        label: STEP_LABELS.featured_image,
        state: "action_required",
        detail:
          "Featured image exists, but there is no current approved prompt for this content fingerprint.",
        href: editHref(article.id),
        evidence: {
          hasFeaturedImage: true,
          promptStatus,
        },
      }
    }
    if (article.status !== "approved" && article.status !== "scheduled" && article.status !== "published") {
      return {
        id: "featured_image",
        label: STEP_LABELS.featured_image,
        state: article.status === "review-required" || article.status === "review"
          ? "blocked"
          : "not_started",
        detail:
          "Featured-image prompt approval stays blocked until the article is approved.",
        href: editHref(article.id),
        evidence: {
          hasFeaturedImage: false,
          promptStatus,
          articleStatus: article.status,
        },
      }
    }
    if (!promptCurrent) {
      return {
        id: "featured_image",
        label: STEP_LABELS.featured_image,
        state: "action_required",
        detail:
          promptStatus === "historical-stale"
            ? "Approved prompt is stale for this fingerprint. Re-approve, then generate."
            : "Approve a featured-image prompt, then generate the image.",
        href: editHref(article.id),
        evidence: {
          hasFeaturedImage: false,
          promptStatus,
        },
      }
    }
    return {
      id: "featured_image",
      label: STEP_LABELS.featured_image,
      state: "action_required",
      detail: "Current prompt is approved. Generate the featured image.",
      href: editHref(article.id),
      evidence: {
        hasFeaturedImage: false,
        promptStatus,
      },
    }
  })()

  const publicationStep: DirectorChecklistStep = (() => {
    if (article.status === "published") {
      return {
        id: "publication",
        label: STEP_LABELS.publication,
        state: "complete",
        detail: "Article is published.",
        href: editHref(article.id),
        evidence: {
          articleStatus: article.status,
          publishedAt:
            article.publishedAt instanceof Date
              ? article.publishedAt.toISOString()
              : article.publishedAt
                ? String(article.publishedAt)
                : null,
        },
      }
    }
    if (article.status === "scheduled") {
      return {
        id: "publication",
        label: STEP_LABELS.publication,
        state: "action_required",
        detail: "Article is scheduled. Waiting for due publish or package controls.",
        href: editHref(article.id),
        evidence: {
          articleStatus: article.status,
          scheduledFor:
            article.scheduledFor instanceof Date
              ? article.scheduledFor.toISOString()
              : article.scheduledFor
                ? String(article.scheduledFor)
                : null,
        },
      }
    }
    if (canShowImmediatePublishAction(visibility) || canShowScheduleAction(visibility)) {
      return {
        id: "publication",
        label: STEP_LABELS.publication,
        state: "action_required",
        detail: "Article is approved and publication controls are available.",
        href: editHref(article.id),
        evidence: {
          articleStatus: article.status,
          canPublish: canShowImmediatePublishAction(visibility),
          canSchedule: canShowScheduleAction(visibility),
        },
      }
    }
    if (article.status === "approved") {
      return {
        id: "publication",
        label: STEP_LABELS.publication,
        state: "blocked",
        detail:
          publicationReadinessMessage(visibility) ??
          "Publication stays blocked until readiness requirements are met.",
        href: editHref(article.id),
        evidence: {
          articleStatus: article.status,
          hasCurrentAudit,
          hasFeaturedImage,
          approvalReady,
        },
      }
    }
    return {
      id: "publication",
      label: STEP_LABELS.publication,
      state: "not_started",
      detail: "Publication starts after human approval.",
      href: `/admin/articles?status=${encodeURIComponent(article.status)}`,
      evidence: {
        articleStatus: article.status,
      },
    }
  })()

  const socialStep: DirectorChecklistStep = (() => {
    if (xPublished.length > 0) {
      return {
        id: "social_distribution",
        label: STEP_LABELS.social_distribution,
        state: "complete",
        detail: `X/Twitter post published (${xPublished.length}).`,
        href: socialHref("published"),
        evidence: {
          twitterPublishedCount: xPublished.length,
          twitterApprovedCount: xApproved.length,
          twitterReviewCount: xReview.length,
          socialPostCount: article.socialPosts.length,
        },
      }
    }
    if (xPublishing.length > 0) {
      return {
        id: "social_distribution",
        label: STEP_LABELS.social_distribution,
        state: "action_required",
        detail:
          "X/Twitter publish claim is in progress. Do not retry automatically; review operational events first.",
        href: socialHref(),
        evidence: {
          twitterPublishingCount: xPublishing.length,
          socialPostCount: article.socialPosts.length,
        },
      }
    }
    if (article.status !== "published") {
      return {
        id: "social_distribution",
        label: STEP_LABELS.social_distribution,
        state:
          article.socialPosts.length > 0
            ? "blocked"
            : "not_started",
        detail:
          "X/Twitter publishing requires a published article. Social drafts may still be reviewed earlier.",
        href: socialHref(
          xReview.length > 0
            ? "review-required"
            : xApproved.length > 0
              ? "approved"
              : undefined,
        ),
        evidence: {
          articleStatus: article.status,
          socialPostCount: article.socialPosts.length,
          twitterPublishedCount: 0,
        },
      }
    }
    if (xApproved.length > 0) {
      return {
        id: "social_distribution",
        label: STEP_LABELS.social_distribution,
        state: "action_required",
        detail: "Approved X/Twitter post is ready to publish.",
        href: socialHref("approved"),
        evidence: {
          twitterApprovedCount: xApproved.length,
          twitterReviewCount: xReview.length,
        },
      }
    }
    if (xReview.length > 0 || article.socialPosts.length > 0) {
      return {
        id: "social_distribution",
        label: STEP_LABELS.social_distribution,
        state: "action_required",
        detail: "Social posts need review/approval before X publish.",
        href: socialHref("review-required"),
        evidence: {
          twitterReviewCount: xReview.length,
          socialPostCount: article.socialPosts.length,
        },
      }
    }
    return {
      id: "social_distribution",
      label: STEP_LABELS.social_distribution,
      state: "not_started",
      detail: "No social posts linked to this article yet.",
      href: "/admin/social",
      evidence: {
        socialPostCount: 0,
        twitterPublishedCount: 0,
      },
    }
  })()

  const steps = [
    generateStep,
    auditStep,
    approvalStep,
    featuredStep,
    publicationStep,
    socialStep,
  ]

  const nextAction =
    steps.find(
      (step) => step.state === "action_required" || step.state === "blocked",
    ) ?? null

  return {
    articleId: article.id,
    title: article.title,
    slug: article.slug,
    articleStatus: article.status,
    steps,
    nextAction,
  }
}
