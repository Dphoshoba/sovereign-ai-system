import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { computeArticleAuditFingerprint } from "../../lib/research/article-audit-fingerprint"
import { PUBLICATION_TIME_ZONE } from "../../lib/publishing/adelaide-time"
import {
  decorateCitationMarkers,
  formatPublicArticleDate,
  formatPublicArticleMetaDate,
  preparePublishedArticleDisplay,
  publicArticleDisplayDate,
  splitMarkdownSourcesSection,
  suppressDuplicateLeadingH1,
} from "../../lib/blog/published-article-display"

const TITLE = "AI as Business Infrastructure for Founders, Ministries, and Teams"

const STORED_MARKDOWN = [
  `# ${TITLE}`,
  "",
  "AI risk management should be integrated into broader enterprise risk processes.[1]",
  "",
  "## Operating model",
  "",
  "- Keep governance in the workflow.",
  "- Treat AI as infrastructure.",
  "",
  "Leaders should request a [strategy consultation](/consultation) after reading.",
  "",
  "## Sources",
  "[1] https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf",
  "[2] https://www.deloitte.com/us/en/insights/topics/technology-management/ai-infrastructure-survey.html",
  "[3] https://www.cdomagazine.tech/higher-logic-cdo/why-the-knowledge-layer-is-the-next-frontier-for-ai-driven-business-automation",
].join("\n")

const RESEARCH_SOURCES = [
  {
    publisher: "NIST",
    title: "Artificial Intelligence Risk Management Framework",
    url: "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf",
  },
  {
    publisher: "Deloitte Insights",
    title: "AI Infrastructure Survey",
    url: "https://www.deloitte.com/us/en/insights/topics/technology-management/ai-infrastructure-survey.html",
  },
  {
    publisher: "CDO Magazine",
    title:
      "Why the Knowledge Layer Is the Next Frontier for AI-Driven Business Automation",
    url: "https://www.cdomagazine.tech/higher-logic-cdo/why-the-knowledge-layer-is-the-next-frontier-for-ai-driven-business-automation",
  },
]

