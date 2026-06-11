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
      <p style={eyebrowStyle}>V1 Primary Hub</p>
      <h1>Operations Center</h1>
      <p>
        Central command for content, publishing, distribution, and reporting.
        Start with{" "}
        <Link href="/admin/runtime" style={primaryInlineLinkStyle}>
          V1 Runtime
        </Link>{" "}
        or{" "}
        <Link href="/admin/command-center" style={primaryInlineLinkStyle}>
          V1 Command Center
        </Link>{" "}
        for sovereign executive operations.
      </p>

      <section style={primaryHubStyle}>
        <h2 style={{ marginTop: 0 }}>V1 Executive Entry Points</h2>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link href="/admin/runtime" style={buttonStyle}>V1 Runtime</Link>
          <Link href="/admin/command-center" style={buttonStyle}>V1 Command Center</Link>
          <Link href="/admin/boardroom" style={secondaryButtonStyle}>Boardroom</Link>
          <Link href="/admin/strategic-plan" style={secondaryButtonStyle}>Strategic Plan</Link>
        </div>
      </section>

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
          <Link href="/admin/revenue" style={buttonStyle}>Revenue</Link>
          <Link href="/admin/creator-leads" style={buttonStyle}>Creator Leads</Link>
          <Link href="/admin/clients" style={buttonStyle}>Clients</Link>
          <Link href="/admin/invoices" style={buttonStyle}>Invoices</Link>
          <Link href="/admin/runtime" style={buttonStyle}>V1 Runtime</Link>
          <Link href="/admin/command-center" style={buttonStyle}>Command Center</Link>
          <Link href="/admin/executive-overview" style={buttonStyle}>Executive Overview</Link>
          <Link href="/admin/executive-recommendations" style={buttonStyle}>Executive Recommendations</Link>
          <Link href="/admin/daily-briefing" style={buttonStyle}>Daily Briefing</Link>
          <Link href="/admin/weekly-review" style={buttonStyle}>Weekly Review</Link>
          <Link href="/admin/monthly-review" style={buttonStyle}>Monthly Review</Link>
          <Link href="/admin/quarterly-review" style={buttonStyle}>Quarterly Review</Link>
          <Link href="/admin/executive-forecast" style={buttonStyle}>Forecast</Link>
          <Link href="/admin/strategic-plan" style={buttonStyle}>Strategic Plan</Link>
          <Link href="/admin/execution" style={buttonStyle}>Execution Engine</Link>
          <Link href="/admin/goals" style={buttonStyle}>Quarterly Goals</Link>
          <Link href="/admin/initiative-performance" style={buttonStyle}>Initiative Performance</Link>
          <Link href="/admin/planning-cycles" style={buttonStyle}>Planning Cycles</Link>
          <Link href="/admin/boardroom" style={buttonStyle}>Executive Boardroom</Link>
          <Link href="/admin/decision-memory" style={buttonStyle}>Decision Memory</Link>
          <Link href="/admin/decision-outcomes" style={buttonStyle}>Decision Outcomes</Link>
          <Link href="/admin/executive-learning" style={buttonStyle}>Executive Learning</Link>
          <Link href="/admin/knowledge-graph" style={buttonStyle}>Knowledge Graph</Link>
          <Link href="/admin/executive-timeline" style={buttonStyle}>Executive Timeline</Link>
          <Link href="/admin/knowledge-graph-intelligence" style={buttonStyle}>Knowledge Intelligence</Link>
          <Link href="/admin/simulations" style={buttonStyle}>Simulations</Link>
          <Link href="/admin/scenarios" style={buttonStyle}>Strategy Scenarios</Link>
          <Link href="/admin/strategy-adjustments" style={buttonStyle}>Strategy Adjustments</Link>
          <Link href="/admin/recommendation-improvement" style={buttonStyle}>Recommendation Improvement</Link>
          <Link href="/admin/business-memory" style={buttonStyle}>Business Memory</Link>
          <Link href="/admin/revenue-intelligence" style={buttonStyle}>Revenue Intelligence</Link>
          <Link href="/admin/client-intelligence" style={buttonStyle}>Client Intelligence</Link>
          <Link href="/admin/automation-actions" style={buttonStyle}>Automation Actions</Link>
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

const secondaryButtonStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "var(--card-background)",
  color: "var(--foreground)",
  textDecoration: "none",
  fontWeight: "bold",
}

const eyebrowStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontSize: "12px",
  color: "var(--muted)",
  marginBottom: "8px",
}

const primaryInlineLinkStyle: React.CSSProperties = {
  color: "var(--foreground)",
  fontWeight: "bold",
}

const primaryHubStyle: React.CSSProperties = {
  marginTop: "24px",
  padding: "18px",
  borderRadius: "14px",
  border: "1px solid var(--border)",
  background: "var(--card-background)",
}