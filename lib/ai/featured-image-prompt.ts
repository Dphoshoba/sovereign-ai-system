import { resolveArticleAuditState } from "../research/current-article-audit"
import {
  computeArticleAuditFingerprint,
  type AuditableArticleState,
} from "../research/article-audit-fingerprint"
import {
  extractArticleSourceLinks,
  type StoredArticleSource,
} from "../research/article-source-links"

export const FEATURED_IMAGE_PROMPT_APPROVED_ACTION =
  "featured-image-prompt-approved" as const

export const FEATURED_IMAGE_PROMPT_VERSION = 1 as const

/**
 * Documented safe prompt length in UTF-16 code units. Long enough for an
 * editorial hero brief; short enough to bound provider and storage risk.
 */
export const MAX_FEATURED_IMAGE_PROMPT_LENGTH = 4000

const PROMPT_NOTE_KEYS = [
  "approvedAt",
  "approvedBy",
  "articleId",
  "contentFingerprint",
  "prompt",
  "version",
] as const

const SHA256_PATTERN = /^[a-f0-9]{64}$/
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/

export type FeaturedImagePromptPayload = {
  version: typeof FEATURED_IMAGE_PROMPT_VERSION
  articleId: string
  contentFingerprint: string
  prompt: string
  approvedAt: string
  approvedBy: string
}

export type FeaturedImagePromptNote = {
  id?: string
  action: string
  note: string | null
  createdAt?: Date | string
  reviewer?: string
}

export type FeaturedImagePromptArticle = AuditableArticleState & {
  id: string
  featuredImage?: string | null
  status: string
  researchSources?: StoredArticleSource[] | null
  researchAudits: Array<{
    id: string
    articleId: string
    createdAt: Date | string
  }>
  reviewNotes: FeaturedImagePromptNote[]
}

export type SafeFeaturedImagePrompt = FeaturedImagePromptPayload & {
  noteId: string | null
  superseded: boolean
}

export type FeaturedImagePromptInspectOk = {
  ok: true
  contentFingerprint: string
  hasCurrentAudit: boolean
  promptStatus: "current" | "historical-stale" | "missing"
  current: SafeFeaturedImagePrompt | null
  superseded: SafeFeaturedImagePrompt[]
  historicalStale: SafeFeaturedImagePrompt[]
}

export type FeaturedImagePromptFailureCode =
  | "missing_approved_featured_image_prompt"
  | "stale_approved_featured_image_prompt"
  | "malformed_featured_image_prompt"
  | "ambiguous_featured_image_prompt"
  | "cross_article_featured_image_prompt"

export type FeaturedImagePromptInspectFailure = {
  ok: false
  code: FeaturedImagePromptFailureCode
  error: string
  articleUnchanged: true
  contentFingerprint: string
  hasCurrentAudit: boolean
  promptStatus: "current" | "historical-stale" | "missing"
  current: SafeFeaturedImagePrompt | null
  superseded: SafeFeaturedImagePrompt[]
  historicalStale: SafeFeaturedImagePrompt[]
}

export type FeaturedImagePromptInspectResult =
  | FeaturedImagePromptInspectOk
  | FeaturedImagePromptInspectFailure

function isExactIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false
  const parsed = new Date(value)
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value
}

export function isFeaturedImagePromptApprovedNote(note: {
  action: string
}): boolean {
  return note.action === FEATURED_IMAGE_PROMPT_APPROVED_ACTION
}

export function computeArticleContentFingerprint(
  article: FeaturedImagePromptArticle,
): string {
  const sources = extractArticleSourceLinks({
    content: article.content,
    excerpt: article.excerpt,
    featuredImage: article.featuredImage,
    researchSources: article.researchSources,
  })
  return computeArticleAuditFingerprint(
    article,
    sources.map((source) => source.url),
  )
}

export function validateFeaturedImagePromptText(
  value: unknown,
): { ok: true; prompt: string } | { ok: false; error: string; code: "invalid_prompt" } {
  if (typeof value !== "string") {
    return {
      ok: false,
      code: "invalid_prompt",
      error: "Featured image prompt must be a string.",
    }
  }

  const prompt = value.trim()
  if (!prompt) {
    return {
      ok: false,
      code: "invalid_prompt",
      error: "Featured image prompt is required.",
    }
  }

  if (prompt.length > MAX_FEATURED_IMAGE_PROMPT_LENGTH) {
    return {
      ok: false,
      code: "invalid_prompt",
      error: `Featured image prompt exceeds ${MAX_FEATURED_IMAGE_PROMPT_LENGTH} characters.`,
    }
  }

  if (CONTROL_CHARS.test(prompt)) {
    return {
      ok: false,
      code: "invalid_prompt",
      error: "Featured image prompt contains unsupported control characters.",
    }
  }

  return { ok: true, prompt }
}

