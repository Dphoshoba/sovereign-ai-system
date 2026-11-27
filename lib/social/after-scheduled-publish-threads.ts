import {
  channelAuthorised,
  resolveAuthorisedChannels,
  type ReviewNoteLike,
} from "../publishing/distribution-scope"
import {
  buildChannelClaimId,
  shouldBlockRetry,
  type ChannelExecutionClaim,
  type ChannelExecutionOutcome,
} from "../publishing/channel-execution-guard"
import { canonicalArticleUrl } from "./x-publish-policy"
import {
  publishApprovedThreadsPost,
  type ThreadsPublishStore,
} from "./threads-publish"

export type AfterPublishThreadsArticle = {
  id: string
  slug: string
  status: string
  featuredImage: string | null
  reviewNotes: ReviewNoteLike[]
}

export type SocialPostLike = {
  id: string
  platform: string
  content: string
  status: string
  externalId: string | null
}

export type AfterPublishThreadsResult =
  | { ok: true; skipped: true; reason: string }
  | {
      ok: true
      skipped: false
      postId: string
      externalId?: string
      status: number
      body: Record<string, unknown>
    }
  | {
      ok: false
      reason: string
      code:
        | "public_verify_failed"
        | "featured_image_verify_failed"
        | "no_approved_threads"
        | "ambiguous_approved_threads"
        | "publish_failed"
        | "channel_not_authorised"
        | "stale_scope"
        | "preview_blocked"
        | "claim_blocked"
        | "ambiguous_unresolved"
    }

async function verifyPublicUrl(
  url: string,
  fetchImpl: typeof fetch,
): Promise<{ ok: true } | { ok: false; status?: number }> {
  try {
    const response = await fetchImpl(url, {
      method: "GET",
      redirect: "follow",
      headers: { Accept: "text/html" },
    })
    if (response.status >= 200 && response.status < 400) return { ok: true }
    return { ok: false, status: response.status }
  } catch {
    return { ok: false }
  }
}

async function verifyFeaturedImage(
  url: string | null,
  fetchImpl: typeof fetch,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!url) return { ok: false, reason: "Featured image is missing." }
  try {
    const response = await fetchImpl(url, { method: "GET", redirect: "follow" })
    if (response.status >= 200 && response.status < 400) return { ok: true }
    return { ok: false, reason: `Featured image HTTP ${response.status}` }
  } catch {
    return { ok: false, reason: "Featured image request failed." }
  }
}

function selectApprovedThreadsPost(
  posts: SocialPostLike[],
):
  | { ok: true; post: SocialPostLike }
  | {
      ok: false
      code: "no_approved_threads" | "ambiguous_approved_threads"
      reason: string
    } {
  const threads = posts.filter((p) => p.platform === "threads")
  const already = threads.filter((p) => p.status === "published" || p.externalId)
  if (already.length > 0) {
    return {
      ok: false,
      code: "ambiguous_approved_threads",
      reason:
        "A Threads post is already published or has an external id; not republishing.",
    }
  }
  const approved = threads.filter((p) => p.status === "approved")
  if (approved.length === 0) {
    return {
      ok: false,
      code: "no_approved_threads",
      reason: "No exact approved Threads announcement found. Will not regenerate.",
    }
  }
  if (approved.length > 1) {
    return {
      ok: false,
      code: "ambiguous_approved_threads",
      reason: "Multiple approved Threads announcements; reconciliation required.",
    }
  }
  return { ok: true, post: approved[0]! }
}

