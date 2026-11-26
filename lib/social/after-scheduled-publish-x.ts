import {
  channelAuthorised,
  resolveAuthorisedChannels,
  type ReviewNoteLike,
} from "../publishing/distribution-scope"
import { canonicalArticleUrl } from "./x-publish-policy"
import {
  publishApprovedTwitterPost,
  type TwitterPublishStore,
} from "./publish-twitter-post"

export type AfterPublishXArticle = {
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

export type AfterPublishXResult =
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
        | "no_approved_x"
        | "ambiguous_approved_x"
        | "publish_failed"
        | "channel_not_authorised"
        | "stale_scope"
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
    if (response.status >= 200 && response.status < 400) {
      return { ok: true }
    }
    return { ok: false, status: response.status }
  } catch {
    return { ok: false }
  }
}

async function verifyFeaturedImage(
  url: string | null,
  fetchImpl: typeof fetch,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!url) {
    return { ok: false, reason: "Featured image is missing." }
  }
  try {
    const response = await fetchImpl(url, { method: "GET", redirect: "follow" })
    if (response.status >= 200 && response.status < 400) {
      return { ok: true }
    }
    return {
      ok: false,
      reason: `Featured image HTTP ${response.status}`,
    }
  } catch {
    return { ok: false, reason: "Featured image request failed." }
  }
}

function selectApprovedXPost(
  posts: SocialPostLike[],
):
  | { ok: true; post: SocialPostLike }
  | { ok: false; code: "no_approved_x" | "ambiguous_approved_x"; reason: string } {
  const twitter = posts.filter((p) => p.platform === "twitter")
  const already = twitter.filter((p) => p.status === "published" || p.externalId)
  if (already.length > 0) {
    return {
      ok: false,
      code: "ambiguous_approved_x",
      reason:
        "An X post is already published or has an external id; not republishing.",
    }
  }
  const approved = twitter.filter((p) => p.status === "approved")
  if (approved.length === 0) {
    return {
      ok: false,
      code: "no_approved_x",
      reason: "No exact approved X announcement found. Will not regenerate.",
    }
  }
  if (approved.length > 1) {
    return {
      ok: false,
      code: "ambiguous_approved_x",
      reason: "Multiple approved X announcements; reconciliation required.",
    }
  }
  return { ok: true, post: approved[0]! }
}

/**
 * After a successful scheduled article publish: verify public URL + featured
 * image, locate the exact approved X announcement, confirm auth, publish,
 * and record outcome. Never regenerates or rewrites copy.
 */
export async function publishAuthorisedXAfterScheduledPublish(input: {
  article: AfterPublishXArticle
  socialPosts: SocialPostLike[]
  store: TwitterPublishStore
  createClient: () => {
    v2: {
      me: () => Promise<{ data?: { id?: string } }>
      tweet: (content: string) => Promise<{ data?: { id?: string } }>
    }
  }
  fetchImpl?: typeof fetch
  actor?: string
}): Promise<AfterPublishXResult> {
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

  if (!channelAuthorised(authorised.scope, "x")) {
    return {
      ok: true,
      skipped: true,
      reason: "X channel is not authorised for this article.",
    }
  }

  if (input.article.status !== "published") {
    return {
      ok: true,
      skipped: true,
      reason: "Article is not published.",
    }
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

  const selected = selectApprovedXPost(input.socialPosts)
  if (!selected.ok) {
    return {
      ok: false,
      code: selected.code,
      reason: selected.reason,
    }
  }

  const result = await publishApprovedTwitterPost({
    postId: selected.post.id,
    actor: input.actor ?? "scheduler:after-publish-x",
    store: input.store,
    createClient: input.createClient,
  })

  if (result.status >= 200 && result.status < 300 && result.body.ok) {
    const post = result.body.post as { externalId?: string } | undefined
    return {
      ok: true,
      skipped: false,
      postId: selected.post.id,
      externalId: post?.externalId,
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
        : "X publish failed after public verification.",
  }
}
