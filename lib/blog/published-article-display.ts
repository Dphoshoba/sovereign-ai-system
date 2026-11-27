import { PUBLICATION_TIME_ZONE } from "../publishing/adelaide-time"

/**
 * Display-only helpers for the public blog article renderer.
 * These functions must never mutate stored Article Markdown, ResearchSource
 * rows, fingerprints, audits, or publication state.
 */

export type ResearchSourceDisplay = {
  title?: string | null
  url?: string | null
  publisher?: string | null
}

export type DisplaySource = {
  index: number
  id: string
  url: string
  label: string
}

export type PublicArticleDateInput = {
  status: string
  publishedAt?: Date | string | null
  scheduledFor?: Date | string | null
}

const CITATION_PLACEHOLDER = "\u0000PH"
const MARKDOWN_LINK_OR_IMAGE = /!?\[[^\]]*]\([^)]+\)/g
const HTTP_URL = /https?:\/\/[^\s<>"')]+/i
const NUMBERED_SOURCE_LINE =
  /^\s*(?:\[(\d+)\]|(\d+)[.)])\s+(.+?)\s*$/
const SOURCES_HEADING = /^##[ \t]+Sources[ \t]*$/i
const NEXT_SECTION_HEADING = /^#{1,2}[ \t]+\S/

export function normalizeHeadingText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase()
}

export function suppressDuplicateLeadingH1(
  markdown: string,
  title: string,
): string {
  const match = markdown.match(/^\s*#(?!#)\s+(.+?)(?:\r?\n|$)/)
  if (!match) return markdown

  if (normalizeHeadingText(match[1]) !== normalizeHeadingText(title)) {
    return markdown
  }

  return markdown.slice(match[0].length).replace(/^\s+/, "")
}

export function splitMarkdownSourcesSection(markdown: string): {
  body: string
  sourcesMarkdown: string | null
} {
  const lines = markdown.split(/\r?\n/)
  const headingIndex = lines.findIndex((line) => SOURCES_HEADING.test(line))

  if (headingIndex === -1) {
    return { body: markdown, sourcesMarkdown: null }
  }

  const afterHeading = lines.slice(headingIndex + 1)
  const nextHeadingOffset = afterHeading.findIndex(
    (line) => NEXT_SECTION_HEADING.test(line) && !SOURCES_HEADING.test(line),
  )
  const sourceLines =
    nextHeadingOffset === -1
      ? afterHeading
      : afterHeading.slice(0, nextHeadingOffset)
  const remainder =
    nextHeadingOffset === -1 ? [] : afterHeading.slice(nextHeadingOffset)

  const body = [...lines.slice(0, headingIndex), ...remainder]
    .join("\n")
    .replace(/\s+$/, "")
  const sourcesMarkdown = [lines[headingIndex], ...sourceLines]
    .join("\n")
    .replace(/\s+$/, "")

  return { body, sourcesMarkdown }
}

function stripTrailingUrlPunctuation(url: string): string {
  return url.replace(/[.,;:!?)]+$/g, "")
}

function displayCanonicalUrl(value: string): string {
  try {
    const url = new URL(value.trim())
    url.hash = ""
    url.protocol = url.protocol.toLowerCase()
    url.hostname = url.hostname.toLowerCase()
    if (url.pathname.length > 1) {
      url.pathname = url.pathname.replace(/\/+$/, "")
    }
    return url.toString()
  } catch {
    return value.trim()
  }
}

function hostnameLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export function parseNumberedSourceLines(sourcesMarkdown: string): Array<{
  index: number
  url: string
  text: string
}> {
  const lines = sourcesMarkdown.split(/\r?\n/)
  const results: Array<{ index: number; url: string; text: string }> = []
  let autoIndex = 1

  for (const line of lines) {
    if (SOURCES_HEADING.test(line) || !line.trim()) continue

    const numbered = line.match(NUMBERED_SOURCE_LINE)
    const payload = numbered ? numbered[3] : line.trim()
    const markdownLink = payload.match(/^\[([^\]]+)]\((https?:\/\/[^)]+)\)$/)
    const url = stripTrailingUrlPunctuation(
      markdownLink?.[2] ?? payload.match(HTTP_URL)?.[0] ?? "",
    )

    if (!url) continue

    const index = numbered
      ? Number(numbered[1] || numbered[2])
      : autoIndex
    const text = (markdownLink?.[1] ?? payload.replace(url, "")).trim()

    results.push({ index, url, text })
    autoIndex = index + 1
  }

  return results
}

