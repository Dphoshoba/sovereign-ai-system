import {
  channelAuthorised,
  resolveAuthorisedChannels,
  type ReviewNoteLike,
} from "../publishing/distribution-scope"
import { canonicalArticleUrl } from "./x-publish-policy"
import {
  publishApprovedLinkedInPost,
  type LinkedInPublishStore,
} from "./linkedin-publish"

export type AfterPublishLinkedInArticle = {
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

export type AfterPublishLinkedInResult =
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
        | "no_approved_linkedin"
        | "ambiguous_approved_linkedin"
        | "publish_failed"
        | "channel_not_authorised"
        | "stale_scope"
        | "preview_blocked"
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

function selectApprovedLinkedInPost(
  posts: SocialPostLike[],
):
  | { ok: true; post: SocialPostLike }
  | {
      ok: false
      code: "no_approved_linkedin" | "ambiguous_approved_linkedin"
      reason: string
    } {
  const linkedin = posts.filter((p) => p.platform === "linkedin")
  const already = linkedin.filter((p) => p.status === "published" || p.externalId)
  if (already.length > 0) {
    return {
      ok: false,
      code: "ambiguous_approved_linkedin",
      reason:
        "A LinkedIn post is already published or has an external id; not republishing.",
    }
  }
  const approved = linkedin.filter((p) => p.status === "approved")
  if (approved.length === 0) {
    return {
      ok: false,
      code: "no_approved_linkedin",
      reason: "No exact approved LinkedIn announcement found. Will not regenerate.",
    }
  }
  if (approved.length > 1) {
    return {
      ok: false,
      code: "ambiguous_approved_linkedin",
      reason: "Multiple approved LinkedIn announcements; reconciliation required.",
    }
  }
  return { ok: true, post: approved[0]! }
}

/**
 * After a successful scheduled article publish: if LinkedIn is authorised in
 * distribution scope, verify public URL + featured image, locate the exact
 * approved LinkedIn announcement, publish once, and record outcome.
 * Never regenerates or rewrites copy. Never posts from Preview.
 */
export async function publishAuthorisedLinkedInAfterScheduledPublish(input: {
  article: AfterPublishLinkedInArticle
  socialPosts: SocialPostLike[]
  store: LinkedInPublishStore
  fetchImpl?: typeof fetch
  actor?: string
}): Promise<AfterPublishLinkedInResult> {
  if (process.env.VERCEL_ENV === "preview") {
    return {
      ok: false,
      code: "preview_blocked",
      reason: "Preview environment does not publish live LinkedIn posts.",
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

  if (!channelAuthorised(authorised.scope, "linkedin")) {
    return {
      ok: true,
      skipped: true,
      reason: "LinkedIn channel is not authorised for this article.",
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

  const selected = selectApprovedLinkedInPost(input.socialPosts)
  if (!selected.ok) {
    return {
      ok: false,
      code: selected.code,
      reason: selected.reason,
    }
  }

  const result = await publishApprovedLinkedInPost({
    postId: selected.post.id,
    actor: input.actor ?? "scheduler:after-publish-linkedin",
    store: input.store,
    fetchImpl,
    requireCanonicalUrl: true,
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

  return {
    ok: false,
    code: "publish_failed",
    reason:
      typeof result.body.error === "string"
        ? result.body.error
        : "LinkedIn publish failed after public verification.",
  }
}
