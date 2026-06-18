import Link from "next/link"
import { prisma } from "@/lib/prisma"

function statusColor(status: string) {
  switch (status) {
    case "generated":
      return "#15803d"
    case "researching":
      return "#2563eb"
    case "rejected":
      return "#b91c1c"
    case "discovered":
      return "#d97706"
    default:
      return "#666"
  }
}

export default async function DiscoveryAdminPage() {
  const topics = await prisma.discoveredTopic.findMany({
    orderBy: [
      { status: "asc" },
      { opportunityScore: "desc" },
      { createdAt: "desc" },
    ],
  })

  const counts = await prisma.discoveredTopic.groupBy({
    by: ["status"],
    _count: { _all: true },
  })

  const countByStatus = new Map<string, number>()

  for (const row of counts) {
    countByStatus.set(row.status, row._count._all)
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1>Discovery Queue</h1>
          <p>Review discovered topic opportunities and generated article leads.</p>
        </div>

        <Link href="/admin/articles" style={buttonStyle}>
          Articles
        </Link>
      </div>

      <div style={summaryGrid}>
        {["discovered", "researching", "generated", "rejected"].map((status) => (
          <div key={status} style={summaryCard}>
            <strong style={{ textTransform: "capitalize" }}>{status}</strong>
            <div style={{ fontSize: 28, marginTop: 8 }}>
              {countByStatus.get(status) ?? 0}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: 16, marginTop: 24 }}>
        {topics.length === 0 ? (
          <p>No discovered topics yet.</p>
        ) : (
          topics.map((topic) => (
            <div key={topic.id} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <div>
                  <h2 style={{ marginBottom: 8 }}>{topic.title}</h2>
                  <p>
                    <strong>Audience:</strong> {topic.audience ?? "Unknown"}
                  </p>
                  <p>
                    <strong>Angle:</strong> {topic.angle ?? "Unknown"}
                  </p>
                  <p>
                    <strong>Source:</strong> {topic.sourceTitle ?? topic.source ?? "Unknown"}
                  </p>
                </div>

                <div style={{ minWidth: 160 }}>
                  <div
                    style={{
                      ...pillStyle,
                      background: statusColor(topic.status),
                    }}
                  >
                    {topic.status}
                  </div>

                  <p style={{ marginTop: 12 }}>
                    <strong>Score:</strong> {topic.opportunityScore}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
                {topic.status === "discovered" && (
                  <form action="/api/discovery/generate-from-queue" method="post">
                    <input type="hidden" name="topicId" value={topic.id} />
                    <button type="submit" style={buttonStyle}>
                      Generate Article
                    </button>
                  </form>
                )}

                <Link href="/admin/articles" style={buttonStyle}>
                  View Articles
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  )
}

const summaryGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "12px",
  marginTop: "24px",
}

const summaryCard: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "16px",
  background: "#f8f9fa",
}

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "20px",
}

const buttonStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: "8px",
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  textDecoration: "none",
  fontWeight: "bold",
  border: "none",
  cursor: "pointer",
}

const pillStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "6px 12px",
  borderRadius: "999px",
  color: "#fff",
  fontWeight: "bold",
  textTransform: "capitalize",
}