import {
  channelAuthorised,
  resolveAuthorisedChannels,
  type ReviewNoteLike,
} from "../publishing/distribution-scope"
import { canonicalArticleUrl } from "../social/x-publish-policy"
import {
  sendApprovedNewsletter,
  type NewsletterSendStore,
} from "./send-newsletter"

export type AfterPublishNewsletterArticle = {
  id: string
  slug: string
  status: string
  featuredImage: string | null
  reviewNotes: ReviewNoteLike[]
}

export type NewsletterLike = {
  id: string
  articleId: string
  status: string
  subject: string
}

export type AfterPublishNewsletterResult =
  | { ok: true; skipped: true; reason: string }
  | {
      ok: true
      skipped: false
      newsletterId: string
      status: number
      body: Record<string, unknown>
    }
  | {
      ok: false
      reason: string
      code:
        | "public_verify_failed"
        | "featured_image_verify_failed"
        | "no_approved_newsletter"
        | "ambiguous_approved_newsletter"
        | "send_failed"
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

function selectApprovedNewsletter(
  rows: NewsletterLike[],
):
  | { ok: true; newsletter: NewsletterLike }
  | {
      ok: false
      code: "no_approved_newsletter" | "ambiguous_approved_newsletter"
      reason: string
    } {
  const approved = rows.filter(
    (n) => n.status === "approved" || n.status === "partially-sent",
  )
  const alreadySent = rows.filter((n) => n.status === "sent")
  if (alreadySent.length > 0 && approved.length === 0) {
    return {
      ok: false,
      code: "no_approved_newsletter",
      reason: "Newsletter already sent; not resending.",
    }
  }
  if (approved.length === 0) {
    return {
      ok: false,
      code: "no_approved_newsletter",
      reason:
        "No exact approved newsletter found for this article. Will not regenerate or invent one.",
    }
  }
  if (approved.length > 1) {
    return {
      ok: false,
      code: "ambiguous_approved_newsletter",
      reason: "Multiple approved newsletters; reconciliation required.",
    }
  }
  return { ok: true, newsletter: approved[0]! }
}

/**
 * After scheduled publish: if newsletter is in distribution scope, verify
 * public article + featured image, locate the exact approved newsletter,
 * and send via the governed list path. Never regenerates newsletter copy.
 */
export async function sendAuthorisedNewsletterAfterScheduledPublish(input: {
  article: AfterPublishNewsletterArticle
  newsletters: NewsletterLike[]
  store: NewsletterSendStore
  origin?: string
  actor?: string
  fetchImpl?: typeof fetch
  env?: NodeJS.ProcessEnv
  createClient?: (apiKey: string) => {
    emails: {
      send: (payload: Record<string, unknown>) => Promise<{
        data: { id?: string } | null
        error: { message?: string } | null
      }>
    }
  }
}): Promise<AfterPublishNewsletterResult> {
  const env = input.env ?? process.env
  if (env.VERCEL_ENV === "preview") {
    return {
      ok: false,
      code: "preview_blocked",
      reason: "Preview environment does not send live newsletter lists.",
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

  if (!channelAuthorised(authorised.scope, "newsletter")) {
    return {
      ok: true,
      skipped: true,
      reason: "Newsletter channel is not authorised for this article.",
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

  const selected = selectApprovedNewsletter(input.newsletters)
  if (!selected.ok) {
    return {
      ok: false,
      code: selected.code,
      reason: selected.reason,
    }
  }

  const result = await sendApprovedNewsletter({
    newsletterId: selected.newsletter.id,
    actor: input.actor ?? "scheduler:after-publish-newsletter",
    origin: input.origin ?? "https://www.echoesandvisions.com",
    store: input.store,
    mode: "list",
    env,
    createClient: input.createClient,
  })

  if (result.status >= 200 && result.status < 300 && result.body.ok) {
    return {
      ok: true,
      skipped: false,
      newsletterId: selected.newsletter.id,
      status: result.status,
      body: result.body,
    }
  }

  return {
    ok: false,
    code: "send_failed",
    reason:
      typeof result.body.error === "string"
        ? result.body.error
        : typeof result.body.code === "string"
          ? result.body.code
          : "Newsletter send failed after public verification.",
  }
}
