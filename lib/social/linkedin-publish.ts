import { canonicalArticleUrl, checkArticleLink } from "./x-publish-policy"

/** Current LinkedIn Marketing API version (YYYYMM). */
export const LINKEDIN_API_VERSION = "202610"

/** Official Posts API create endpoint (replaces legacy /v2/posts for versioned APIs). */
export const LINKEDIN_POSTS_CREATE_URL = "https://api.linkedin.com/rest/posts"

export type LinkedInIntegrationConfig = {
  accessToken?: string
  memberUrn?: string | null
  expiresAt?: string | null
  scopes?: string
  memberName?: string | null
  openIdEnabled?: boolean
  providerStatus?: string
  refreshToken?: string | null
}

export type LinkedInPostRecord = {
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
    featuredImage: string | null
  } | null
}

export type LinkedInPublishBody = Record<string, unknown>

export type LinkedInPublishResult = {
  status: number
  body: LinkedInPublishBody
}

export type LinkedInPublishStore = {
  socialPost: {
    findUnique: (args: {
      where: { id: string }
      include: { article: true }
    }) => Promise<LinkedInPostRecord | null>
    update: (args: {
      where: { id: string }
      data: Record<string, unknown>
    }) => Promise<LinkedInPostRecord>
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

function failure(status: number, body: LinkedInPublishBody): LinkedInPublishResult {
  return { status, body }
}

/**
 * LinkedIn create responses return 201 with an empty body; the post URN is in
 * `x-restli-id` (case-insensitive). Also accept JSON `id`/`urn` when present.
 */
export function extractLinkedInPostId(
  response: Response,
  responseData: Record<string, unknown> | null,
): string | null {
  const headerId =
    response.headers.get("x-restli-id") ||
    response.headers.get("X-RestLi-Id") ||
    response.headers.get("x-restli-id".toUpperCase())
  if (headerId && headerId.trim()) return headerId.trim()

  if (responseData) {
    const id = responseData.id
    const urn = responseData.urn
    if (typeof id === "string" && id.trim()) return id.trim()
    if (typeof urn === "string" && urn.trim()) return urn.trim()
  }
  return null
}

export function isLinkedInTokenExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false
  const ts = new Date(expiresAt).getTime()
  if (Number.isNaN(ts)) return false
  return ts < Date.now()
}

export function buildLinkedInPostBody(input: {
  authorUrn: string
  commentary: string
}): Record<string, unknown> {
  return {
    author: input.authorUrn,
    commentary: input.commentary,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  }
}

async function resolveMemberUrn(
  accessToken: string,
  configuredUrn: string | null | undefined,
  fetchImpl: typeof fetch,
): Promise<string | null> {
  if (configuredUrn) return configuredUrn

  try {
    const profileResponse = await fetchImpl("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (profileResponse.ok) {
      const profile = (await profileResponse.json()) as { sub?: string }
      if (profile.sub) return `urn:li:person:${profile.sub}`
    }
  } catch {
    // OpenID userinfo unavailable
  }

  try {
    const meResponse = await fetchImpl("https://api.linkedin.com/v2/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (meResponse.ok) {
      const meData = (await meResponse.json()) as { id?: string }
      if (meData.id) return `urn:li:person:${meData.id}`
    }
  } catch {
    // /v2/me unavailable
  }

  return null
}

/**
 * Publish an approved LinkedIn SocialPost. Fail closed on Preview, missing
 * connection/identity, ambiguous API responses, and duplicate publishes.
 * Does not invent copy. Does not mark published without a confirmed URN.
 */
export async function publishApprovedLinkedInPost(input: {
  postId: string
  store: LinkedInPublishStore
  actor?: string
  fetchImpl?: typeof fetch
  /** When true, require canonical article URL inside the announcement copy. */
  requireCanonicalUrl?: boolean
}): Promise<LinkedInPublishResult> {
  const fetchImpl = input.fetchImpl ?? fetch

  if (process.env.VERCEL_ENV === "preview") {
    return failure(403, {
      ok: false,
      code: "preview_blocked",
      error: "Preview environment does not publish live LinkedIn posts.",
    })
  }

  const post = await input.store.socialPost.findUnique({
    where: { id: input.postId },
    include: { article: true },
  })

  if (!post) {
    return failure(404, { ok: false, error: "Post not found" })
  }

  if (post.platform !== "linkedin") {
    return failure(400, { ok: false, error: "Not a LinkedIn post" })
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

  if (!post.article || post.article.status !== "published") {
    return failure(403, {
      ok: false,
      error: "Linked article must be published before posting to LinkedIn.",
    })
  }

  if (!post.content || post.content.length < 1) {
    return failure(400, { ok: false, error: "LinkedIn post content is required." })
  }

  if (input.requireCanonicalUrl !== false) {
    const linkCheck = checkArticleLink(post.content, post.article.slug)
    if (!linkCheck.ok) {
      return failure(400, {
        ok: false,
        code: linkCheck.code,
        error:
          linkCheck.code === "missing_canonical_url"
            ? `LinkedIn announcement must include canonical URL ${canonicalArticleUrl(post.article.slug)}`
            : "LinkedIn announcement contains an incorrect article link.",
      })
    }
  }

  const integration = await input.store.externalIntegration.findUnique({
    where: { name: "LinkedIn" },
  })

  if (!integration || !integration.enabled) {
    return failure(503, {
      ok: false,
      code: "not_connected",
      error:
        "LinkedIn publishing is not connected. Authorize via /api/social/oauth/linkedin/authorize.",
    })
  }

  const config = (integration.config ?? {}) as LinkedInIntegrationConfig
  const accessToken = config.accessToken

  if (!accessToken) {
    return failure(503, {
      ok: false,
      code: "missing_token",
      error: "LinkedIn access token is missing. Re-authorize.",
    })
  }

  if (isLinkedInTokenExpired(config.expiresAt)) {
    return failure(503, {
      ok: false,
      code: "token_expired",
      error: "LinkedIn access token has expired. Re-authorize.",
    })
  }

  const authorUrn = await resolveMemberUrn(
    accessToken,
    config.memberUrn,
    fetchImpl,
  )

  if (!authorUrn) {
    return failure(503, {
      ok: false,
      code: "member_identity_unavailable",
      error:
        "LinkedIn member identity could not be resolved. Enable Sign In with LinkedIn using OpenID Connect (openid profile) and reconnect.",
    })
  }

  const requestBody = buildLinkedInPostBody({
    authorUrn,
    commentary: post.content,
  })

  let linkedinResponse: Response
  try {
    linkedinResponse = await fetchImpl(LINKEDIN_POSTS_CREATE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": LINKEDIN_API_VERSION,
        "X-RestLi-Method": "create",
      },
      body: JSON.stringify(requestBody),
    })
  } catch (error) {
    await input.store.operationalEvent.create({
      data: {
        type: "social_publish_ambiguous",
        source: "linkedin",
        title: "LinkedIn publish transport failure",
        message: error instanceof Error ? error.message : "fetch failed",
        severity: "high",
        status: "new",
        entityType: "SocialPost",
        entityId: post.id,
        payload: {
          articleId: post.articleId,
          actor: input.actor ?? null,
          ambiguous: true,
        },
      },
    })
    return failure(502, {
      ok: false,
      code: "ambiguous_transport",
      error:
        "LinkedIn request failed before a confirmed response. Post left unconfirmed; do not retry blindly.",
    })
  }

  const rawText = await linkedinResponse.text()
  let responseData: Record<string, unknown> | null = null
  if (rawText.trim()) {
    try {
      responseData = JSON.parse(rawText) as Record<string, unknown>
    } catch {
      responseData = null
    }
  }

  if (!linkedinResponse.ok) {
    await input.store.operationalEvent.create({
      data: {
        type: "social_publish_failed",
        source: "linkedin",
        title: "LinkedIn publish failed",
        message: rawText.slice(0, 500),
        severity: "high",
        status: "new",
        entityType: "SocialPost",
        entityId: post.id,
        payload: {
          articleId: post.articleId,
          httpStatus: linkedinResponse.status,
        },
      },
    })
    return failure(502, {
      ok: false,
      code: "linkedin_api_error",
      error: `LinkedIn API error: ${rawText.slice(0, 200)}`,
    })
  }

  const linkedinUrn = extractLinkedInPostId(linkedinResponse, responseData)

  if (!linkedinUrn) {
    await input.store.operationalEvent.create({
      data: {
        type: "social_publish_ambiguous",
        source: "linkedin",
        title: "LinkedIn publish returned no identifier",
        message:
          "HTTP success without x-restli-id / body id. Left unconfirmed; do not retry blindly.",
        severity: "high",
        status: "new",
        entityType: "SocialPost",
        entityId: post.id,
        payload: {
          articleId: post.articleId,
          httpStatus: linkedinResponse.status,
          ambiguous: true,
        },
      },
    })
    return failure(502, {
      ok: false,
      code: "ambiguous_response",
      error:
        "LinkedIn did not return a post identifier (expected x-restli-id). Post left unconfirmed.",
    })
  }

  const updated = await input.store.socialPost.update({
    where: { id: post.id },
    data: {
      status: "published",
      externalId: linkedinUrn,
      publishedAt: new Date(),
    },
  })

  await input.store.operationalEvent.create({
    data: {
      type: "social_publish",
      source: "linkedin",
      title: "LinkedIn post published",
      message: `URN ${linkedinUrn}`,
      severity: "info",
      status: "new",
      entityType: "SocialPost",
      entityId: post.id,
      payload: {
        linkedinUrn,
        articleId: post.articleId,
        actor: input.actor ?? null,
        publicUrl: `https://www.linkedin.com/feed/update/${linkedinUrn}`,
      },
    },
  })

  return {
    status: 200,
    body: {
      ok: true,
      post: updated,
      externalId: linkedinUrn,
      publicUrl: `https://www.linkedin.com/feed/update/${linkedinUrn}`,
    },
  }
}
