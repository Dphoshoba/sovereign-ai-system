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
  publishApprovedFacebookPost,
  type FacebookPublishStore,
} from "./facebook-publish"

export type AfterPublishFacebookArticle = {
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

export type AfterPublishFacebookResult =
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
        | "no_approved_facebook"
        | "ambiguous_approved_facebook"
        | "publish_failed"
        | "channel_not_authorised"
        | "stale_scope"
        | "preview_blocked"
        | "claim_blocked"
        | "ambiguous_unresolved"
        | "page_not_selected"
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

function selectApprovedFacebookPost(
  posts: SocialPostLike[],
):
  | { ok: true; post: SocialPostLike }
  | {
      ok: false
      code: "no_approved_facebook" | "ambiguous_approved_facebook"
      reason: string
    } {
  const facebook = posts.filter((p) => p.platform === "facebook")
  const already = facebook.filter(
    (p) => p.status === "published" || p.externalId,
  )
  if (already.length > 0) {
    return {
      ok: false,
      code: "ambiguous_approved_facebook",
      reason:
        "A Facebook post is already published or has an external id; not republishing.",
    }
  }
  const approved = facebook.filter((p) => p.status === "approved")
  if (approved.length === 0) {
    return {
      ok: false,
      code: "no_approved_facebook",
      reason:
        "No exact approved Facebook announcement found. Will not regenerate.",
    }
  }
  if (approved.length > 1) {
    return {
      ok: false,
      code: "ambiguous_approved_facebook",
      reason: "Multiple approved Facebook announcements; reconciliation required.",
    }
  }
  return { ok: true, post: approved[0]! }
}

export async function publishAuthorisedFacebookAfterScheduledPublish(input: {
  article: AfterPublishFacebookArticle
  socialPosts: SocialPostLike[]
  store: FacebookPublishStore
  fetchImpl?: typeof fetch
  actor?: string
  openClaim?: ChannelExecutionClaim | null
  priorOutcome?: ChannelExecutionOutcome | null
}): Promise<AfterPublishFacebookResult> {
  if (process.env.VERCEL_ENV === "preview") {
    return {
      ok: false,
      code: "preview_blocked",
      reason: "Preview environment does not publish live Facebook posts.",
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

  if (!channelAuthorised(authorised.scope, "facebook")) {
    return {
      ok: true,
      skipped: true,
      reason: "Facebook channel is not authorised for this article.",
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

  const selected = selectApprovedFacebookPost(input.socialPosts)
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
          channel: "facebook",
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
    channel: "facebook",
    articleId: input.article.id,
    payloadId: selected.post.id,
  })
  await recordChannelClaim({
    store: input.store,
    channel: "facebook",
    articleId: input.article.id,
    payloadId: selected.post.id,
    actor: input.actor || "scheduler:publish-due-articles",
  })

  const result = await publishApprovedFacebookPost({
    postId: selected.post.id,
    store: input.store,
    http: { fetch: fetchImpl },
    requireCanonicalUrl: true,
  })

  await recordChannelOutcome({
    store: input.store,
    outcome: {
      v: 1,
      channel: "facebook",
      articleId: input.article.id,
      payloadId: selected.post.id,
      claimId,
      status:
        result.body.ok && (result.body.externalId || result.body.alreadyPublished)
          ? result.body.alreadyPublished
            ? "skipped_already_published"
            : "provider_accepted"
          : result.body.code === "ambiguous_provider_outcome"
            ? "ambiguous"
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

  if (result.body.code === "page_not_selected") {
    return {
      ok: false,
      code: "page_not_selected",
      reason: "Facebook Page not selected. Complete explicit Page selection.",
    }
  }

  if (result.body.code === "ambiguous_provider_outcome") {
    return {
      ok: false,
      code: "ambiguous_unresolved",
      reason:
        typeof result.body.error === "string"
          ? result.body.error
          : "Ambiguous Facebook provider outcome; reconcile before retry.",
    }
  }

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
        : "Facebook publish failed.",
  }
}
