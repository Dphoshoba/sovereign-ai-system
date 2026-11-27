const DIRECTLY_EDITABLE_STATUSES = new Set([
  "draft",
  "review",
  "review-required",
])

export type EditorialSaveArticle = {
  title: string
  slug: string
  category: string
  excerpt: string | null
  content: string | null
  featuredImage: string | null
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
  status: string
}

export function buildEditorialSavePayload(
  article: EditorialSaveArticle,
  options: { statusChanged: boolean },
) {
  const payload: Record<string, unknown> = {
    title: article.title,
    slug: article.slug,
    category: article.category,
    excerpt: article.excerpt,
    content: article.content,
    featuredImage: article.featuredImage,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    seoKeywords: article.seoKeywords,
  }

  if (
    options.statusChanged &&
    DIRECTLY_EDITABLE_STATUSES.has(article.status)
  ) {
    payload.status = article.status
  }

  return payload
}

export function statusAfterPrepareForReview(
  currentStatus: string,
  result: { article?: { status?: unknown } | null },
): string {
  const returned = result.article?.status
  if (typeof returned === "string" && returned.trim()) return returned
  return currentStatus
}
