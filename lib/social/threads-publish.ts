import { canonicalArticleUrl, checkArticleLink } from "./x-publish-policy"
import {
  THREADS_GRAPH_BASE,
  THREADS_INTEGRATION_NAME,
  isThreadsTokenExpired,
  type ThreadsIntegrationConfig,
} from "./threads-oauth"

export type ThreadsPostRecord = {
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
  } | null
}

export type ThreadsPublishBody = Record<string, unknown>

export type ThreadsPublishResult = {
  status: number
  body: ThreadsPublishBody
}

export type ThreadsPublishStore = {
  socialPost: {
    findUnique: (args: {
      where: { id: string }
      include: { article: { select: { status: true; slug: true; id: true } } }
    }) => Promise<ThreadsPostRecord | null>
    update: (args: {
      where: { id: string }
      data: Record<string, unknown>
    }) => Promise<ThreadsPostRecord>
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

export type ThreadsHttp = {
  fetch: typeof fetch
}

function failure(status: number, body: ThreadsPublishBody): ThreadsPublishResult {
  return { status, body }
}

export function buildThreadsContainerUrl(input: {
  userId: string
  text: string
  accessToken: string
}): string {
  const params = new URLSearchParams({
    media_type: "TEXT",
    text: input.text,
    access_token: input.accessToken,
  })
  return `${THREADS_GRAPH_BASE}/${input.userId}/threads?${params.toString()}`
}

export function buildThreadsPublishUrl(input: {
  userId: string
  creationId: string
  accessToken: string
}): string {
  const params = new URLSearchParams({
    creation_id: input.creationId,
    access_token: input.accessToken,
  })
  return `${THREADS_GRAPH_BASE}/${input.userId}/threads_publish?${params.toString()}`
}

export function buildThreadsPublicUrl(input: {
  username?: string | null
  mediaId: string
}): string | null {
  if (!input.username) return null
  return `https://www.threads.net/@${input.username}/post/${input.mediaId}`
}

/**
 * Governed Threads publication for an approved SocialPost.
 * Injectable fetch for isolated mocked validation. Never logs tokens.
 */
export async function publishApprovedThreadsPost(input: {
  postId: string
  store: ThreadsPublishStore
  http?: ThreadsHttp
  requireCanonicalUrl?: boolean
  now?: Date
}): Promise<ThreadsPublishResult> {
  const http = input.http || { fetch: globalThis.fetch.bind(globalThis) }
  const now = input.now || new Date()
  const requireCanonical = input.requireCanonicalUrl !== false

  const post = await input.store.socialPost.findUnique({
    where: { id: input.postId },
    include: { article: { select: { status: true, slug: true, id: true } } },
  })

  if (!post) {
    return failure(404, { ok: false, error: "Post not found" })
  }

  if (post.platform !== "threads") {
    return failure(400, { ok: false, error: "Not a Threads post" })
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
      error: "Linked article must be published before posting to Threads.",
    })
  }

  if (requireCanonical && post.article?.slug) {
    const link = checkArticleLink(post.content, post.article.slug)
    if (!link.ok) {
      const canonical = canonicalArticleUrl(post.article.slug)
      return failure(400, {
        ok: false,
        code: link.code,
        error:
          link.code === "missing_canonical_url"
            ? `Threads announcement must include canonical URL ${canonical}`
            : "Threads announcement contains an incorrect article link.",
      })
    }
  }

  const integration = await input.store.externalIntegration.findUnique({
    where: { name: THREADS_INTEGRATION_NAME },
  })

  if (!integration || !integration.enabled) {
    return failure(503, {
      ok: false,
      error:
        "Threads is not connected. Authorize via /api/social/oauth/threads/authorize.",
    })
  }

  const config = (integration.config || {}) as ThreadsIntegrationConfig
  const accessToken = config.accessToken
  const userId = config.userId

  if (!accessToken || !userId) {
    return failure(503, {
      ok: false,
      error: "Threads access token or user ID missing.",
    })
  }

  if (isThreadsTokenExpired(config.expiresAt)) {
    return failure(503, {
      ok: false,
      error: "Threads access token has expired. Re-authorize.",
    })
  }

  const containerUrl = buildThreadsContainerUrl({
    userId,
    text: post.content,
    accessToken,
  })

  let containerResponse: Response
  let containerData: Record<string, unknown>
  try {
    containerResponse = await http.fetch(containerUrl, { method: "POST" })
    containerData = (await containerResponse.json()) as Record<string, unknown>
  } catch (error) {
    await input.store.operationalEvent.create({
      data: {
        type: "social_publish_failed",
        source: "threads",
        title: "Threads container request failed",
        message:
          error instanceof Error ? error.message.slice(0, 500) : "network error",
        severity: "high",
        status: "new",
        entityType: "SocialPost",
        entityId: post.id,
        payload: { articleId: post.articleId, stage: "container" },
      },
    })
    return failure(502, {
      ok: false,
      error: "Threads container creation failed: network error",
    })
  }

  const creationId =
    typeof containerData.id === "string" ? containerData.id : null

  if (!containerResponse.ok || !creationId) {
    await input.store.operationalEvent.create({
      data: {
        type: "social_publish_failed",
        source: "threads",
        title: "Threads container creation failed",
        message: JSON.stringify(containerData).slice(0, 500),
        severity: "high",
        status: "new",
        entityType: "SocialPost",
        entityId: post.id,
        payload: { articleId: post.articleId, stage: "container" },
      },
    })
    return failure(502, {
      ok: false,
      error: `Threads container creation failed: ${JSON.stringify(containerData).slice(0, 200)}`,
    })
  }

  const publishUrl = buildThreadsPublishUrl({
    userId,
    creationId,
    accessToken,
  })

  let publishResponse: Response
  let publishData: Record<string, unknown>
  try {
    publishResponse = await http.fetch(publishUrl, { method: "POST" })
    publishData = (await publishResponse.json()) as Record<string, unknown>
  } catch (error) {
    await input.store.operationalEvent.create({
      data: {
        type: "social_publish_failed",
        source: "threads",
        title: "Threads publish request failed",
        message:
          error instanceof Error ? error.message.slice(0, 500) : "network error",
        severity: "high",
        status: "new",
        entityType: "SocialPost",
        entityId: post.id,
        payload: { creationId, articleId: post.articleId, stage: "publish" },
      },
    })
    return failure(502, {
      ok: false,
      error: "Threads publish failed: network error",
      creationId,
    })
  }

  const threadsMediaId =
    typeof publishData.id === "string" ? publishData.id : null

  if (!publishResponse.ok || !threadsMediaId) {
    await input.store.operationalEvent.create({
      data: {
        type: "social_publish_failed",
        source: "threads",
        title: "Threads publish failed",
        message: JSON.stringify(publishData).slice(0, 500),
        severity: "high",
        status: "new",
        entityType: "SocialPost",
        entityId: post.id,
        payload: { creationId, articleId: post.articleId, stage: "publish" },
      },
    })
    return failure(502, {
      ok: false,
      error: `Threads publish failed: ${JSON.stringify(publishData).slice(0, 200)}`,
      creationId,
    })
  }

  const publicUrl = buildThreadsPublicUrl({
    username: config.username,
    mediaId: threadsMediaId,
  })

  const updated = await input.store.socialPost.update({
    where: { id: post.id },
    data: {
      status: "published",
      externalId: threadsMediaId,
      publishedAt: now,
    },
  })

  await input.store.operationalEvent.create({
    data: {
      type: "social_publish",
      source: "threads",
      title: "Threads post published",
      message: `Media ID ${threadsMediaId}`,
      severity: "info",
      status: "new",
      entityType: "SocialPost",
      entityId: post.id,
      payload: {
        threadsMediaId,
        creationId,
        publicUrl,
        articleId: post.articleId,
      },
    },
  })

  return {
    status: 200,
    body: {
      ok: true,
      post: updated,
      externalId: threadsMediaId,
      publicUrl,
      creationId,
    },
  }
}
