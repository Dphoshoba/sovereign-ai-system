/**
 * EV-EDITORIAL-07-P0 — compose-only editorial stage runner.
 * Advances draft → research/audit → review-required, then stops.
 * Never approves, schedules, publishes, or distributes.
 */
import {
  prepareArticleForReview,
  type PrepareArticleForReviewDeps,
  type PrepareForReviewArticle,
  type PrepareForReviewResult,
  type PrepareForReviewStore,
} from "../research/prepare-article-for-review"
import { resolveArticleAuditState } from "../research/current-article-audit"
import {
  PUBLISH_READY_CONSENSUS_SCORE,
  PUBLISH_READY_RECOMMENDATION,
  PUBLISH_READY_SOURCE_QUALITY_SCORE,
} from "../research/consensus-engine"
import { researchPublicationBlockReason } from "./publication-guard"
import {
  buildEvidenceHoldReason,
  isTransientEvidenceFailure,
} from "../research/evidence-recovery"

export const EDITORIAL_STAGE_HOLD_ACTION = "editorial-stage-hold" as const

export const EDITORIAL_STAGE_IDS = [
  "draft",
  "research_audit",
  "human_review_boundary",
] as const

export type EditorialStageId = (typeof EDITORIAL_STAGE_IDS)[number]

export type EditorialStageStatus =
  | "completed"
  | "skipped"
  | "hold"
  | "failed"
  | "ready"

export type EditorialStageRecord = {
  id: EditorialStageId
  status: EditorialStageStatus
  detail: string
  attempts?: number
}

export type EditorialStageOutcome =
  | "ready_for_human_review"
  | "hold"
  | "already_applied"
  | "failed"

type PrepareForReviewSuccessAudit = Extract<
  PrepareForReviewResult,
  { ok: true }
>["audit"]

export type EditorialStageRunnerSuccess = {
  ok: true
  outcome: Exclude<EditorialStageOutcome, "failed">
  articleId: string
  status: string
  stages: EditorialStageRecord[]
  holdReason: string | null
  audit: PrepareForReviewSuccessAudit | null
  articleUnchanged: boolean
  alreadyApplied: boolean
  sideEffects: EditorialStageSideEffects
}

export type EditorialStageRunnerFailure = {
  ok: false
  outcome: "failed" | "hold"
  code:
    | "not_found"
    | "invalid_status"
    | "missing_content"
    | "prepare_failed"
    | "immutable_lifecycle"
  error: string
  articleId: string | null
  status: string | null
  stages: EditorialStageRecord[]
  holdReason: string | null
  articleUnchanged: true
  sideEffects: EditorialStageSideEffects
}

export type EditorialStageRunnerResult =
  | EditorialStageRunnerSuccess
  | EditorialStageRunnerFailure

export type EditorialStageSideEffects = {
  approved: false
  scheduled: false
  published: false
  socialDistributed: false
  featuredImageGenerated: false
}

const FORBIDDEN_SIDE_EFFECTS: EditorialStageSideEffects = {
  approved: false,
  scheduled: false,
  published: false,
  socialDistributed: false,
  featuredImageGenerated: false,
}

const PREPARABLE = new Set(["draft", "review", "review-required"])
const IMMUTABLE = new Set(["approved", "scheduled", "published", "archived"])

export type EditorialStageRunnerArticle = {
  id: string
  title: string
  slug: string
  category: string
  status: string
  excerpt: string | null
  content: string | null
  featuredImage?: string | null
  approvedAt?: Date | string | null
  approvedBy?: string | null
  publishedAt?: Date | string | null
  scheduledFor?: Date | string | null
  researchSources?: PrepareForReviewArticle["researchSources"]
  researchAudits: Array<{
    id: string
    articleId: string
    createdAt: Date | string
    consensusScore?: number | null
    sourceQualityScore?: number | null
    publicationRecommendation?: string | null
  }>
  reviewNotes: Array<{ action: string; note: string | null }>
}

export type EditorialStageRunnerStore = Omit<PrepareForReviewStore, "article"> & {
  article: {
    create?: (args: {
      data: Record<string, unknown>
    }) => Promise<{ id: string; status: string; title: string }>
    findUnique: (args: {
      where: { id: string }
      include?: Record<string, unknown>
    }) => Promise<EditorialStageRunnerArticle | null>
    update: PrepareForReviewStore["article"]["update"]
  }
}

