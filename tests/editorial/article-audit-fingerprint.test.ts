import { describe, expect, it } from "vitest"
import { computeArticleAuditFingerprint } from "../../lib/research/article-audit-fingerprint"

const article = {
  title: "AI as infrastructure",
  excerpt: "A governed operating layer.",
  content: "Evidence-backed body.",
  category: "ai-tools",
  seoTitle: "AI infrastructure",
  seoDescription: "Build governed AI workflows.",
  seoKeywords: "AI infrastructure, governance",
  ctaType: "consultation",
  ctaContent: "Request a strategy consultation",
  ctaDestination: "/consultation",
}

const sources = [
  "https://www.nist.gov/itl/ai-risk-management-framework",
  "https://example.com/research?b=2&a=1#summary",
]

describe("computeArticleAuditFingerprint", () => {
  it.each([
    ["title", "Revised title"],
    ["excerpt", "Revised excerpt"],
    ["content", "Revised body"],
    ["category", "governance"],
    ["seoTitle", "Revised SEO title"],
    ["seoDescription", "Revised SEO description"],
    ["seoKeywords", "governed AI workflows"],
    ["ctaType", "assessment"],
    ["ctaContent", "Request an assessment"],
    ["ctaDestination", "/assessment"],
  ] as const)("changes when %s changes", (field, value) => {
    const original = computeArticleAuditFingerprint(article, sources)
    const revised = computeArticleAuditFingerprint(
      { ...article, [field]: value },
      sources,
    )

    expect(revised).not.toBe(original)
  })

  it("is unchanged when source order and equivalent URL syntax differ", () => {
    const original = computeArticleAuditFingerprint(article, sources)
    const reordered = computeArticleAuditFingerprint(article, [
      "https://EXAMPLE.com/research?a=1&b=2",
      "https://www.nist.gov/itl/ai-risk-management-framework/",
    ])

    expect(reordered).toBe(original)
  })

  it("normalizes line endings and null or empty optional fields", () => {
    const windows = computeArticleAuditFingerprint(
      {
        ...article,
        excerpt: null,
        content: "First line\r\nSecond line\rThird line",
      },
      sources,
    )
    const unix = computeArticleAuditFingerprint(
      {
        ...article,
        excerpt: "",
        content: "First line\nSecond line\nThird line",
      },
      sources,
    )

    expect(windows).toBe(unix)
  })

  it("changes when the canonical source URL set changes", () => {
    const original = computeArticleAuditFingerprint(article, sources)
    const revised = computeArticleAuditFingerprint(article, [sources[0]])

    expect(revised).not.toBe(original)
  })
})
