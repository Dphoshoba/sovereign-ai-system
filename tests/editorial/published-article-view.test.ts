import { createElement, type CSSProperties, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { PublishedArticleView } from "../../src/components/blog/PublishedArticleView"
import {
  STRATEGY_SESSION_HREF,
  STRATEGY_SESSION_LABEL,
  StrategySessionCta,
} from "../../src/components/public/StrategySessionCta"

vi.mock("next/link", () => ({
  default: function MockLink({
    href,
    children,
    ...props
  }: {
    href: string
    children?: ReactNode
    style?: CSSProperties
  }) {
    return createElement("a", { href, ...props }, children)
  },
}))

const TITLE = "AI as Business Infrastructure for Founders, Ministries, and Teams"
const FEATURED_IMAGE =
  "https://example.supabase.co/storage/v1/object/public/article-images/ai-business-infrastructure-founders-ministries-teams/0633e85d-bdd1-4fe8-955b-4996e12a716f.png"

const STORED_MARKDOWN = [
  `# ${TITLE}`,
  "",
  "AI risk management should be integrated into broader enterprise risk processes.[1]",
  "",
  "## Operating model",
  "",
  "1. Keep governance in the workflow.",
  "2. Treat AI as infrastructure.",
  "",
  "- Preserve voice.",
  "- Keep humans accountable.",
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

function renderArticle(
  overrides: Partial<Parameters<typeof PublishedArticleView>[0]["article"]> = {},
  extras: Partial<Parameters<typeof PublishedArticleView>[0]> = {},
) {
  return renderToStaticMarkup(
    createElement(PublishedArticleView, {
      article: {
        title: TITLE,
        slug: "ai-business-infrastructure-founders-ministries-teams",
        category: "ai-tools",
        excerpt: "Treat AI as operating infrastructure.",
        content: STORED_MARKDOWN,
        featuredImage: FEATURED_IMAGE,
        status: "published",
        publishedAt: new Date("2026-09-20T23:30:16.851Z"),
        scheduledFor: null,
        ...overrides,
      },
      researchSources: RESEARCH_SOURCES,
      relatedArticles: [
        {
          id: "related-1",
          slug: "ai-automation-for-creators-save-time-without-losing-your-voice",
          title: "AI Automation for Creators",
          excerpt: "Save time without losing your voice.",
          category: "ai-tools",
        },
      ],
      ...extras,
    }),
  )
}

describe("published article view", () => {
  it("renders one page-template H1 and suppresses a matching Markdown title", () => {
    const html = renderArticle()
    const h1Matches = html.match(/<h1\b/g) ?? []

    expect(h1Matches).toHaveLength(1)
    expect(html).toContain(`>${TITLE}</h1>`)
    expect(html).not.toContain(`<h1>${TITLE}</h1><h1>`)
  })

  it("preserves a different leading Markdown H1", () => {
    const html = renderArticle({
      content: "# A different opening\n\nBody copy.",
    })
    const h1Matches = html.match(/<h1\b/g) ?? []

    expect(h1Matches).toHaveLength(2)
    expect(html).toContain(`>${TITLE}</h1>`)
    expect(html).toContain(">A different opening</h1>")
  })

  it("displays publishedAt rather than a June creation date", () => {
    const html = renderArticle()

    expect(html).toContain("21 September 2026")
    expect(html).not.toContain("20 June 2026")
    expect(html).not.toContain("June 2026")
  })

  it("does not show a publication date for draft or review records", () => {
    const draftHtml = renderArticle({
      status: "draft",
      publishedAt: new Date("2026-09-20T23:30:16.851Z"),
    })
    const reviewHtml = renderArticle({
      status: "review-required",
      publishedAt: new Date("2026-09-20T23:30:16.851Z"),
    })

    expect(draftHtml).not.toContain("21 September 2026")
    expect(reviewHtml).not.toContain("21 September 2026")
  })

  it("renders Sources as separate accessible rows with safe external links", () => {
    const html = renderArticle()
    const sourcesBlock = html.slice(
      html.indexOf('data-article-sources="true"'),
    )

    expect(html).toContain('id="article-sources-heading"')
    expect(html).toContain(">Sources</h2>")
    expect(sourcesBlock).toContain('id="source-1"')
    expect(sourcesBlock).toContain('id="source-2"')
    expect(sourcesBlock).toContain('id="source-3"')
    expect(sourcesBlock).toContain(
      "NIST — Artificial Intelligence Risk Management Framework",
    )
    expect(sourcesBlock).toContain("Deloitte Insights — AI Infrastructure Survey")
    expect(sourcesBlock).toContain(
      "Why the Knowledge Layer Is the Next Frontier for AI-Driven Business Automation",
    )
    expect(sourcesBlock).toContain(
      'href="https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf"',
    )
    expect(sourcesBlock).toContain(
      'href="https://www.deloitte.com/us/en/insights/topics/technology-management/ai-infrastructure-survey.html"',
    )
    expect(sourcesBlock).toContain(
      'href="https://www.cdomagazine.tech/higher-logic-cdo/why-the-knowledge-layer-is-the-next-frontier-for-ai-driven-business-automation"',
    )
    expect(sourcesBlock.match(/target="_blank"/g)?.length).toBe(3)
    expect(sourcesBlock.match(/rel="noopener noreferrer"/g)?.length).toBe(3)
    expect(sourcesBlock.match(/<li\b/g)?.length).toBe(3)
    expect(sourcesBlock).not.toMatch(
      /nistpubs\.nist\.gov[^<]*deloitte\.com/i,
    )
  })

  it("renders citation markers as linked superscripts", () => {
    const html = renderArticle()

    expect(html).toContain('class="article-citation"')
    expect(html).toContain('href="#source-1"')
    expect(html).toContain('aria-label="Source 1"')
    expect(html).toContain(">[1]</a>")
    expect(html).not.toContain("processes.[1]")
  })

  it("keeps semantic headings and lists", () => {
    const html = renderArticle()

    expect(html).toContain("<h2")
    expect(html).toContain(">Operating model</h2>")
    expect(html).toContain("<ol")
    expect(html).toContain("<ul")
    expect(html).toContain("<li")
    expect(html).toContain("Keep governance in the workflow.")
    expect(html).toContain("Preserve voice.")
  })

  it("presents the featured image without a cropping cover fit", () => {
    const html = renderArticle()
    const imageMarkup = html.slice(
      html.indexOf('data-featured-image="true"'),
      html.indexOf("</figure>") + 9,
    )

    expect(imageMarkup).toContain(`src="${FEATURED_IMAGE}"`)
    expect(imageMarkup).toContain("object-fit:contain")
    expect(imageMarkup).toContain("height:auto")
    expect(imageMarkup).toContain("max-width:100%")
    expect(imageMarkup).not.toContain("object-fit:cover")
  })

  it("points the strategy CTA at /consultation and keeps other CTA destinations", () => {
    const html = renderArticle()

    expect(html).toContain('href="/consultation"')
    expect(html).toContain(
      'href="/lead-magnets/10-ai-automations-every-creator-should-build"',
    )
    expect(html).toContain("Get Free Guide")
    expect(html).toContain(`href="${STRATEGY_SESSION_HREF}"`)
    expect(html).toContain(STRATEGY_SESSION_LABEL)
    expect(html).not.toContain('href="/contact"')
    expect(html).toContain(
      'href="/blog/ai-automation-for-creators-save-time-without-losing-your-voice"',
    )
    expect(html).toContain('data-lead-magnet="true"')
    expect(html).toContain('data-related-articles="true"')
    expect(html).toContain('data-strategy-cta="true"')
  })

  it("renders the shared strategy CTA to /consultation", () => {
    const html = renderToStaticMarkup(createElement(StrategySessionCta))

    expect(STRATEGY_SESSION_HREF).toBe("/consultation")
    expect(html).toContain('href="/consultation"')
    expect(html).toContain("Book a Strategy Session →")
    expect(html).not.toContain('href="/contact"')
  })

  it("still renders public articles that have no Sources section", () => {
    const html = renderArticle(
      {
        content: "## Why this matters\n\nA paragraph without citations.",
        featuredImage: null,
      },
      { researchSources: [] },
    )

    expect(html).toContain(">Why this matters</h2>")
    expect(html).toContain("A paragraph without citations.")
    expect(html).not.toContain('data-article-sources="true"')
    expect(html).not.toContain("id=\"source-1\"")
    expect(html).toContain('href="/consultation"')
    expect(html).not.toContain('href="/contact"')
  })

  it("does not hardcode Article 2 source labels into the generic renderer", () => {
    const html = renderArticle(
      {
        title: "Generic article",
        content: [
          "# Generic article",
          "",
          "A claim.[1]",
          "",
          "## Sources",
          "[1] https://example.com/research-note",
        ].join("\n"),
      },
      {
        researchSources: [
          {
            publisher: "Example Institute",
            title: "Research Note",
            url: "https://example.com/research-note",
          },
        ],
      },
    )

    expect(html).toContain("Example Institute — Research Note")
    expect(html).not.toContain("NIST — Artificial Intelligence")
  })
})
