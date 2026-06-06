import { prisma } from "@/lib/prisma"

export default async function ReportsPage() {
  const now = new Date()

  const [
    articles,
    socialPosts,
    newsletters,
    subscribers,
  ] = await Promise.all([
    prisma.article.findMany(),
    prisma.socialPost.findMany(),
    prisma.newsletter.findMany(),
    prisma.subscriber.findMany(),
  ])

  const publishedArticles = articles.filter(
    (a) => a.status === "published"
  )

  const publishedSocialPosts = socialPosts.filter(
    (s) => s.status === "published"
  )

  const sentNewsletters = newsletters.filter(
    (n) => n.status === "sent"
  )

  const activeSubscribers = subscribers.filter(
    (s) => s.status === "active"
  )

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Monthly Reports</h1>

      <div style={cardStyle}>
        <h2>
          {now.toLocaleString("default", {
            month: "long",
          })} {now.getFullYear()}
        </h2>

        <p>
          <strong>Articles Published:</strong>{" "}
          {publishedArticles.length}
        </p>

        <p>
          <strong>Social Posts Published:</strong>{" "}
          {publishedSocialPosts.length}
        </p>

        <p>
          <strong>Newsletters Sent:</strong>{" "}
          {sentNewsletters.length}
        </p>

        <p>
          <strong>Active Subscribers:</strong>{" "}
          {activeSubscribers.length}
        </p>

        <a
          href="/api/reports/csv"
          style={{
            display: "inline-block",
            marginTop: "20px",
            padding: "10px 14px",
            borderRadius: "8px",
            background: "#111",
            color: "#fff",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Download CSV Report
        </a>
      </div>
    </main>
  )
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "20px",
  marginTop: "20px",
}