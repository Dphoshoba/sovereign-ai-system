import Link from "next/link"
import type { Article } from "@prisma/client"
import { prisma } from "@/lib/prisma"

function estimateReadingTime(content: string | null) {
  if (!content) return 0

  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

function getKeywordCounts(articles: Article[]) {
  const counts: Record<string, number> = {}

  articles.forEach((article) => {
    if (!article.seoKeywords) return

    article.seoKeywords
      .split(",")
      .map((keyword: string) => keyword.trim().toLowerCase())
      .filter(Boolean)
      .forEach((keyword: string) => {
        counts[keyword] = (counts[keyword] || 0) + 1
      })
  })

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
}

export default async function AnalyticsDashboardPage() {
  const articles = await prisma.article.findMany({
    orderBy: {
      createdAt: "desc",
    },
  })

  const total = articles.length
  const published = articles.filter((article) => article.status === "published")
  const drafts = articles.filter((article) => article.status === "draft")
  const reviews = articles.filter((article) => article.status === "review")
  const scheduled = articles.filter((article) => article.status === "scheduled")

  const totalReadingTime = articles.reduce(
    (sum, article) => sum + estimateReadingTime(article.content),
    0
  )

  const averageReadingTime =
    total > 0 ? Math.round(totalReadingTime / total) : 0

  const categoryCounts = articles.reduce<Record<string, number>>(
    (counts, article) => {
      counts[article.category] = (counts[article.category] || 0) + 1
      return counts
    },
    {}
  )

  const topKeywords = getKeywordCounts(articles)
  const recentArticles = articles.slice(0, 5)

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Analytics Dashboard</h1>

      <p style={{ color: "#555", maxWidth: 760, lineHeight: 1.7 }}>
        Track publishing activity, content health, categories, keywords, and
        editorial momentum for Echoes & Visions.
      </p>

      <section style={statsGrid}>
        <StatCard label="Total Articles" value={total} />
        <StatCard label="Published" value={published.length} />
        <StatCard label="Drafts" value={drafts.length} />
        <StatCard label="Reviews" value={reviews.length} />
        <StatCard label="Scheduled" value={scheduled.length} />
        <StatCard label="Avg. Reading Time" value={`${averageReadingTime} min`} />
      </section>

      <section style={gridTwo}>
        <div style={cardStyle}>
          <h2>Category Breakdown</h2>

          {Object.entries(categoryCounts).length === 0 ? (
            <p>No categories yet.</p>
          ) : (
            Object.entries(categoryCounts).map(([category, count]) => (
              <div key={category} style={rowStyle}>
                <span>{category}</span>
                <strong>{count}</strong>
              </div>
            ))
          )}
        </div>

        <div style={cardStyle}>
          <h2>Top SEO Keywords</h2>

          {topKeywords.length === 0 ? (
            <p>No SEO keywords added yet.</p>
          ) : (
            topKeywords.map(([keyword, count]) => (
              <div key={keyword} style={rowStyle}>
                <span>{keyword}</span>
                <strong>{count}</strong>
              </div>
            ))
          )}
        </div>
      </section>

      <section style={cardStyle}>
        <h2>Recent Articles</h2>

        {recentArticles.length === 0 ? (
          <p>No articles yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {recentArticles.map((article) => (
              <div key={article.id} style={articleRow}>
                <div>
                  <p style={statusStyle}>{article.status}</p>
                  <h3 style={{ margin: "4px 0" }}>{article.title}</h3>
                  <p style={{ color: "#555", margin: 0 }}>
                    {article.category} · {estimateReadingTime(article.content)} min read
                  </p>
                </div>

                <Link
                  href={`/admin/articles/${article.id}/edit`}
                  style={buttonStyle}
                >
                  Edit
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={statCard}>
      <strong style={{ fontSize: 30 }}>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

const statsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 16,
  marginTop: 28,
  marginBottom: 28,
}

const statCard: React.CSSProperties = {
  background: "#111",
  color: "#fff",
  borderRadius: 18,
  padding: 22,
  display: "grid",
  gap: 8,
}

const gridTwo: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 20,
  marginBottom: 28,
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 24,
  marginTop: 24,
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  padding: "12px 0",
  borderBottom: "1px solid #eee",
}

const articleRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  alignItems: "center",
  padding: 18,
  border: "1px solid #eee",
  borderRadius: 14,
}

const statusStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "#777",
  fontSize: 13,
  margin: 0,
}

const buttonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  background: "#111",
  color: "#fff",
  textDecoration: "none",
  fontWeight: "bold",
}