describe("published article display helpers", () => {
  it("suppresses a leading Markdown H1 only when it matches the Article title", () => {
    const stored = `# ${TITLE}\n\nBody copy.`
    const display = suppressDuplicateLeadingH1(stored, TITLE)

    expect(display).toBe("Body copy.")
    expect(stored.startsWith(`# ${TITLE}`)).toBe(true)
  })

  it("preserves a different leading H1", () => {
    const stored = "# A different opening\n\nBody copy."
    expect(suppressDuplicateLeadingH1(stored, TITLE)).toBe(stored)
  })

  it("does not mutate stored Markdown while preparing display output", () => {
    const stored = STORED_MARKDOWN
    const beforeFingerprint = computeArticleAuditFingerprint(
      {
        title: TITLE,
        excerpt: "Excerpt",
        content: stored,
        category: "ai-tools",
      },
      RESEARCH_SOURCES.map((source) => source.url),
    )

    const prepared = preparePublishedArticleDisplay(
      stored,
      TITLE,
      RESEARCH_SOURCES,
    )

    expect(stored).toBe(STORED_MARKDOWN)
    expect(prepared.displayMarkdown).not.toContain(`# ${TITLE}`)
    expect(prepared.displayMarkdown).toContain("## Operating model")
    expect(computeArticleAuditFingerprint(
      {
        title: TITLE,
        excerpt: "Excerpt",
        content: stored,
        category: "ai-tools",
      },
      RESEARCH_SOURCES.map((source) => source.url),
    )).toBe(beforeFingerprint)
  })

  it("uses publishedAt for published articles and never falls back to a creation date", () => {
    const publishedAt = new Date("2026-09-20T23:30:16.851Z")

    expect(
      publicArticleDisplayDate({
        status: "published",
        publishedAt,
        scheduledFor: new Date("2026-06-20T00:00:00.000Z"),
      }),
    ).toEqual(publishedAt)

    expect(
      formatPublicArticleMetaDate({
        status: "published",
        publishedAt,
      }),
    ).toBe("21 September 2026")

    expect(
      publicArticleDisplayDate({
        status: "published",
        publishedAt: null,
      }),
    ).toBeNull()

    expect(
      formatPublicArticleMetaDate({
        status: "draft",
        publishedAt,
      }),
    ).toBeNull()

    expect(
      formatPublicArticleMetaDate({
        status: "review-required",
        publishedAt,
      }),
    ).toBeNull()

    expect(
      formatPublicArticleMetaDate({
        status: "scheduled",
        scheduledFor: new Date("2026-09-20T23:30:00.000Z"),
      }),
    ).toBe("21 September 2026")
  })

  it("formats Article 2 publishedAt in Australia/Adelaide, not UTC or createdAt", () => {
    const article2PublishedAt = "2026-09-20T23:30:16.851Z"
    const instant = new Date(article2PublishedAt)

    expect(PUBLICATION_TIME_ZONE).toBe("Australia/Adelaide")
    expect(formatPublicArticleDate(instant)).toBe("21 September 2026")
    expect(
      formatPublicArticleMetaDate({
        status: "published",
        publishedAt: article2PublishedAt,
      }),
    ).toBe("21 September 2026")
    expect(
      new Intl.DateTimeFormat("en-AU", {
        timeZone: "UTC",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(instant),
    ).toBe("20 September 2026")
    expect(
      formatPublicArticleMetaDate({
        status: "published",
        publishedAt: article2PublishedAt,
      }),
    ).not.toBe("20 June 2026")
  })

  it("splits consecutive Sources lines into separate display entries with original URLs", () => {
    const { body, sourcesMarkdown } = splitMarkdownSourcesSection(STORED_MARKDOWN)
    const prepared = preparePublishedArticleDisplay(
      STORED_MARKDOWN,
      TITLE,
      RESEARCH_SOURCES,
    )

    expect(body).not.toContain("## Sources")
    expect(sourcesMarkdown).toContain("## Sources")
    expect(prepared.sources).toHaveLength(3)
    expect(prepared.sources.map((source) => source.url)).toEqual([
      "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf",
      "https://www.deloitte.com/us/en/insights/topics/technology-management/ai-infrastructure-survey.html",
      "https://www.cdomagazine.tech/higher-logic-cdo/why-the-knowledge-layer-is-the-next-frontier-for-ai-driven-business-automation",
    ])
    expect(prepared.sources.map((source) => source.label)).toEqual([
      "NIST — Artificial Intelligence Risk Management Framework",
      "Deloitte Insights — AI Infrastructure Survey",
      "CDO Magazine — Why the Knowledge Layer Is the Next Frontier for AI-Driven Business Automation",
    ])
    expect(prepared.sources.map((source) => source.id)).toEqual([
      "source-1",
      "source-2",
      "source-3",
    ])
  })

  it("separates citation markers from punctuation and links them to Sources", () => {
    const decorated = decorateCitationMarkers(
      "risk processes.[1] Keep going.[2]",
    )

    expect(decorated).toBe(
      "risk processes. [1](#source-1) Keep going. [2](#source-2)",
    )
    expect(decorated).not.toContain(".[1]")
  })

  it("does not rewrite existing Markdown links while decorating citations", () => {
    const markdown =
      "See [NIST AI RMF](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf).[1]"

    expect(decorateCitationMarkers(markdown)).toBe(
      "See [NIST AI RMF](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf). [1](#source-1)",
    )
  })

  it("leaves articles without a Sources section unchanged aside from duplicate-title suppression", () => {
    const stored = "# Other title\n\n## Why this matters\n\nA paragraph."
    const prepared = preparePublishedArticleDisplay(stored, TITLE, [])

    expect(prepared.sources).toEqual([])
    expect(prepared.displayMarkdown).toContain("# Other title")
    expect(prepared.displayMarkdown).toContain("## Why this matters")
    expect(prepared.displayMarkdown).not.toContain("#source-")
  })

  it("does not import fingerprint or lifecycle modules", () => {
    const source = readFileSync(
      join(process.cwd(), "lib/blog/published-article-display.ts"),
      "utf8",
    )

    expect(source).not.toContain("article-audit-fingerprint")
    expect(source).not.toContain("article-lifecycle")
    expect(source).not.toContain("prepare-article-for-review")
    expect(source).not.toContain("prisma")
  })
})
