import { canonicalArticleUrl, checkArticleLink } from "./x-publish-policy"
import {
  DEFAULT_FACEBOOK_GRAPH_VERSION,
  FACEBOOK_INTEGRATION_NAME,
  facebookGraphBase,
  isFacebookTokenExpired,
  type FacebookIntegrationConfig,
} from "./facebook-oauth"

export type FacebookPostRecord = {
  id: string
  platform: string
  content: string
  status: string
  externalId: string | null
  articleId: string | null
  article: {
    id: string
    status: string
    slug: string
    title?: string | null
  } | null
}

export type FacebookPublishBody = Record<string, unknown>

export type FacebookPublishResult = {
  status: number
  body: FacebookPublishBody
}

export type FacebookPublishStore = {
  socialPost: {
    findUnique: (args: {
      where: { id: string }
      include: {
        article: { select: { status: true; slug: true; id: true; title: true } }
      }
    }) => Promise<FacebookPostRecord | null>
    update: (args: {
      where: { id: string }
      data: Record<string, unknown>
    }) => Promise<FacebookPostRecord>
  }
  externalIntegration: {
    findUnique: (args: {
      where: { name: string }
    }) => Promise<{
      name: string
      enabled: boolean
      status: string
      config: unknown
    } | null>
  }
  operationalEvent: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>
  }
}

export type FacebookHttp = {
  fetch: typeof fetch
}

function failure(
  status: number,
  body: FacebookPublishBody,
): FacebookPublishResult {
  return { status, body }
}

export function buildFacebookFeedPublishUrl(input: {
  pageId: string
  graphVersion?: string
}): string {
  const version = input.graphVersion || DEFAULT_FACEBOOK_GRAPH_VERSION
  return `${facebookGraphBase(version)}/${input.pageId}/feed`
}

export function buildFacebookFeedBody(input: {
  message: string
  pageAccessToken: string
  link?: string | null
}): URLSearchParams {
  const body = new URLSearchParams({
    message: input.message,
    access_token: input.pageAccessToken,
  })
  if (input.link) body.append("link", input.link)
  return body
}

export function extractFacebookPostId(
  data: Record<string, unknown> | null,
): string | null {
  if (!data) return null
  if (typeof data.id === "string" && data.id.trim()) return data.id.trim()
  return null
}

/**
 * Governed Facebook Page publication for an approved SocialPost.
 * Uses canonical /blog/{slug} link only — never /blog/{category}/{slug}.
 */
