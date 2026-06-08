import Link from "next/link"
import { prisma } from "@/lib/prisma"
import OperationsActions from "@/components/operations/OperationsActions"

export default async function OperationsPage() {
  const [articles, newsletters, socialPosts, subscribers] =
    await Promise.all([
      prisma.article.findMany(),
      prisma.newsletter.findMany(),
      prisma.socialPost.findMany(),
      prisma.subscriber.findMany(),
    ])

  const drafts = articles.filter((a) => a.status === "draft")
  const reviewRequired = articles.filter((a) => a.status === "review-required")
  const scheduled = articles.filter((a) => a.status === "scheduled")
  const published = articles.filter((a) => a.status === "published")

  const pendingNewsletters = newsletters.filter(
    (n) => n.status === "review-required" || n.status === "approved"
  )

  const pendingSocial = socialPosts.filter(
    (s) => s.status === "review-required" || s.status === "approved"
  )

  const activeSubscribers = subscribers.filter((s) => s.status === "active")

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Operations Center</h1>
      <p>Central command for content, publishing, distribution, and reporting.</p>

      <div style={gridStyle}>
        <StatCard label="Published Articles" value={published.length} />
        <StatCard label="Drafts" value={drafts.length} />
        <StatCard label="Review Required" value={reviewRequired.length} />
        <StatCard label="Scheduled" value={scheduled.length} />
        <StatCard label="Pending Newsletters" value={pendingNewsletters.length} />
        <StatCard label="Pending Social Posts" value={pendingSocial.length} />
        <StatCard label="Active Subscribers" value={activeSubscribers.length} />
      </div>

      <OperationsActions />

      <section style={sectionStyle}>
        <h2>Quick Actions</h2>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link href="/admin/planner" style={buttonStyle}>Weekly Planner</Link>
          <Link href="/admin/articles" style={buttonStyle}>Articles</Link>
          <Link href="/admin/newsletters" style={buttonStyle}>Newsletters</Link>
          <Link href="/admin/social" style={buttonStyle}>Social Queue</Link>
          <Link href="/admin/scheduled" style={buttonStyle}>Scheduled</Link>
          <Link href="/admin/reports" style={buttonStyle}>Reports</Link>
          <Link href="/admin/analytics" style={buttonStyle}>Analytics</Link>
          <Link href="/admin/growth" style={buttonStyle}>Growth</Link>
          <Link href="/admin/lead-magnets" style={buttonStyle}>Lead Magnets</Link>
          <Link href="/admin/delivery" style={buttonStyle}>Delivery</Link>
          <Link href="/admin/executive-overview" style={buttonStyle}>Executive Overview</Link>
          <Link href="/admin/executive-recommendations" style={buttonStyle}>Executive Recommendations</Link>
          <Link href="/admin/daily-briefing" style={buttonStyle}>Daily Briefing</Link>
          <Link href="/admin/weekly-review" style={buttonStyle}>Weekly Review</Link>
          <Link href="/admin/monthly-review" style={buttonStyle}>Monthly Review</Link>
          <Link href="/admin/executive-forecast" style={buttonStyle}>Forecast</Link>
          <Link href="/admin/strategic-plan" style={buttonStyle}>Strategic Plan</Link>
          <Link href="/admin/execution" style={buttonStyle}>Execution Engine</Link>
          <Link href="/admin/goals" style={buttonStyle}>Quarterly Goals</Link>
          <Link href="/admin/initiative-performance" style={buttonStyle}>Initiative Performance</Link>
          <Link href="/admin/planning-cycles" style={buttonStyle}>Planning Cycles</Link>
          <Link href="/admin/boardroom" style={buttonStyle}>Executive Boardroom</Link>
          <Link href="/admin/decision-memory" style={buttonStyle}>Decision Memory</Link>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2>Publishing Queue</h2>

        {reviewRequired.slice(0, 5).map((article) => (
          <div key={article.id} style={cardStyle}>
            <strong>{article.title}</strong>
            <p>Status: {article.status}</p>
            <p>Category: {article.category}</p>
          </div>
        ))}

        {reviewRequired.length === 0 && <p>No articles pending review.</p>}
      </section>

      <section style={sectionStyle}>
        <h2>Scheduled Content</h2>

        {scheduled.slice(0, 5).map((article) => (
          <div key={article.id} style={cardStyle}>
            <strong>{article.title}</strong>
            <p>
              Scheduled For:{" "}
              {article.scheduledFor
                ? new Date(article.scheduledFor).toLocaleString()
                : "Not set"}
            </p>
          </div>
        ))}

        {scheduled.length === 0 && <p>No scheduled content.</p>}
      </section>
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={statCardStyle}>
      <strong>{label}</strong>
      <span style={{ fontSize: "28px", fontWeight: "bold" }}>{value}</span>
    </div>
  )
}

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "16px",
  marginTop: "24px",
}

const statCardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "14px",
  padding: "18px",
  display: "grid",
  gap: "8px",
}

const sectionStyle: React.CSSProperties = {
  marginTop: "32px",
}

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "16px",
  marginBottom: "12px",
}

const buttonStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: "8px",
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  textDecoration: "none",
  fontWeight: "bold",
}