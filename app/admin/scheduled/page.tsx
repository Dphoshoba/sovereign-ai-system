import { prisma } from "@/lib/prisma"

export default async function ScheduledPage() {
  const articles = await prisma.article.findMany({
    where: {
      status: "scheduled",
    },
    orderBy: {
      scheduledFor: "asc",
    },
  })

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Scheduled Content</h1>

      <p>Total Scheduled: {articles.length}</p>

      <div style={{ display: "grid", gap: "16px", marginTop: "24px" }}>
        {articles.map((article) => (
          <div key={article.id} style={cardStyle}>
            <h2>{article.title}</h2>

            <p>
              <strong>Status:</strong> {article.status}
            </p>

            <p>
              <strong>Scheduled For:</strong>{" "}
              {article.scheduledFor
                ? new Date(article.scheduledFor).toLocaleString()
                : "Not scheduled"}
            </p>

            <p>
              <strong>Category:</strong> {article.category}
            </p>

            <p>
              <strong>ID:</strong> {article.id}
            </p>
          </div>
        ))}

        {articles.length === 0 && (
          <p>No scheduled content yet.</p>
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