export function serializeFeaturedImagePromptNote(
  payload: FeaturedImagePromptPayload,
): string {
  const record: FeaturedImagePromptPayload = {
    version: FEATURED_IMAGE_PROMPT_VERSION,
    articleId: payload.articleId,
    contentFingerprint: payload.contentFingerprint,
    prompt: payload.prompt,
    approvedAt: payload.approvedAt,
    approvedBy: payload.approvedBy,
  }
  return JSON.stringify(record)
}

export function parseFeaturedImagePromptNote(
  reviewNote: FeaturedImagePromptNote,
): FeaturedImagePromptPayload | null {
  if (!isFeaturedImagePromptApprovedNote(reviewNote) || !reviewNote.note) {
    return null
  }

  try {
    const value: unknown = JSON.parse(reviewNote.note)
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return null
    }

    const record = value as Record<string, unknown>
    const keys = Object.keys(record).sort()
    if (
      keys.length !== PROMPT_NOTE_KEYS.length ||
      !PROMPT_NOTE_KEYS.every((key, index) => key === keys[index])
    ) {
      return null
    }

    const promptCheck = validateFeaturedImagePromptText(record.prompt)
    if (
      record.version !== FEATURED_IMAGE_PROMPT_VERSION ||
      typeof record.articleId !== "string" ||
      record.articleId.length === 0 ||
      record.articleId.trim() !== record.articleId ||
      typeof record.contentFingerprint !== "string" ||
      !SHA256_PATTERN.test(record.contentFingerprint) ||
      !promptCheck.ok ||
      promptCheck.prompt !== record.prompt ||
      !isExactIsoTimestamp(record.approvedAt) ||
      typeof record.approvedBy !== "string" ||
      record.approvedBy.length === 0 ||
      record.approvedBy.trim() !== record.approvedBy
    ) {
      return null
    }

    return {
      version: FEATURED_IMAGE_PROMPT_VERSION,
      articleId: record.articleId,
      contentFingerprint: record.contentFingerprint,
      prompt: promptCheck.prompt,
      approvedAt: record.approvedAt,
      approvedBy: record.approvedBy,
    }
  } catch {
    return null
  }
}

function toSafePrompt(
  payload: FeaturedImagePromptPayload,
  note: FeaturedImagePromptNote,
  superseded: boolean,
): SafeFeaturedImagePrompt {
  return {
    ...payload,
    noteId: note.id ?? null,
    superseded,
  }
}

function comparePromptNotes(
  left: { payload: FeaturedImagePromptPayload; note: FeaturedImagePromptNote },
  right: { payload: FeaturedImagePromptPayload; note: FeaturedImagePromptNote },
): number {
  const time =
    new Date(right.payload.approvedAt).valueOf() -
    new Date(left.payload.approvedAt).valueOf()
  if (time !== 0) return time
  return (right.note.id ?? "").localeCompare(left.note.id ?? "")
}

const INSPECT_ERRORS: Record<
  FeaturedImagePromptFailureCode,
  string
> = {
  missing_approved_featured_image_prompt:
    "A current approved featured-image prompt is required before generation.",
  stale_approved_featured_image_prompt:
    "The approved featured-image prompt is stale for the current article fingerprint.",
  malformed_featured_image_prompt:
    "A featured-image prompt note is malformed and cannot be used.",
  ambiguous_featured_image_prompt:
    "Multiple current featured-image prompts were approved at the same time.",
  cross_article_featured_image_prompt:
    "A featured-image prompt note is bound to a different article.",
}

