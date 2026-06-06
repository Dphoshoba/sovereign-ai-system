import { prisma } from "@/lib/prisma"
import ExecutiveIntelligence from "@/components/reports/ExecutiveIntelligence"
import GrowthTrends from "@/components/reports/GrowthTrends"
import ContentPlanning from "@/components/reports/ContentPlanning"

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

      <ExecutiveIntelligence />
      <GrowthTrends />
      <ContentPlanning />

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
          background: "#fafafa",
        }}
      >
        <h2>Executive Summary</h2>

        <p>
          During this reporting period, Echoes & Visions published{" "}
          <strong>{publishedArticles.length}</strong> articles,
          distributed <strong>{publishedSocialPosts.length}</strong> social posts,
          delivered <strong>{sentNewsletters.length}</strong> newsletters,
          and maintained <strong>{activeSubscribers.length}</strong> active subscribers.
        </p>

        <p>
          Content production and distribution workflows are operating successfully
          through the publishing platform with analytics, newsletter delivery,
          social publishing, and audience management functioning end-to-end.
        </p>
      </section>

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

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "20px" }}>
          <a href="/api/reports/csv" style={buttonStyle}>
            Download CSV Report
          </a>

          <a href="/api/reports/pdf" style={secondaryButtonStyle}>
            Download PDF Report
          </a>
        </div>
      </div>

      <section style={cardStyle}>
        <h2>Recent Articles</h2>

        {publishedArticles
          .slice()
          .sort(
            (a, b) =>
              new Date(b.publishedAt ?? b.updatedAt).getTime() -
              new Date(a.publishedAt ?? a.updatedAt).getTime()
          )
          .slice(0, 5)
          .map((article) => (
            <div
              key={article.id}
              style={{
                borderBottom: "1px solid #eee",
                padding: "10px 0",
              }}
            >
              <strong>{article.title}</strong>

              <div>
                {article.publishedAt
                  ? new Date(article.publishedAt).toLocaleString()
                  : "Not Published"}
              </div>
            </div>
          ))}
      </section>

      <section style={cardStyle}>
        <h2>Recent Newsletters</h2>

        {sentNewsletters
          .slice()
          .sort(
            (a, b) =>
              new Date(b.sentAt ?? b.updatedAt).getTime() -
              new Date(a.sentAt ?? a.updatedAt).getTime()
          )
          .slice(0, 5)
          .map((newsletter) => (
            <div
              key={newsletter.id}
              style={{
                borderBottom: "1px solid #eee",
                padding: "10px 0",
              }}
            >
              <strong>{newsletter.subject}</strong>

              <div>
                {newsletter.sentAt
                  ? new Date(newsletter.sentAt).toLocaleString()
                  : "Not Sent"}
              </div>
            </div>
          ))}
      </section>

      <section style={cardStyle}>
        <h2>Recent Social Posts</h2>

        {publishedSocialPosts
          .slice()
          .sort(
            (a, b) =>
              new Date(b.publishedAt ?? b.updatedAt).getTime() -
              new Date(a.publishedAt ?? a.updatedAt).getTime()
          )
          .slice(0, 5)
          .map((post) => (
            <div
              key={post.id}
              style={{
                borderBottom: "1px solid #eee",
                padding: "10px 0",
              }}
            >
              <strong>{post.platform}</strong>

              <div>{post.content.slice(0, 120)}...</div>
            </div>
          ))}
      </section>
    </main>
  )
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "20px",
  marginTop: "20px",
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

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#333",
}