export function formatSourceLabel(
  source: ResearchSourceDisplay,
  fallbackUrl: string,
  markdownText?: string,
): string {
  const title = source.title?.trim() || ""
  const publisher = source.publisher?.trim() || ""

  if (publisher && title) {
    if (title.toLowerCase().startsWith(publisher.toLowerCase())) {
      return title
    }
    return `${publisher} — ${title}`
  }

  if (title) return title
  if (markdownText && !/^https?:\/\//i.test(markdownText)) return markdownText
  if (publisher) return publisher
  return hostnameLabel(fallbackUrl)
}

export function resolveDisplaySources(
  sourcesMarkdown: string | null,
  researchSources: ResearchSourceDisplay[] = [],
): DisplaySource[] {
  if (!sourcesMarkdown) return []

  const parsed = parseNumberedSourceLines(sourcesMarkdown)
  const byUrl = new Map<string, ResearchSourceDisplay>()

  for (const row of researchSources) {
    if (!row.url) continue
    byUrl.set(displayCanonicalUrl(row.url), row)
  }

  if (parsed.length > 0) {
    return parsed.map((item) => {
      const meta = byUrl.get(displayCanonicalUrl(item.url)) ?? {}
      return {
        index: item.index,
        id: `source-${item.index}`,
        url: item.url,
        label: formatSourceLabel(meta, item.url, item.text),
      }
    })
  }

  return researchSources
    .filter((row): row is ResearchSourceDisplay & { url: string } =>
      Boolean(row.url),
    )
    .map((row, index) => ({
      index: index + 1,
      id: `source-${index + 1}`,
      url: row.url,
      label: formatSourceLabel(row, row.url),
    }))
}

export function decorateCitationMarkers(
  markdown: string,
  enabled = true,
): string {
  if (!enabled) return markdown

  const placeholders: string[] = []
  const protectedMarkdown = markdown.replace(MARKDOWN_LINK_OR_IMAGE, (match) => {
    placeholders.push(match)
    return `${CITATION_PLACEHOLDER}${placeholders.length - 1}\u0000`
  })

  const linked = protectedMarkdown.replace(
    /\[(\d+)]/g,
    "[$1](#source-$1)",
  )
  const spaced = linked.replace(
    /([^\s])(\[\d+]\(#source-\d+\))/g,
    "$1 $2",
  )

  return spaced.replace(
    new RegExp(`${CITATION_PLACEHOLDER}(\\d+)\u0000`, "g"),
    (_, index) => placeholders[Number(index)],
  )
}

export function preparePublishedArticleDisplay(
  content: string,
  title: string,
  researchSources: ResearchSourceDisplay[] = [],
): {
  displayMarkdown: string
  sources: DisplaySource[]
} {
  const stored = content ?? ""
  const withoutDuplicateTitle = suppressDuplicateLeadingH1(stored, title)
  const { body, sourcesMarkdown } = splitMarkdownSourcesSection(
    withoutDuplicateTitle,
  )
  const sources = resolveDisplaySources(sourcesMarkdown, researchSources)

  if (sourcesMarkdown && sources.length === 0) {
    return {
      displayMarkdown: decorateCitationMarkers(withoutDuplicateTitle, false),
      sources: [],
    }
  }

  return {
    displayMarkdown: decorateCitationMarkers(body, sources.length > 0),
    sources,
  }
}

function toDate(value?: Date | string | null): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function publicArticleDisplayDate(
  input: PublicArticleDateInput,
): Date | null {
  const status = input.status.trim().toLowerCase()

  if (status === "published") {
    return toDate(input.publishedAt)
  }

  if (status === "scheduled") {
    return toDate(input.scheduledFor)
  }

  return null
}

export function formatPublicArticleDate(date: Date): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: PUBLICATION_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

export function formatPublicArticleMetaDate(
  input: PublicArticleDateInput,
): string | null {
  const date = publicArticleDisplayDate(input)
  return date ? formatPublicArticleDate(date) : null
}

export function isCitationHref(href?: string | null): boolean {
  return Boolean(href && /^#source-\d+$/.test(href))
}

export function citationIndexFromHref(href: string): string {
  return href.replace("#source-", "")
}

export function isExternalHttpUrl(href?: string | null): boolean {
  return Boolean(href && /^https?:\/\//i.test(href))
}