export function inspectFeaturedImagePromptState(
  article: FeaturedImagePromptArticle,
): FeaturedImagePromptInspectResult {
  const contentFingerprint = computeArticleContentFingerprint(article)
  const hasCurrentAudit = Boolean(resolveArticleAuditState(article).currentAudit)
  const empty = {
    contentFingerprint,
    hasCurrentAudit,
    current: null,
    superseded: [] as SafeFeaturedImagePrompt[],
    historicalStale: [] as SafeFeaturedImagePrompt[],
  }

  const actionNotes = article.reviewNotes.filter(isFeaturedImagePromptApprovedNote)
  const parsed: Array<{
    note: FeaturedImagePromptNote
    payload: FeaturedImagePromptPayload | null
  }> = actionNotes.map((note) => ({
    note,
    payload: parseFeaturedImagePromptNote(note),
  }))

  const crossArticle = parsed.filter(
    (entry) => entry.payload && entry.payload.articleId !== article.id,
  )
  if (crossArticle.length > 0) {
    return {
      ok: false,
      code: "cross_article_featured_image_prompt",
      error: INSPECT_ERRORS.cross_article_featured_image_prompt,
      articleUnchanged: true,
      promptStatus: "missing",
      ...empty,
    }
  }

  const malformed = parsed.filter((entry) => !entry.payload)
  const valid = parsed.flatMap((entry) =>
    entry.payload ? [{ note: entry.note, payload: entry.payload }] : [],
  )

  const matching = valid
    .filter((entry) => entry.payload.contentFingerprint === contentFingerprint)
    .sort(comparePromptNotes)
  const historicalStale = valid
    .filter((entry) => entry.payload.contentFingerprint !== contentFingerprint)
    .sort(comparePromptNotes)
    .map((entry) => toSafePrompt(entry.payload, entry.note, true))

  if (malformed.length > 0 && matching.length === 0) {
    return {
      ok: false,
      code: "malformed_featured_image_prompt",
      error: INSPECT_ERRORS.malformed_featured_image_prompt,
      articleUnchanged: true,
      promptStatus:
        historicalStale.length > 0 ? "historical-stale" : "missing",
      ...empty,
      historicalStale,
    }
  }

  if (matching.length > 0) {
    const latest = matching[0]
    const tied = matching.filter(
      (entry) => entry.payload.approvedAt === latest.payload.approvedAt,
    )
    const tiedPrompts = new Set(tied.map((entry) => entry.payload.prompt))
    if (tiedPrompts.size > 1) {
      return {
        ok: false,
        code: "ambiguous_featured_image_prompt",
        error: INSPECT_ERRORS.ambiguous_featured_image_prompt,
        articleUnchanged: true,
        promptStatus: "current",
        ...empty,
        historicalStale,
      }
    }

    return {
      ok: true,
      contentFingerprint,
      hasCurrentAudit,
      promptStatus: "current",
      current: toSafePrompt(latest.payload, latest.note, false),
      superseded: matching
        .slice(1)
        .map((entry) => toSafePrompt(entry.payload, entry.note, true)),
      historicalStale,
    }
  }

  if (historicalStale.length > 0) {
    return {
      ok: true,
      contentFingerprint,
      hasCurrentAudit,
      promptStatus: "historical-stale",
      current: null,
      superseded: [],
      historicalStale,
    }
  }

  return {
    ok: true,
    contentFingerprint,
    hasCurrentAudit,
    promptStatus: "missing",
    current: null,
    superseded: [],
    historicalStale: [],
  }
}

export function requireCurrentFeaturedImagePrompt(
  article: FeaturedImagePromptArticle,
):
  | {
      ok: true
      prompt: string
      payload: SafeFeaturedImagePrompt
      contentFingerprint: string
      hasCurrentAudit: true
    }
  | FeaturedImagePromptInspectFailure
  | {
      ok: false
      code: "invalid_status" | "missing_audit"
      error: string
      articleUnchanged: true
    } {
  if (article.status !== "approved") {
    return {
      ok: false,
      code: "invalid_status",
      error: "Only an approved article can generate a featured image.",
      articleUnchanged: true,
    }
  }

  const inspected = inspectFeaturedImagePromptState(article)
  if (!inspected.hasCurrentAudit) {
    return {
      ok: false,
      code: "missing_audit",
      error:
        "A current research audit matching this content revision is required.",
      articleUnchanged: true,
    }
  }

  if (!inspected.ok) {
    return inspected
  }

  if (inspected.promptStatus === "historical-stale" || !inspected.current) {
    const code =
      inspected.promptStatus === "historical-stale"
        ? "stale_approved_featured_image_prompt"
        : "missing_approved_featured_image_prompt"
    return {
      ok: false,
      code,
      error: INSPECT_ERRORS[code],
      articleUnchanged: true,
      contentFingerprint: inspected.contentFingerprint,
      hasCurrentAudit: inspected.hasCurrentAudit,
      promptStatus: inspected.promptStatus,
      current: inspected.current,
      superseded: inspected.superseded,
      historicalStale: inspected.historicalStale,
    }
  }

  return {
    ok: true,
    prompt: inspected.current.prompt,
    payload: inspected.current,
    contentFingerprint: inspected.contentFingerprint,
    hasCurrentAudit: true,
  }
}
