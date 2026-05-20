import Link from "next/link"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "AI Automation Blog | Echoes & Visions",
  description:
    "Practical AI automation insights for creators, founders, ministries, agencies, and builders.",
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const { q = "", category = "" } = await searchParams

  const articles = await prisma.article.findMany({
    where: {
      status: "published",
      ...(category
        ? {
            category,
          }
        : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { excerpt: { contains: q, mode: "insensitive" } },
              { content: { contains: q, mode: "insensitive" } },
              { seoKeywords: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  const categories = await prisma.article.findMany({
    where: {
      status: "published",
    },
    select: {
      category: true,
    },
    distinct: ["category"],
    orderBy: {
      category: "asc",
    },
  })

  return (
    <main style={{ fontFamily: "Arial, sans-serif", background: "#fafafa" }}>
      <section
        style={{
          padding: "72px 40px",
          background: "#111",
          color: "#fff",
        }}
      >
        <p style={{ textTransform: "uppercase", letterSpacing: 2, color: "#bbb" }}>
          Echoes & Visions
        </p>

        <h1
          style={{
            maxWidth: 900,
            fontSize: "52px",
            lineHeight: 1.05,
            margin: "16px 0",
          }}
        >
          AI automation for people building with purpose.
        </h1>

        <p style={{ maxWidth: 760, fontSize: "20px", lineHeight: 1.6, color: "#ddd" }}>
          Clear, practical thinking for creators, founders, ministries,
          agencies, and builders who want intelligent systems without losing
          their voice, values, or humanity.
        </p>
      </section>

      <section style={{ padding: "36px 40px", maxWidth: 1180, margin: "0 auto" }}>
        <form
          action="/blog"
          style={{
            display: "grid",
            gap: 14,
            gridTemplateColumns: "minmax(220px, 1fr) minmax(180px, 260px) auto",
            alignItems: "end",
            background: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: 18,
            padding: 22,
            boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
          }}
        >
          <label>
            Search
            <input
              name="q"
              defaultValue={q}
              placeholder="Search articles..."
              style={inputStyle}
            />
          </label>

          <label>
            Category
            <select name="category" defaultValue={category} style={inputStyle}>
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item.category} value={item.category}>
                  {item.category}
                </option>
              ))}
            </select>
          </label>

          <button style={buttonStyle}>Filter</button>
        </form>

        <div style={{ marginTop: 34, marginBottom: 28 }}>
          <h2 style={{ fontSize: 32 }}>Latest Articles</h2>
          <p style={{ color: "#666" }}>
            Showing {articles.length} published article
            {articles.length === 1 ? "" : "s"}.
          </p>
        </div>

        {articles.length === 0 ? (
          <div style={emptyState}>
            <h3>No matching articles found.</h3>
            <p>Try a different search term or category.</p>
            <Link href="/blog" style={linkStyle}>
              Clear filters →
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "24px",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            }}
          >
            {articles.map((article) => (
              <article key={article.id} style={cardStyle}>
                {article.featuredImage ? (
                  <img
                    src={article.featuredImage}
                    alt={article.title}
                    style={{
                      width: "100%",
                      height: 190,
                      objectFit: "cover",
                      borderRadius: 14,
                      marginBottom: 18,
                    }}
                  />
                ) : null}

                <p style={metaStyle}>
                  {article.category} · {formatDate(article.createdAt)}
                </p>

                <h3 style={{ fontSize: 24, lineHeight: 1.2 }}>
                  {article.title}
                </h3>

                <p style={{ color: "#555", lineHeight: 1.65 }}>
                  {article.excerpt}
                </p>

                <Link href={`/blog/${article.slug}`} style={linkStyle}>
                  Read article →
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 6,
  padding: "12px",
  borderRadius: 10,
  border: "1px solid #ccc",
  fontSize: 16,
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e5e5",
  borderRadius: 18,
  padding: 24,
  boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
}

const metaStyle: React.CSSProperties = {
  color: "#777",
  fontSize: 14,
  textTransform: "uppercase",
  letterSpacing: 1,
}

const linkStyle: React.CSSProperties = {
  display: "inline-block",
  marginTop: 12,
  color: "#111",
  fontWeight: "bold",
  textDecoration: "none",
}

const emptyState: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 32,
}