/**
 * EV-EDITORIAL-07-P5 — social + operational monitoring helpers.
 * Preserves dual social gate: article publish ≠ social publish.
 */

export type SocialOpsPost = {
  id: string
  platform: string
  status: string
  publishedAt?: Date | string | null
  targetUrl?: string | null
}

export type SocialOpsArticleSignal = {
  articleId: string
  articleStatus: string
  canonicalPath: string
  published: boolean
  socialDrafts: number
  socialApproved: number
  socialPublished: number
  missingCanonicalUrl: boolean
  needsSocialApproval: boolean
  duplicateRisk: boolean
  alerts: string[]
}

export function buildCanonicalArticlePath(slug: string): string {
  return `/blog/${slug.replace(/^\/+/, "")}`
}

export function inspectSocialOpsForArticle(input: {
  articleId: string
  slug: string
  status: string
  posts: SocialOpsPost[]
}): SocialOpsArticleSignal {
  const canonicalPath = buildCanonicalArticlePath(input.slug)
  const drafts = input.posts.filter((p) => p.status === "draft")
  const approved = input.posts.filter((p) => p.status === "approved")
  const published = input.posts.filter(
    (p) => p.status === "published" || Boolean(p.publishedAt),
  )
  const alerts: string[] = []
  const publishedArticle = input.status === "published"
  const missingCanonicalUrl = drafts.some(
    (post) =>
      typeof post.targetUrl === "string" &&
      post.targetUrl.length > 0 &&
      !post.targetUrl.includes(canonicalPath),
  )

  if (publishedArticle && drafts.length === 0 && published.length === 0) {
    alerts.push("Published article has no social drafts yet.")
  }
  if (drafts.length > 0) {
    alerts.push("Social drafts await separate human approval.")
  }
  if (missingCanonicalUrl) {
    alerts.push("A social draft is missing the canonical article URL.")
  }

  const byPlatform = new Map<string, number>()
  for (const post of published) {
    byPlatform.set(post.platform, (byPlatform.get(post.platform) || 0) + 1)
  }
  const duplicateRisk = [...byPlatform.values()].some((count) => count > 1)
  if (duplicateRisk) {
    alerts.push("Duplicate published social posts detected for a platform.")
  }

  return {
    articleId: input.articleId,
    articleStatus: input.status,
    canonicalPath,
    published: publishedArticle,
    socialDrafts: drafts.length,
    socialApproved: approved.length,
    socialPublished: published.length,
    missingCanonicalUrl,
    needsSocialApproval: drafts.length > 0,
    duplicateRisk,
    alerts,
  }
}
