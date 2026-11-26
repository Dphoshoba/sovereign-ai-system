import { createHash } from "node:crypto"

/** Channels this programme may authorise. FB/Threads/IG/Pinterest remain out of scope. */
export type DistributionChannel = "x" | "newsletter" | "linkedin"

export const DISTRIBUTION_SCOPE_ACTION = "distribution-scope"

/** Ordinary Work — X after publish+verify only; never newsletter retrospectively. */
export const ORDINARY_WORK_ARTICLE_ID = "cmwrevh7j000i08jmldtvmtxx"
export const ORDINARY_WORK_FINGERPRINT =
  "73bc3e1f52f7c2839aa1806f774ff268e644e17f00177d2a6e954d261c3cc0f4"

export type DistributionScopePayload = {
  v: 1
  channels: DistributionChannel[]
  packageFingerprint: string
  articleId: string
  contentFingerprint?: string
  boundAt: string
  boundBy: string
  note?: string
}

export type ReviewNoteLike = {
  action: string
  note: string | null
  createdAt?: Date | string
}

export function serializeDistributionScope(
  payload: DistributionScopePayload,
): string {
  return JSON.stringify(payload)
}

export function parseDistributionScope(
  note: string | null | undefined,
): DistributionScopePayload | null {
  if (!note) return null
  try {
    const parsed = JSON.parse(note) as DistributionScopePayload
    if (parsed?.v !== 1 || !Array.isArray(parsed.channels)) return null
    if (typeof parsed.packageFingerprint !== "string") return null
    return parsed
  } catch {
    return null
  }
}

export function latestDistributionScope(
  notes: ReviewNoteLike[],
): DistributionScopePayload | null {
  const scoped = notes
    .filter((n) => n.action === DISTRIBUTION_SCOPE_ACTION)
    .map((n) => ({ note: n, payload: parseDistributionScope(n.note) }))
    .filter(
      (row): row is { note: ReviewNoteLike; payload: DistributionScopePayload } =>
        row.payload !== null,
    )
  if (scoped.length === 0) return null
  scoped.sort((a, b) => {
    const at = a.note.createdAt ? new Date(a.note.createdAt).getTime() : 0
    const bt = b.note.createdAt ? new Date(b.note.createdAt).getTime() : 0
    return bt - at
  })
  return scoped[0]?.payload ?? null
}

export function channelAuthorised(
  scope: DistributionScopePayload | null,
  channel: DistributionChannel,
): boolean {
  return Boolean(scope?.channels.includes(channel))
}

/**
 * Resolve authorised channels for post-publish automation.
 * OW is hard-mapped to X-only (never newsletter / LinkedIn) to preserve Director intent.
 */
export function resolveAuthorisedChannels(input: {
  articleId: string
  reviewNotes: ReviewNoteLike[]
  currentPackageFingerprint?: string
}): {
  channels: DistributionChannel[]
  scope: DistributionScopePayload | null
  source: "bound" | "ordinary-work-legacy" | "none"
  stale: boolean
} {
  if (input.articleId === ORDINARY_WORK_ARTICLE_ID) {
    return {
      channels: ["x"],
      scope: {
        v: 1,
        channels: ["x"],
        packageFingerprint: ORDINARY_WORK_FINGERPRINT,
        articleId: ORDINARY_WORK_ARTICLE_ID,
        contentFingerprint: ORDINARY_WORK_FINGERPRINT,
        boundAt: "2026-11-25T10:48:12.454Z",
        boundBy: "director-intervention-2",
        note: "OW legacy: X after publish+verify only; newsletter/LinkedIn not authorised",
      },
      source: "ordinary-work-legacy",
      stale: false,
    }
  }

  const scope = latestDistributionScope(input.reviewNotes)
  if (!scope) {
    return { channels: [], scope: null, source: "none", stale: false }
  }

  const stale =
    typeof input.currentPackageFingerprint === "string" &&
    input.currentPackageFingerprint.length > 0 &&
    input.currentPackageFingerprint !== scope.packageFingerprint

  if (stale) {
    return { channels: [], scope, source: "bound", stale: true }
  }

  return {
    channels: scope.channels,
    scope,
    source: "bound",
    stale: false,
  }
}

export function computePackageFingerprint(parts: {
  articleId: string
  contentFingerprint: string
  featuredImage: string | null
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
  xContent: string | null
  linkedinContent: string | null
  newsletterSubject: string | null
  newsletterPreview: string | null
  newsletterBody: string | null
  channels: DistributionChannel[]
  scheduledFor: string | null
}): string {
  const canonical = JSON.stringify({
    articleId: parts.articleId,
    contentFingerprint: parts.contentFingerprint,
    featuredImage: parts.featuredImage,
    seoTitle: parts.seoTitle,
    seoDescription: parts.seoDescription,
    seoKeywords: parts.seoKeywords,
    xContent: parts.xContent,
    linkedinContent: parts.linkedinContent,
    newsletterSubject: parts.newsletterSubject,
    newsletterPreview: parts.newsletterPreview,
    newsletterBody: parts.newsletterBody,
    channels: [...parts.channels].sort(),
    scheduledFor: parts.scheduledFor,
  })
  return createHash("sha256").update(canonical).digest("hex")
}
