import type { CSSProperties } from "react"
import Link from "next/link"
import LeadMagnetCTA from "@/components/growth/LeadMagnetCTA"
import { StrategySessionCta } from "@/components/public/StrategySessionCta"
import {
  formatPublicArticleMetaDate,
  preparePublishedArticleDisplay,
  type ResearchSourceDisplay,
} from "../../../lib/blog/published-article-display"
import { PublishedArticleBody } from "./PublishedArticleBody"

export type PublishedArticleViewArticle = {
  title: string
  slug: string
  category: string
  excerpt?: string | null
  content?: string | null
  featuredImage?: string | null
  status: string
  publishedAt?: Date | string | null
  scheduledFor?: Date | string | null
}

export type RelatedArticleCard = {
  id: string
  slug: string
  title: string
  excerpt?: string | null
  category: string
}

const backLink: CSSProperties = {
  color: "#111",
  fontWeight: "bold",
  textDecoration: "none",
}

const metaStyle: CSSProperties = {
  color: "#777",
  fontSize: 14,
  textTransform: "uppercase",
  letterSpacing: 1,
}

const articleBox: CSSProperties = {
  background: "#fff",
  borderRadius: 22,
  border: "1px solid #e5e5e5",
  padding: "clamp(1.4rem, 3vw, 2.4rem)",
  marginTop: 34,
  boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
}

const relatedSection: CSSProperties = {
  marginTop: 0,
  padding: 30,
  borderRadius: 22,
  background: "#fff",
  border: "1px solid #e5e5e5",
}

const relatedCard: CSSProperties = {
  display: "block",
  padding: 22,
  borderRadius: 16,
  border: "1px solid #eee",
  background: "#fafafa",
  color: "#111",
  textDecoration: "none",
}

export function PublishedArticleView({
  article,
  researchSources = [],
  relatedArticles = [],
}: {
  article: PublishedArticleViewArticle
  researchSources?: ResearchSourceDisplay[]
  relatedArticles?: RelatedArticleCard[]
}) {
  const storedContent = article.content ?? ""
  const { displayMarkdown, sources } = preparePublishedArticleDisplay(
    storedContent,
    article.title,
    researchSources,
  )
  const publishedDate = formatPublicArticleMetaDate(article)
  const markdown = displayMarkdown.trim() ? displayMarkdown : "No content yet."

  return (
    <main style={{ fontFamily: "Arial, sans-serif", background: "#fafafa" }}>
      <article
        style={{
          maxWidth: "46rem",
          margin: "0 auto",
          padding: "48px 24px 24px",
        }}
      >
        <Link href="/blog" style={backLink}>
          ← Back to Blog
        </Link>

        {article.featuredImage ? (
          <figure
            data-featured-image="true"
            style={{ margin: "28px 0 8px", width: "100%" }}
          >
            <img
              src={article.featuredImage}
              alt={article.title}
              style={{
                display: "block",
                width: "auto",
                maxWidth: "100%",
                height: "auto",
                maxHeight: "min(72vh, 720px)",
                objectFit: "contain",
                objectPosition: "center",
                background: "#f4f4f4",
                borderRadius: 16,
                margin: "0 auto",
              }}
            />
          </figure>
        ) : null}

        <p style={{ ...metaStyle, marginTop: 24 }}>
          {article.category}
          {publishedDate ? ` · ${publishedDate}` : ""}
        </p>

        <h1
          style={{
            fontSize: "clamp(2rem, 3vw + 1.2rem, 3rem)",
            lineHeight: 1.12,
            margin: "18px 0",
          }}
        >
          {article.title}
        </h1>

        {article.excerpt ? (
          <p style={{ fontSize: "1.22rem", color: "#555", lineHeight: 1.65 }}>
            {article.excerpt}
          </p>
        ) : null}

        <div style={articleBox}>
          <PublishedArticleBody markdown={markdown} sources={sources} />
        </div>
      </article>

      <div
        data-article-closing="true"
        style={{
          maxWidth: "46rem",
          margin: "0 auto",
          padding: "8px 24px 72px",
          display: "grid",
          gap: 36,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            height: 1,
            background: "#e5e5e5",
            margin: "12px 0 4px",
          }}
        />

        <div data-lead-magnet="true">
          <LeadMagnetCTA />
        </div>

        {relatedArticles.length > 0 ? (
          <section
            data-related-articles="true"
            aria-labelledby="related-articles-heading"
            style={relatedSection}
          >
            <p style={metaStyle}>Recommended Reading</p>
            <h2
              id="related-articles-heading"
              style={{ fontSize: 30, marginTop: 8 }}
            >
              Related Articles
            </h2>

            <div style={{ display: "grid", gap: 18, marginTop: 22 }}>
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/blog/${related.slug}`}
                  style={relatedCard}
                >
                  <p style={metaStyle}>{related.category}</p>
                  <h3 style={{ margin: "8px 0", fontSize: 22 }}>
                    {related.title}
                  </h3>
                  <p style={{ color: "#555", lineHeight: 1.6 }}>
                    {related.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <StrategySessionCta />
      </div>
    </main>
  )
}
