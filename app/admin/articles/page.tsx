import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ArticleReviewActions } from "./ArticleReviewActions"
import { ScheduleArticleButton } from "./ScheduleArticleButton"
import { ArticleActions } from "@/components/articles/ArticleActions"

const STATUS_FILTERS = [
  { key: "all", label: "All", status: null },
  { key: "review-required", label: "Pending Review", status: "review-required" },
  { key: "approved", label: "Approved", status: "approved" },
  { key: "scheduled", label: "Scheduled", status: "scheduled" },
  { key: "rejected", label: "Rejected", status: "rejected" },
  { key: "published", label: "Published", status: "published" },
] as const

function gradeColor(grade: string | null) {
  switch (grade) {
    case "approval-candidate":
      return "#15803d"
    case "review":
      return "#d97706"
    case "reject":
      return "#b91c1c"
    default:
      return "#666"
  }
}

function gradeLabel(grade: string | null) {
  switch (grade) {
    case "approval-candidate":
      return "🟢 Approval Candidate"
    case "review":
      return "🟡 Review"
    case "reject":
      return "🔴 Reject"
    default:
      return "⚪ Unscored"
  }
}

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: statusParam } = await searchParams

  const activeFilter =
    STATUS_FILTERS.find((f) => f.key === statusParam) ?? STATUS_FILTERS[0]

  const articles = await prisma.article.findMany({
    where: activeFilter.status ? { status: activeFilter.status } : undefined,
    orderBy: {
      createdAt: "desc",
    },
  })

  const counts = await prisma.article.groupBy({
    by: ["status"],
    _count: { _all: true },
  })

  const countByStatus = new Map<string, number>()
  let total = 0
  for (const row of counts) {
    countByStatus.set(row.status, row._count._all)
    total += row._count._all
  }

  const countForFilter = (status: string | null) =>
    status === null ? total : countByStatus.get(status) ?? 0

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h1>Echoes & Visions Articles</h1>
          <p>
            {activeFilter.label}: {articles.length}
          </p>
        </div>

        <Link href="/admin/articles/new" style={buttonStyle}>
          Create Article
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          marginTop: "20px",
        }}
      >
        {STATUS_FILTERS.map((filter) => {
          const isActive = filter.key === activeFilter.key
          const href =
            filter.status === null
              ? "/admin/articles"
              : `/admin/articles?status=${filter.key}`

          return (
            <Link
              key={filter.key}
              href={href}
              style={{
                ...tabStyle,
                background: isActive ? "#111" : "#f2f2f2",
                color: isActive ? "#fff" : "#111",
              }}
            >
              {filter.label}
              <span
                style={{
                  ...badgeStyle,
                  background: isActive ? "#fff" : "#111",
                  color: isActive ? "#111" : "#fff",
                }}
              >
                {countForFilter(filter.status)}
              </span>
            </Link>
          )
        })}
      </div>

      <div style={{ display: "grid", gap: "16px", marginTop: "24px" }}>
        {articles.length === 0 ? (
          <p style={{ color: "#777" }}>
            No articles with status &ldquo;{activeFilter.label}&rdquo;.
          </p>
        ) : (
          articles.map((article) => (
            <div key={article.id} style={cardStyle}>
              <h2>{article.title}</h2>
              <p>{article.excerpt}</p>
              <p>
                <strong>Category:</strong> {article.category}
              </p>
              <p>
                <strong>Status:</strong> {article.status}
              </p>
              {article.scheduledFor && (
                <p>
                  <strong>Scheduled For:</strong>{" "}
                  {new Date(article.scheduledFor).toLocaleString()}
                </p>
              )}
              <div
                style={{
                  marginTop: "8px",
                  fontWeight: "bold",
                  color:
                    (article.editorialScore ?? 0) >= 80
                      ? "#15803d"
                      : (article.editorialScore ?? 0) >= 60
                        ? "#d97706"
                        : "#b91c1c",
                }}
              >
                Editorial Score: {article.editorialScore ?? "Not scored"}
              </div>
              <div
                style={{
                  display: "inline-block",
                  padding: "6px 12px",
                  borderRadius: "999px",
                  background: gradeColor(article.editorialGrade),
                  color: "#fff",
                  fontWeight: "bold",
                  marginTop: "8px",
                }}
              >
                {gradeLabel(article.editorialGrade)}
              </div>
              {Array.isArray(article.editorialWarnings) &&
                article.editorialWarnings.length > 0 && (
                  <div>
                    <strong>Editorial Warnings:</strong>
                    <ul>
                      {article.editorialWarnings.map((warning, index) => (
                        <li key={index}>{String(warning)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              <p>
                <strong>ID:</strong> {article.id}
              </p>
              <p>
                <strong>Slug:</strong> {article.slug}
              </p>

              <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                <Link
                  href={`/admin/articles/${article.id}/edit`}
                  style={buttonStyle}
                >
                  Edit
                </Link>

                {article.status === "review-required" && (
                  <ArticleReviewActions articleId={article.id} />
                )}

                {article.status === "approved" && (
                  <ScheduleArticleButton articleId={article.id} />
                )}

                <ArticleActions
                  articleId={article.id}
                  status={article.status}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  )
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "20px",
}

const buttonStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: "8px",
  background: "#111",
  color: "#fff",
  textDecoration: "none",
  fontWeight: "bold",
}

const tabStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 14px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "bold",
  border: "1px solid #ddd",
}

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "20px",
  height: "20px",
  padding: "0 6px",
  borderRadius: "999px",
  fontSize: "12px",
}
