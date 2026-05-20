import Link from "next/link"
import { prisma } from "@/lib/prisma"

function formatDate(date: Date | null) {
  if (!date) return "Not scheduled"

  return new Intl.DateTimeFormat("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

export default async function EditorialCalendarPage() {
  const articles = await prisma.article.findMany({
    where: {
      OR: [
        { status: "scheduled" },
        { status: "published" },
        { status: "draft" },
        { status: "review" },
      ],
    },
    orderBy: [
      { scheduledFor: "asc" },
      { createdAt: "desc" },
    ],
  })

  const scheduled = articles.filter((article) => article.status === "scheduled")
  const published = articles.filter((article) => article.status === "published")
  const drafts = articles.filter(
    (article) => article.status === "draft" || article.status === "review"
  )

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Editorial Calendar</h1>

      <p style={{ color: "#555", maxWidth: 760, lineHeight: 1.7 }}>
        Track drafts, reviews, scheduled articles, and published posts for
        Echoes & Visions.
      </p>

      <section style={statsGrid}>
        <div style={statCard}>
          <strong>{scheduled.length}</strong>
          <span>Scheduled</span>
        </div>

        <div style={statCard}>
          <strong>{published.length}</strong>
          <span>Published</span>
        </div>

        <div style={statCard}>
          <strong>{drafts.length}</strong>
          <span>Draft / Review</span>
        </div>
      </section>

      <CalendarSection title="Scheduled Articles" articles={scheduled} />
      <CalendarSection title="Published Articles" articles={published} />
      <CalendarSection title="Drafts & Reviews" articles={drafts} />
    </main>
  )
}

function CalendarSection({
  title,
  articles,
}: {
  title: string
  articles: any[]
}) {
  return (
    <section style={{ marginTop: 36 }}>
      <h2>{title}</h2>

      {articles.length === 0 ? (
        <p style={{ color: "#777" }}>Nothing here yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {articles.map((article) => (
            <div key={article.id} style={articleCard}>
              <div>
                <p style={statusStyle}>{article.status}</p>

                <h3 style={{ margin: "6px 0" }}>{article.title}</h3>

                <p style={{ color: "#555" }}>
                  <strong>Category:</strong> {article.category}
                </p>

                <p style={{ color: "#555" }}>
                  <strong>Scheduled:</strong>{" "}
                  {formatDate(article.scheduledFor)}
                </p>

                <p style={{ color: "#555" }}>
                  <strong>Published:</strong>{" "}
                  {formatDate(article.publishedAt)}
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
  )
}

const statsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 16,
  marginTop: 28,
}

const statCard: React.CSSProperties = {
  background: "#111",
  color: "#fff",
  borderRadius: 18,
  padding: 22,
  display: "grid",
  gap: 8,
}

const articleCard: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 22,
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  alignItems: "center",
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