export async function publishApprovedFacebookPost(input: {
  postId: string
  store: FacebookPublishStore
  http?: FacebookHttp
  requireCanonicalUrl?: boolean
  graphVersion?: string
  now?: Date
}): Promise<FacebookPublishResult> {
  const http = input.http || { fetch: globalThis.fetch.bind(globalThis) }
  const now = input.now || new Date()
  const requireCanonical = input.requireCanonicalUrl !== false
  const graphVersion = input.graphVersion || DEFAULT_FACEBOOK_GRAPH_VERSION

  const post = await input.store.socialPost.findUnique({
    where: { id: input.postId },
    include: {
      article: { select: { status: true, slug: true, id: true, title: true } },
    },
  })

  if (!post) {
    return failure(404, { ok: false, error: "Post not found" })
  }

  if (post.platform !== "facebook") {
    return failure(400, { ok: false, error: "Not a Facebook post" })
  }

  if (post.status === "published" || post.externalId) {
    return {
      status: 200,
      body: {
        ok: true,
        alreadyPublished: true,
        externalId: post.externalId,
        post,
      },
    }
  }

  if (post.status !== "approved") {
    return failure(403, {
      ok: false,
      error: "Social post must be approved before publishing.",
    })
  }

  if (post.article && post.article.status !== "published") {
    return failure(403, {
      ok: false,
      error: "Linked article must be published before posting to Facebook.",
    })
  }

  if (requireCanonical && post.article?.slug) {
    const link = checkArticleLink(post.content, post.article.slug)
    if (!link.ok) {
      const canonical = canonicalArticleUrl(post.article.slug)
      return failure(link.code === "incorrect_article_link" ? 422 : 400, {
        ok: false,
        code: link.code,
        error:
          link.code === "missing_canonical_url"
            ? `Facebook announcement must include canonical URL ${canonical}`
            : "Post content contains a non-canonical article link. Use /blog/{slug} only — never /blog/{category}/{slug}.",
      })
    }
  }

  const integration = await input.store.externalIntegration.findUnique({
    where: { name: FACEBOOK_INTEGRATION_NAME },
  })

  if (!integration || !integration.enabled) {
    return failure(503, {
      ok: false,
      error:
        "Facebook is not connected. Authorize via /api/social/oauth/facebook/authorize.",
    })
  }

  const config = (integration.config || {}) as FacebookIntegrationConfig
  const pageToken = config.pageAccessToken
  const pageId = config.pageId

  if (!pageToken || !pageId) {
    return failure(503, {
      ok: false,
      code: "page_not_selected",
      error: "Facebook Page not selected. Complete Page selection.",
    })
  }

  if (isFacebookTokenExpired(config.expiresAt)) {
    return failure(503, {
      ok: false,
      error: "Facebook access token has expired. Re-authorize.",
    })
  }

  const articleUrl = post.article?.slug
    ? canonicalArticleUrl(post.article.slug)
    : null

  const feedUrl = buildFacebookFeedPublishUrl({ pageId, graphVersion })
  const body = buildFacebookFeedBody({
    message: post.content,
    pageAccessToken: pageToken,
    link: articleUrl,
  })

  let fbResponse: Response
  let fbData: Record<string, unknown>
  try {
    fbResponse = await http.fetch(feedUrl, { method: "POST", body })
    fbData = (await fbResponse.json()) as Record<string, unknown>
  } catch (error) {
    await input.store.operationalEvent.create({
      data: {
        type: "social_publish_failed",
        source: "facebook",
        title: "Facebook publish request failed",
        message:
          error instanceof Error ? error.message.slice(0, 500) : "network error",
        severity: "high",
        status: "new",
        entityType: "SocialPost",
        entityId: post.id,
        payload: { articleId: post.articleId, pageId, stage: "feed" },
      },
    })
    return failure(502, {
      ok: false,
      code: "provider_network_error",
      error: "Facebook publish failed: network error",
    })
  }

  const fbPostId = extractFacebookPostId(fbData)

  if (!fbResponse.ok || !fbPostId) {
    // Ambiguous: HTTP ok without id, or error payload without definitive id.
    const ambiguous = fbResponse.ok && !fbPostId
    await input.store.operationalEvent.create({
      data: {
        type: "social_publish_failed",
        source: "facebook",
        title: ambiguous
          ? "Facebook publish ambiguous outcome"
          : "Facebook publish failed",
        message: JSON.stringify(fbData).slice(0, 500),
        severity: "high",
        status: "new",
        entityType: "SocialPost",
        entityId: post.id,
        payload: {
          articleId: post.articleId,
          pageId,
          stage: "feed",
          ambiguous,
          httpOk: fbResponse.ok,
        },
      },
    })
    return failure(ambiguous ? 502 : 502, {
      ok: false,
      code: ambiguous ? "ambiguous_provider_outcome" : "provider_error",
      error: ambiguous
        ? "Facebook returned success without a post id; not marked published."
        : `Facebook API error: ${(fbData.error as { message?: string } | undefined)?.message || JSON.stringify(fbData).slice(0, 200)}`,
    })
  }

  const updated = await input.store.socialPost.update({
    where: { id: post.id },
    data: {
      status: "published",
      externalId: fbPostId,
      publishedAt: now,
    },
  })

  await input.store.operationalEvent.create({
    data: {
      type: "social_publish",
      source: "facebook",
      title: "Facebook post published",
      message: `Post ID ${fbPostId} on page ${pageId}`,
      severity: "info",
      status: "new",
      entityType: "SocialPost",
      entityId: post.id,
      payload: {
        fbPostId,
        pageId,
        pageName: config.pageName ?? null,
        articleId: post.articleId,
        link: articleUrl,
      },
    },
  })

  return {
    status: 200,
    body: {
      ok: true,
      post: updated,
      externalId: fbPostId,
      pageId,
      link: articleUrl,
    },
  }
}