export type EditorialStageRunnerInput = {
  actor: string
  articleId?: string
  title?: string
  category?: string
  excerpt?: string
  content?: string
  /** Test seam: override prepare. */
  prepare?: (
    articleId: string,
    deps: PrepareArticleForReviewDeps,
  ) => Promise<PrepareForReviewResult>
  /** Bounded retries for transient prepare failures. */
  maxPrepareAttempts?: number
  sleep?: (ms: number) => Promise<void>
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

function hasSubstantialContent(content: string | null | undefined) {
  return Boolean(content && content.trim().length >= 40)
}

function isTransientPrepareFailure(result: PrepareForReviewResult | { message: string }) {
  if ("ok" in result && result.ok === false) {
    return isTransientEvidenceFailure(result.error, result.code)
  }
  if ("message" in result) {
    return isTransientEvidenceFailure(result.message)
  }
  return false
}

async function loadArticle(
  store: EditorialStageRunnerStore,
  articleId: string,
): Promise<EditorialStageRunnerArticle | null> {
  const row = await store.article.findUnique({
    where: { id: articleId },
    include: {
      researchSources: true,
      researchAudits: {
        orderBy: { createdAt: "desc" },
      },
      reviewNotes: true,
    },
  })
  return row
}

function asPrepareStore(
  store: EditorialStageRunnerStore,
): PrepareForReviewStore {
  return store as unknown as PrepareForReviewStore
}

async function writeHoldNote(
  store: EditorialStageRunnerStore,
  articleId: string,
  actor: string,
  reason: string,
) {
  await store.articleReviewNote.create({
    data: {
      articleId,
      action: EDITORIAL_STAGE_HOLD_ACTION,
      reviewer: actor,
      note: reason,
    },
  })
}

function failure(
  partial: Omit<EditorialStageRunnerFailure, "articleUnchanged" | "sideEffects">,
): EditorialStageRunnerFailure {
  return {
    ...partial,
    articleUnchanged: true,
    sideEffects: FORBIDDEN_SIDE_EFFECTS,
  }
}

/**
 * Compose-only runner. Uses existing prepareArticleForReview for research+audit.
 * Stops at review-required / HOLD. Never mutates approval, schedule, publish, or social.
 */
export async function runEditorialStages(
  input: EditorialStageRunnerInput,
  deps: { prisma: EditorialStageRunnerStore },
): Promise<EditorialStageRunnerResult> {
  const store = deps.prisma
  const stages: EditorialStageRecord[] = []
  const prepare = input.prepare ?? prepareArticleForReview
  const maxAttempts = Math.max(1, input.maxPrepareAttempts ?? 3)
  const sleep =
    input.sleep ??
    (async (ms: number) => {
      await new Promise((resolve) => setTimeout(resolve, ms))
    })

  let articleId = input.articleId?.trim() || ""
  let article: EditorialStageRunnerArticle | null = null

  // --- Stage: draft ---
  if (!articleId) {
    const title = input.title?.trim()
    if (!title) {
      return failure({
        ok: false,
        outcome: "failed",
        code: "missing_content",
        error: "Provide articleId or a title to create a draft.",
        articleId: null,
        status: null,
        stages,
        holdReason: null,
      })
    }

    if (!store.article.create) {
      return failure({
        ok: false,
        outcome: "failed",
        code: "prepare_failed",
        error: "Draft creation is unavailable in this store.",
        articleId: null,
        status: null,
        stages,
        holdReason: null,
      })
    }

    const category = (input.category || "ai-tools").trim() || "ai-tools"
    const created = await store.article.create({
      data: {
        title,
        slug: slugify(title) || `draft-${Date.now().toString(36)}`,
        category,
        excerpt:
          input.excerpt?.trim() ||
          "Draft created by the Echoes & Visions editorial stage runner.",
        content: input.content?.trim() || "",
        status: "draft",
        approvedAt: null,
        approvedBy: null,
        scheduledFor: null,
        publishedAt: null,
      },
    })
    articleId = created.id
    stages.push({
      id: "draft",
      status: "completed",
      detail: "Draft article record created.",
    })
  } else {
    stages.push({
      id: "draft",
      status: "skipped",
      detail: "Using existing article record.",
    })
  }

  article = await loadArticle(store, articleId)
  if (!article) {
    return failure({
      ok: false,
      outcome: "failed",
      code: "not_found",
      error: "Article not found.",
      articleId,
      status: null,
      stages,
      holdReason: null,
    })
  }

  // Protect approved / scheduled / published articles from runner mutation.
  if (IMMUTABLE.has(article.status)) {
    return failure({
      ok: false,
      outcome: "failed",
      code: "immutable_lifecycle",
      error:
        "Approved, scheduled, published, or archived articles are left unchanged by the stage runner.",
      articleId: article.id,
      status: article.status,
      stages,
      holdReason: null,
    })
  }

  if (!PREPARABLE.has(article.status)) {
    return failure({
      ok: false,
      outcome: "failed",
      code: "invalid_status",
      error: `Article status "${article.status}" cannot enter the editorial stage runner.`,
      articleId: article.id,
      status: article.status,
      stages,
      holdReason: null,
    })
  }

  if (!hasSubstantialContent(article.content)) {
    const holdReason =
      "HOLD: draft has insufficient content for research and audit. Add article body before re-running."
    await writeHoldNote(store, article.id, input.actor, holdReason)
    stages.push({
      id: "research_audit",
      status: "hold",
      detail: holdReason,
    })
    stages.push({
      id: "human_review_boundary",
      status: "hold",
      detail: "Stopped for editorial content work; not ready for Director approval.",
    })
    return {
      ok: true,
      outcome: "hold",
      articleId: article.id,
      status: article.status,
      stages,
      holdReason,
      audit: null,
      articleUnchanged: false,
      alreadyApplied: false,
      sideEffects: FORBIDDEN_SIDE_EFFECTS,
    }
  }

  // Idempotent path: current audit already associated → stop at human review.
  const existingAuditState = resolveArticleAuditState(article)
  if (existingAuditState.currentAudit && article.status === "review-required") {
    stages.push({
      id: "research_audit",
      status: "skipped",
      detail: "Current research audit already exists for this revision.",
    })
    stages.push({
      id: "human_review_boundary",
      status: "ready",
      detail: "Already at review-required with a current audit. Awaiting Director.",
    })
    return {
      ok: true,
      outcome: "already_applied",
      articleId: article.id,
      status: article.status,
      stages,
      holdReason: null,
      audit: null,
      articleUnchanged: true,
      alreadyApplied: true,
      sideEffects: FORBIDDEN_SIDE_EFFECTS,
    }
  }

  // --- Stage: research + audit (existing prepareArticleForReview) ---
  let prepareResult: PrepareForReviewResult | null = null
  let attempts = 0
  let lastError: string | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    attempts = attempt
    try {
      prepareResult = await prepare(article.id, {
        prisma: asPrepareStore(store),
        reviewer: input.actor,
      })
      if (
        !prepareResult.ok &&
        isTransientPrepareFailure(prepareResult) &&
        attempt < maxAttempts
      ) {
        lastError = prepareResult.error
        await sleep(50 * attempt)
        continue
      }
      break
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
      if (isTransientEvidenceFailure(lastError) && attempt < maxAttempts) {
        await sleep(50 * attempt)
        continue
      }
      stages.push({
        id: "research_audit",
        status: "failed",
        detail: lastError,
        attempts,
      })
      return failure({
        ok: false,
        outcome: "failed",
        code: "prepare_failed",
        error: lastError,
        articleId: article.id,
        status: article.status,
        stages,
        holdReason: null,
      })
    }
  }

  if (!prepareResult) {
    stages.push({
      id: "research_audit",
      status: "failed",
      detail: lastError || "Prepare for review returned no result.",
      attempts,
    })
    return failure({
      ok: false,
      outcome: "failed",
      code: "prepare_failed",
      error: lastError || "Prepare for review returned no result.",
      articleId: article.id,
      status: article.status,
      stages,
      holdReason: null,
    })
  }

  if (!prepareResult.ok) {
    if (prepareResult.code === "duplicate_audit") {
      const refreshed = await loadArticle(store, article.id)
      if (refreshed && refreshed.status === "review-required") {
        stages.push({
          id: "research_audit",
          status: "skipped",
          detail: prepareResult.error,
          attempts,
        })
        stages.push({
          id: "human_review_boundary",
          status: "ready",
          detail:
            "Duplicate prepare blocked; existing audit retained for Director review.",
        })
        return {
          ok: true,
          outcome: "already_applied",
          articleId: article.id,
          status: refreshed.status,
          stages,
          holdReason: null,
          audit: null,
          articleUnchanged: true,
          alreadyApplied: true,
          sideEffects: FORBIDDEN_SIDE_EFFECTS,
        }
      }
    }

    const holdCodes = new Set([
      "missing_evidence",
      "insufficient_article_evidence",
    ])
    if (holdCodes.has(prepareResult.code)) {
      const holdReason = buildEvidenceHoldReason({
        code: prepareResult.code,
        error: prepareResult.error,
      })
      await writeHoldNote(store, article.id, input.actor, holdReason)
      stages.push({
        id: "research_audit",
        status: "hold",
        detail: holdReason,
        attempts,
      })
      stages.push({
        id: "human_review_boundary",
        status: "hold",
        detail: "Evidence incomplete. Director intervention required before approval.",
      })
      return {
        ok: true,
        outcome: "hold",
        articleId: article.id,
        status: article.status,
        stages,
        holdReason,
        audit: null,
        articleUnchanged: false,
        alreadyApplied: false,
        sideEffects: FORBIDDEN_SIDE_EFFECTS,
      }
    }

    stages.push({
      id: "research_audit",
      status: "failed",
      detail: prepareResult.error,
      attempts,
    })
    return failure({
      ok: false,
      outcome: "failed",
      code: "prepare_failed",
      error: prepareResult.error,
      articleId: article.id,
      status: article.status,
      stages,
      holdReason: null,
    })
  }

  stages.push({
    id: "research_audit",
    status: "completed",
    detail: `Audit ${prepareResult.audit.id} created (${prepareResult.audit.publicationRecommendation}).`,
    attempts,
  })

  // Re-load to confirm boundary status. Classify using the audit just prepared
  // (by id) plus prepare result scores — do not invent readiness.
  const after = await loadArticle(store, article.id)
  const afterStatus = after?.status || prepareResult.article.status
  const preparedAuditRow = after?.researchAudits?.find(
    (row) => row.id === prepareResult.audit.id,
  )
  if (afterStatus !== "review-required") {
    const holdReason = `HOLD: expected review-required after prepare, found "${afterStatus}".`
    await writeHoldNote(store, article.id, input.actor, holdReason)
    stages.push({
      id: "human_review_boundary",
      status: "hold",
      detail: holdReason,
    })
    return {
      ok: true,
      outcome: "hold",
      articleId: article.id,
      status: afterStatus,
      stages,
      holdReason,
      audit: prepareResult.audit,
      articleUnchanged: false,
      alreadyApplied: false,
      sideEffects: FORBIDDEN_SIDE_EFFECTS,
    }
  }

  // Publication readiness remains enforced by existing publication guards at
  // approve/schedule/publish time. Preparation success stops at human review
  // even when the audit is not yet publish-ready (Director must still review).
  const researchBlock = preparedAuditRow
    ? researchPublicationBlockReason(preparedAuditRow)
    : prepareResult.audit.publicationRecommendation ===
          PUBLISH_READY_RECOMMENDATION &&
        prepareResult.audit.consensusScore >= PUBLISH_READY_CONSENSUS_SCORE
      ? null
      : "Current research audit is not publish-ready."

  void PUBLISH_READY_SOURCE_QUALITY_SCORE

  const readinessNote = researchBlock
    ? ` Audit is not yet publish-ready (${researchBlock}). Director review still required; publication guards remain in force.`
    : ""

  stages.push({
    id: "human_review_boundary",
    status: "ready",
    detail:
      "Stopped at review-required. Awaiting Director approval. No schedule/publish/social performed." +
      readinessNote,
  })

  return {
    ok: true,
    outcome: "ready_for_human_review",
    articleId: article.id,
    status: afterStatus,
    stages,
    holdReason: null,
    audit: prepareResult.audit,
    articleUnchanged: false,
    alreadyApplied: false,
    sideEffects: FORBIDDEN_SIDE_EFFECTS,
  }
}

/** Runtime guard used by routes/tests: stage runner must never request these. */
export const EDITORIAL_STAGE_RUNNER_FORBIDDEN_TRANSITIONS = [
  "approve",
  "schedule",
  "publish",
] as const