export async function publishAuthorisedThreadsAfterScheduledPublish(input: {
  article: AfterPublishThreadsArticle
  socialPosts: SocialPostLike[]
  store: ThreadsPublishStore
  fetchImpl?: typeof fetch
  actor?: string
  openClaim?: ChannelExecutionClaim | null
  priorOutcome?: ChannelExecutionOutcome | null
}): Promise<AfterPublishThreadsResult> {
  if (process.env.VERCEL_ENV === "preview") {
    return {
      ok: false,
      code: "preview_blocked",
      reason: "Preview environment does not publish live Threads posts.",
    }
  }

  const authorised = resolveAuthorisedChannels({
    articleId: input.article.id,
    reviewNotes: input.article.reviewNotes,
  })

  if (authorised.stale) {
    return {
      ok: false,
      code: "stale_scope",
      reason:
        "Distribution scope is stale after material package changes; re-approval required.",
    }
  }

  if (!channelAuthorised(authorised.scope, "threads")) {
    return {
      ok: true,
      skipped: true,
      reason: "Threads channel is not authorised for this article.",
    }
  }

  if (input.article.status !== "published") {
    return { ok: true, skipped: true, reason: "Article is not published." }
  }

  const fetchImpl = input.fetchImpl ?? fetch
  const publicUrl = canonicalArticleUrl(input.article.slug)
  const publicOk = await verifyPublicUrl(publicUrl, fetchImpl)
  if (!publicOk.ok) {
    return {
      ok: false,
      code: "public_verify_failed",
      reason: `Canonical URL verification failed${
        publicOk.status ? ` (HTTP ${publicOk.status})` : ""
      }.`,
    }
  }

  const imageOk = await verifyFeaturedImage(
    input.article.featuredImage,
    fetchImpl,
  )
  if (!imageOk.ok) {
    return {
      ok: false,
      code: "featured_image_verify_failed",
      reason: imageOk.reason,
    }
  }

  const selected = selectApprovedThreadsPost(input.socialPosts)
  if (!selected.ok) {
    return { ok: false, code: selected.code, reason: selected.reason }
  }

  const { loadChannelExecutionState, recordChannelClaim, recordChannelOutcome } =
    await import("../publishing/channel-execution-ledger")
  const ledgerState =
    input.openClaim || input.priorOutcome
      ? { openClaim: input.openClaim ?? null, priorOutcome: input.priorOutcome ?? null }
      : await loadChannelExecutionState({
          store: input.store,
          channel: "threads",
          articleId: input.article.id,
          payloadId: selected.post.id,
        })

  const claimBlock = shouldBlockRetry({
    existingExternalId: selected.post.externalId,
    openClaim: ledgerState.openClaim,
    priorOutcome: ledgerState.priorOutcome,
  })
  if (claimBlock.block) {
    return {
      ok: false,
      code:
        claimBlock.code === "ambiguous_unresolved"
          ? "ambiguous_unresolved"
          : "claim_blocked",
      reason: claimBlock.reason || "Execution claim blocked.",
    }
  }

  const claimId = buildChannelClaimId({
    channel: "threads",
    articleId: input.article.id,
    payloadId: selected.post.id,
  })
  await recordChannelClaim({
    store: input.store,
    channel: "threads",
    articleId: input.article.id,
    payloadId: selected.post.id,
    actor: input.actor || "scheduler:publish-due-articles",
  })

  const result = await publishApprovedThreadsPost({
    postId: selected.post.id,
    store: input.store,
    http: { fetch: fetchImpl },
    requireCanonicalUrl: true,
  })

  await recordChannelOutcome({
    store: input.store,
    outcome: {
      v: 1,
      channel: "threads",
      articleId: input.article.id,
      payloadId: selected.post.id,
      claimId,
      status:
        result.body.ok && (result.body.externalId || result.body.alreadyPublished)
          ? result.body.alreadyPublished
            ? "skipped_already_published"
            : "provider_accepted"
          : "provider_rejected",
      externalId:
        typeof result.body.externalId === "string"
          ? result.body.externalId
          : null,
      recordedAt: new Date().toISOString(),
      detail:
        typeof result.body.error === "string" ? result.body.error : undefined,
    },
  })

  if (result.status >= 200 && result.status < 300 && result.body.ok) {
    return {
      ok: true,
      skipped: false,
      postId: selected.post.id,
      externalId:
        typeof result.body.externalId === "string"
          ? result.body.externalId
          : undefined,
      status: result.status,
      body: result.body,
    }
  }

  if (result.body.alreadyPublished) {
    return {
      ok: true,
      skipped: false,
      postId: selected.post.id,
      externalId:
        typeof result.body.externalId === "string"
          ? result.body.externalId
          : undefined,
      status: result.status,
      body: result.body,
    }
  }

  return {
    ok: false,
    code: "publish_failed",
    reason:
      typeof result.body.error === "string"
        ? result.body.error
        : "Threads publish failed.",
  }
}
