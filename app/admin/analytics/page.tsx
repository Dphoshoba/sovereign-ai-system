import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { SimpleBarChart } from "@/components/analytics/SimpleBarChart"

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export default async function AdminAnalyticsPage() {
  const now = new Date()
  const monthStart = startOfMonth(now)

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

  const publishedArticles = articles.filter((a) => a.status === "published")
  const publishedSocialPosts = socialPosts.filter((p) => p.status === "published")
  const sentNewsletters = newsletters.filter((n) => n.status === "sent")
  const activeSubscribers = subscribers.filter((s) => s.status === "active")

  const newSubscribersThisMonth = subscribers.filter(
    (s) => new Date(s.createdAt) >= monthStart
  )

  const recentActivity = [
    ...publishedArticles.map((item) => ({
      type: "Article Published",
      title: item.title,
      date: item.publishedAt || item.updatedAt,
    })),
    ...sentNewsletters.map((item) => ({
      type: "Newsletter Sent",
      title: item.subject,
      date: item.sentAt || item.updatedAt,
    })),
    ...publishedSocialPosts.map((item) => ({
      type: `Social Published: ${item.platform}`,
      title: item.content.slice(0, 80),
      date: item.publishedAt || item.updatedAt,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)

  const chartData = [
    { label: "Articles", value: publishedArticles.length },
    { label: "Social Posts", value: publishedSocialPosts.length },
    { label: "Newsletters", value: sentNewsletters.length },
    { label: "Subscribers", value: activeSubscribers.length },
  ]

  const workflowData = [
    {
      label: "Articles Published",
      value: publishedArticles.length,
    },
    {
      label: "Social Posts Published",
      value: publishedSocialPosts.length,
    },
    {
      label: "Newsletters Sent",
      value: sentNewsletters.length,
    },
  ]

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Executive Analytics</h1>
      <p>High-level publishing, audience, and distribution overview.</p>

      <div style={gridStyle}>
        <StatCard label="Articles Published" value={publishedArticles.length} />
        <StatCard label="Social Posts Published" value={publishedSocialPosts.length} />
        <StatCard label="Newsletters Sent" value={sentNewsletters.length} />
        <StatCard label="Active Subscribers" value={activeSubscribers.length} />
        <StatCard label="New Subscribers This Month" value={newSubscribersThisMonth.length} />
      </div>

      <SimpleBarChart
        title="Publishing Overview"
        data={chartData}
      />

      <SimpleBarChart
        title="Distribution Workflow"
        data={workflowData}
      />

      <section style={{ marginTop: "32px" }}>
        <h2>Quick Links</h2>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link href="/admin/articles" style={buttonStyle}>Articles</Link>
          <Link href="/admin/social" style={buttonStyle}>Social Queue</Link>
          <Link href="/admin/newsletters" style={buttonStyle}>Newsletters</Link>
          <Link href="/admin/subscribers" style={buttonStyle}>Subscribers</Link>
        </div>
      </section>

      <section style={{ marginTop: "32px" }}>
        <h2>Recent Activity</h2>

        <div style={{ display: "grid", gap: "12px" }}>
          {recentActivity.map((activity, index) => (
            <div key={`${activity.type}-${index}`} style={cardStyle}>
              <strong>{activity.type}</strong>
              <p>{activity.title}</p>
              <small>{new Date(activity.date).toLocaleString()}</small>
            </div>
          ))}
        </div>
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
  border: "1px solid #ddd",
  borderRadius: "14px",
  padding: "18px",
  display: "grid",
  gap: "8px",
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "16px",
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
