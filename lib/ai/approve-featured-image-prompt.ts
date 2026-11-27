import { lockArticleForGovernance } from "../publishing/article-lifecycle"
import { resolveArticleAuditState } from "../research/current-article-audit"
import {
  FEATURED_IMAGE_PROMPT_APPROVED_ACTION,
  FEATURED_IMAGE_PROMPT_VERSION,
  inspectFeaturedImagePromptState,
  serializeFeaturedImagePromptNote,
  validateFeaturedImagePromptText,
  type FeaturedImagePromptArticle,
  type FeaturedImagePromptFailureCode,
  type SafeFeaturedImagePrompt,
} from "./featured-image-prompt"

type PromptApprovalTransaction = {
  $queryRaw: (
    query: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<unknown>
  article: {
    findUnique: (args: {
      where: { id: string }
      include: {
        researchSources: true
        researchAudits: true
        reviewNotes: true
      }
    }) => Promise<FeaturedImagePromptArticle | null>
  }
  articleReviewNote: {
    create: (args: {
      data: {
        articleId: string
        action: string
        reviewer: string
        note: string
      }
    }) => Promise<{ id: string }>
  }
}

export type FeaturedImagePromptApprovalStore = {
  $transaction: <T>(
    fn: (tx: PromptApprovalTransaction) => Promise<T>,
  ) => Promise<T>
}

export type ApproveFeaturedImagePromptInput = {
  articleId: string
  prompt: unknown
  replace?: unknown
  actor: string
  now?: Date
}

export type ApproveFeaturedImagePromptFailure = {
  ok: false
  code:
    | "not_found"
    | "invalid_prompt"
    | "invalid_status"
    | "missing_audit"
    | "featured_image_already_set"
    | "replacement_required"
    | FeaturedImagePromptFailureCode
  error: string
  articleUnchanged: true
}

export type ApproveFeaturedImagePromptSuccess = {
  ok: true
  alreadyApplied: boolean
  articleUnchanged: boolean
  prompt: SafeFeaturedImagePrompt
  contentFingerprint: string
}

export type ApproveFeaturedImagePromptResult =
  | ApproveFeaturedImagePromptSuccess
  | ApproveFeaturedImagePromptFailure

function failure(
  code: ApproveFeaturedImagePromptFailure["code"],
  error: string,
): ApproveFeaturedImagePromptFailure {
  return { ok: false, code, error, articleUnchanged: true }
}

export async function approveFeaturedImagePrompt(
  input: ApproveFeaturedImagePromptInput,
  deps?: { prisma?: unknown },
): Promise<ApproveFeaturedImagePromptResult> {
  const promptCheck = validateFeaturedImagePromptText(input.prompt)
  if (!promptCheck.ok) {
    return failure(promptCheck.code, promptCheck.error)
  }

  if (input.replace !== undefined && typeof input.replace !== "boolean") {
    return failure(
      "invalid_prompt",
      "replace must be an explicit boolean when provided.",
    )
  }

  const replace = input.replace === true
  const store = (deps?.prisma ??
    (await import("@/lib/prisma")).prisma) as FeaturedImagePromptApprovalStore
  const now = input.now ?? new Date()
  const actor = input.actor.trim()
  if (!actor) {
    return failure("invalid_status", "Authenticated administrator identity is required.")
  }

  return store.$transaction(async (tx) => {
    await lockArticleForGovernance(tx, input.articleId)
    const article = await tx.article.findUnique({
      where: { id: input.articleId },
      include: {
        researchSources: true,
        researchAudits: true,
        reviewNotes: true,
      },
    })

    if (!article) {
      return failure("not_found", "Article not found.")
    }

    if (article.status !== "approved") {
      return failure(
        "invalid_status",
        "Only an approved article can receive a featured-image prompt approval.",
      )
    }

    if (article.featuredImage) {
      return failure(
        "featured_image_already_set",
        "A featured image already exists. This first-image prompt workflow requires featuredImage to be null.",
      )
    }

    if (!resolveArticleAuditState(article).currentAudit) {
      return failure(
        "missing_audit",
        "A current research audit matching this content revision is required.",
      )
    }

    const inspected = inspectFeaturedImagePromptState(article)
    if (!inspected.ok && inspected.code === "cross_article_featured_image_prompt") {
      return failure(inspected.code, inspected.error)
    }
    if (!inspected.ok && inspected.code === "ambiguous_featured_image_prompt") {
      return failure(inspected.code, inspected.error)
    }

    const contentFingerprint = inspected.contentFingerprint
    const current = inspected.ok ? inspected.current : null

    if (current && current.prompt === promptCheck.prompt) {
      return {
        ok: true as const,
        alreadyApplied: true,
        articleUnchanged: true,
        prompt: current,
        contentFingerprint,
      }
    }

    if (current && current.prompt !== promptCheck.prompt && !replace) {
      return failure(
        "replacement_required",
        "A current featured-image prompt is already approved. Pass replace: true to create a new approval note.",
      )
    }

    const approvedAt = now.toISOString()
    const payload = {
      version: FEATURED_IMAGE_PROMPT_VERSION,
      articleId: article.id,
      contentFingerprint,
      prompt: promptCheck.prompt,
      approvedAt,
      approvedBy: actor,
    }
    const created = await tx.articleReviewNote.create({
      data: {
        articleId: article.id,
        action: FEATURED_IMAGE_PROMPT_APPROVED_ACTION,
        reviewer: actor,
        note: serializeFeaturedImagePromptNote(payload),
      },
    })

    return {
      ok: true as const,
      alreadyApplied: false,
      articleUnchanged: false,
      prompt: {
        ...payload,
        noteId: created.id,
        superseded: false,
      },
      contentFingerprint,
    }
  })
}

export async function loadFeaturedImagePromptState(
  articleId: string,
  deps?: { prisma?: unknown },
): Promise<
  | {
      ok: true
      articleId: string
      articleStatus: string
      featuredImage: string | null
      contentFingerprint: string
      hasCurrentAudit: boolean
      promptStatus: "current" | "historical-stale" | "missing"
      current: SafeFeaturedImagePrompt | null
      superseded: SafeFeaturedImagePrompt[]
      historicalStale: SafeFeaturedImagePrompt[]
      canApprove: boolean
      canGenerate: boolean
      code?: FeaturedImagePromptFailureCode
      error?: string
    }
  | { ok: false; code: "not_found"; error: string; articleUnchanged: true }
> {
  const store = (deps?.prisma ??
    (await import("@/lib/prisma")).prisma) as {
    article: PromptApprovalTransaction["article"]
  }

  const article = await store.article.findUnique({
    where: { id: articleId },
    include: {
      researchSources: true,
      researchAudits: true,
      reviewNotes: true,
    },
  })

  if (!article) {
    return {
      ok: false,
      code: "not_found",
      error: "Article not found.",
      articleUnchanged: true,
    }
  }

  const inspected = inspectFeaturedImagePromptState(article)
  const canApprove =
    article.status === "approved" &&
    inspected.hasCurrentAudit &&
    !article.featuredImage &&
    !(
      !inspected.ok &&
      (inspected.code === "cross_article_featured_image_prompt" ||
        inspected.code === "ambiguous_featured_image_prompt")
    )
  const canGenerate =
    article.status === "approved" &&
    inspected.hasCurrentAudit &&
    inspected.ok &&
    inspected.promptStatus === "current" &&
    Boolean(inspected.current)

  return {
    ok: true,
    articleId: article.id,
    articleStatus: article.status,
    featuredImage: article.featuredImage ?? null,
    contentFingerprint: inspected.contentFingerprint,
    hasCurrentAudit: inspected.hasCurrentAudit,
    promptStatus: inspected.promptStatus,
    current: inspected.current,
    superseded: inspected.ok ? inspected.superseded : inspected.superseded,
    historicalStale: inspected.historicalStale,
    canApprove,
    canGenerate,
    ...(!inspected.ok
      ? { code: inspected.code, error: inspected.error }
      : {}),
  }
}
