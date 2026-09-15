import { createHash } from "node:crypto"

export type AuditableArticleState = {
  title: string
  excerpt?: string | null
  content?: string | null
  category: string
  seoTitle?: string | null
  seoDescription?: string | null
  seoKeywords?: string | null
  ctaType?: string | null
  ctaContent?: string | null
  ctaDestination?: string | null
}

function normalizeText(value?: string | null): string {
  return (value ?? "").replace(/\r\n?/g, "\n").trim()
}

export function canonicalizeSourceUrl(value: string): string {
  const url = new URL(value.trim())
  url.hash = ""
  url.protocol = url.protocol.toLowerCase()
  url.hostname = url.hostname.toLowerCase()
  url.searchParams.sort()

  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/+$/, "")
  }

  return url.toString()
}

export function computeArticleAuditFingerprint(
  article: AuditableArticleState,
  sourceUrls: string[],
): string {
  const canonicalSourceUrls = Array.from(
    new Set(sourceUrls.map(canonicalizeSourceUrl)),
  ).sort()

  const payload = {
    title: normalizeText(article.title),
    excerpt: normalizeText(article.excerpt),
    content: normalizeText(article.content),
    category: normalizeText(article.category),
    seoTitle: normalizeText(article.seoTitle),
    seoDescription: normalizeText(article.seoDescription),
    seoKeywords: normalizeText(article.seoKeywords),
    ctaType: normalizeText(article.ctaType),
    ctaContent: normalizeText(article.ctaContent),
    ctaDestination: normalizeText(article.ctaDestination),
    sourceUrls: canonicalSourceUrls,
  }

  return createHash("sha256").update(JSON.stringify(payload)).digest("hex")
}

/**
 * The auditable payload covers substantive article copy, classification, SEO,
 * explicit CTA fields when supplied, and the canonical current source URL set.
 * Routing/display-only fields such as slug, featuredImage, timestamps, status,
 * scores, and review notes are intentionally outside this revision identity.
 */
export const ARTICLE_AUDIT_FINGERPRINT_BOUNDARY = {
  included: [
    "title",
    "excerpt",
    "content",
    "category",
    "seoTitle",
    "seoDescription",
    "seoKeywords",
    "ctaType",
    "ctaContent",
    "ctaDestination",
    "sourceUrls",
  ],
  excluded: [
    "slug",
    "featuredImage",
    "timestamps",
    "status",
    "scores",
    "reviewNotes",
  ],
} as const
