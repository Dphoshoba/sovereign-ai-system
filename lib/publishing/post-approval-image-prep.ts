/**
 * EV-EDITORIAL-07-P2 — post-approval featured-image preparation.
 * Runs only after human editorial approval. Never publishes or schedules.
 */
import {
  approveFeaturedImagePrompt,
  type FeaturedImagePromptApprovalStore,
} from "../ai/approve-featured-image-prompt"
import { generateAndPersistFeaturedImage } from "../ai/persist-featured-image"
import {
  computeArticleContentFingerprint,
  inspectFeaturedImagePromptState,
  type FeaturedImagePromptArticle,
} from "../ai/featured-image-prompt"
import {
  evidenceRecoveryDelayMs,
  isTransientEvidenceFailure,
  withBoundedEvidenceRecovery,
} from "../research/evidence-recovery"

export const POST_APPROVAL_IMAGE_NOTE_ACTION = "post-approval-image-prep" as const

export type PostApprovalImageSideEffects = {
  approved: false
  scheduled: false
  published: false
  socialDistributed: false
  featuredImageGenerated: boolean
}

const FORBIDDEN: Omit<PostApprovalImageSideEffects, "featuredImageGenerated"> & {
  approved: false
  scheduled: false
  published: false
  socialDistributed: false
} = {
  approved: false,
  scheduled: false,
  published: false,
  socialDistributed: false,
}

export type PostApprovalImageArticle = FeaturedImagePromptArticle & {
  id: string
  title: string
  slug: string
  status: string
  excerpt: string | null
  content: string | null
  featuredImage: string | null
  approvedAt?: Date | string | null
  approvedBy?: string | null
}

export type PostApprovalImageStore = FeaturedImagePromptApprovalStore & {
  article: {
    findUnique: (args: {
      where: { id: string }
      include?: Record<string, unknown>
    }) => Promise<PostApprovalImageArticle | null>
  }
  articleReviewNote?: {
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

export type PostApprovalImageResult =
  | {
      ok: true
      outcome: "generated" | "already_applied"
      articleId: string
      featuredImage: string | null
      articleUnchanged: boolean
      sideEffects: PostApprovalImageSideEffects
    }
  | {
      ok: false
      outcome: "failed" | "skipped"
      code:
        | "not_found"
        | "not_approved"
        | "missing_prompt"
        | "prompt_failed"
        | "generate_failed"
      error: string
      articleId: string | null
      articleUnchanged: true
      sideEffects: PostApprovalImageSideEffects
    }

function defaultPromptForArticle(article: PostApprovalImageArticle): string {
  const excerpt = (article.excerpt || "").trim()
  const body = (article.content || "").replace(/\s+/g, " ").trim().slice(0, 280)
  const basis = excerpt || body || article.title
  return `Editorial feature image for Echoes & Visions article "${article.title}". Calm, documentary atmosphere reflecting: ${basis}. No text overlay, no logos, no watermarks.`
}

export async function prepareFeaturedImageAfterApproval(
  input: {
    articleId: string
    actor: string
    generateImage?: (prompt: string) => Promise<string | undefined>
    sleep?: (ms: number) => Promise<void>
    maxAttempts?: number
  },
  deps: { prisma: PostApprovalImageStore },
): Promise<PostApprovalImageResult> {
  const store = deps.prisma
  const article = await store.article.findUnique({
    where: { id: input.articleId },
    include: {
      researchSources: true,
      researchAudits: true,
      reviewNotes: true,
    },
  })

  if (!article) {
    return {
      ok: false,
      outcome: "failed",
      code: "not_found",
      error: "Article not found",
      articleId: null,
      articleUnchanged: true,
      sideEffects: { ...FORBIDDEN, featuredImageGenerated: false },
    }
  }

  if (article.status !== "approved") {
    return {
      ok: false,
      outcome: "skipped",
      code: "not_approved",
      error: "Featured-image automation runs only after editorial approval.",
      articleId: article.id,
      articleUnchanged: true,
      sideEffects: { ...FORBIDDEN, featuredImageGenerated: false },
    }
  }

  if (article.featuredImage) {
    return {
      ok: true,
      outcome: "already_applied",
      articleId: article.id,
      featuredImage: article.featuredImage,
      articleUnchanged: true,
      sideEffects: { ...FORBIDDEN, featuredImageGenerated: false },
    }
  }

  const promptState = inspectFeaturedImagePromptState(article)
  if (!promptState.ok || !promptState.current) {
    const approved = await approveFeaturedImagePrompt(
      {
        articleId: article.id,
        prompt: defaultPromptForArticle(article),
        actor: input.actor,
        replace: true,
      },
      { prisma: store },
    )
    if (!approved.ok) {
      return {
        ok: false,
        outcome: "failed",
        code: "prompt_failed",
        error: approved.error,
        articleId: article.id,
        articleUnchanged: true,
        sideEffects: { ...FORBIDDEN, featuredImageGenerated: false },
      }
    }
  } else {
    void computeArticleContentFingerprint(article)
  }

  const recovered = await withBoundedEvidenceRecovery({
    maxAttempts: input.maxAttempts ?? 3,
    sleep: input.sleep,
    run: async () =>
      generateAndPersistFeaturedImage({
        articleId: article.id,
        prisma: store as never,
        generateImage: input.generateImage,
      }),
    isRetryable: (result) => {
      if (result.ok) return false
      return isTransientEvidenceFailure(result.error, result.code)
    },
  })

  const generated = recovered.result
  if (!generated.ok) {
    await store.articleReviewNote?.create({
      data: {
        articleId: article.id,
        action: POST_APPROVAL_IMAGE_NOTE_ACTION,
        reviewer: input.actor,
        note: `FAILED after ${recovered.attempts} attempt(s): ${generated.error}`,
      },
    })
    return {
      ok: false,
      outcome: "failed",
      code: "generate_failed",
      error: generated.error,
      articleId: article.id,
      articleUnchanged: true,
      sideEffects: { ...FORBIDDEN, featuredImageGenerated: false },
    }
  }

  await store.articleReviewNote?.create({
    data: {
      articleId: article.id,
      action: POST_APPROVAL_IMAGE_NOTE_ACTION,
      reviewer: input.actor,
      note: `generated attempts=${recovered.attempts} delayCapMs=${evidenceRecoveryDelayMs(recovered.attempts)}`,
    },
  })

  const imageUrl =
    generated.article && "featuredImage" in generated.article
      ? (generated.article.featuredImage as string | null)
      : null

  return {
    ok: true,
    outcome: "generated",
    articleId: article.id,
    featuredImage: imageUrl,
    articleUnchanged: Boolean(generated.articleUnchanged),
    sideEffects: { ...FORBIDDEN, featuredImageGenerated: true },
  }
}
