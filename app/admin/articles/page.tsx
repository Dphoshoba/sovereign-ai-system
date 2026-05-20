import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function AdminArticlesPage() {
  const articles = await prisma.article.findMany({
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h1>Echoes & Visions Articles</h1>
          <p>Total articles: {articles.length}</p>
        </div>

        <Link href="/admin/articles/new" style={buttonStyle}>
          Create Article
        </Link>
      </div>

      <div style={{ display: "grid", gap: "16px", marginTop: "24px" }}>
        {articles.map((article) => (
          <div key={article.id} style={cardStyle}>
            <h2>{article.title}</h2>
            <p>{article.excerpt}</p>
            <p><strong>Category:</strong> {article.category}</p>
            <p><strong>Status:</strong> {article.status}</p>
            <p><strong>Slug:</strong> {article.slug}</p>

            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              <Link href={`/admin/articles/${article.id}/edit`} style={buttonStyle}>
                Edit
              </Link>
            </div>
          </div>
        ))}
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