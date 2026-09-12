import {
  scoreProvidedSources,
  type SourceRecord,
} from "./source-collector"

const MARKDOWN_LINK = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gi
const BARE_URL = /https?:\/\/[^\s)\]>'"]+/gi
const IMAGE_URL = /\.(png|jpe?g|gif|webp|svg|ico)(\?|#|$)/i

export type StoredArticleSource = {
  title?: string | null
  url?: string | null
  sourceType?: string | null
  authorityScore?: number | null
  trustScore?: number | null
}

function stripTrailingPunctuation(url: string): string {
  return url.replace(/[.,;:!?]+$/g, "")
}

function isUsableSourceUrl(url: string, featuredImage?: string | null): boolean {
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false
  if (IMAGE_URL.test(url)) return false
  if (featuredImage && url === featuredImage) return false
  try {
    const parsed = new URL(url)
    return parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1"
  } catch {
    return false
  }
}

function hostnameTitle(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export function extractArticleSourceLinks(input: {
  content?: string | null
  excerpt?: string | null
  featuredImage?: string | null
  researchSources?: StoredArticleSource[] | null
}): SourceRecord[] {
  const collected: SourceRecord[] = []
  const seen = new Set<string>()

  const add = (source: SourceRecord) => {
    const url = stripTrailingPunctuation(source.url.trim())
    if (!isUsableSourceUrl(url, input.featuredImage)) return
    if (seen.has(url)) return
    seen.add(url)
    collected.push({
      ...source,
      url,
    })
  }

  for (const source of input.researchSources ?? []) {
    if (!source.url) continue
    add({
      title: source.title?.trim() || hostnameTitle(source.url),
      url: source.url,
      sourceType: source.sourceType || "stored-research-source",
      authorityScore: source.authorityScore ?? undefined,
      trustScore: source.trustScore ?? undefined,
      relevanceScore: 70,
    })
  }

  const text = [input.excerpt, input.content].filter(Boolean).join("\n")

  for (const match of text.matchAll(MARKDOWN_LINK)) {
    add({
      title: match[1].trim() || hostnameTitle(match[2]),
      url: match[2],
      sourceType: "article-link",
      relevanceScore: 70,
    })
  }

  for (const match of text.matchAll(BARE_URL)) {
    add({
      title: hostnameTitle(match[0]),
      url: match[0],
      sourceType: "article-link",
      relevanceScore: 70,
    })
  }

  return scoreProvidedSources(collected)
}
