import { connection } from "next/server"
import { prisma } from "@/lib/prisma"

async function getGrowthData() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const response = await fetch(`${baseUrl}/api/growth`, {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("Failed to load growth data")
  }

  return response.json()
}

async function getGrowthIntelligence() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const response = await fetch(`${baseUrl}/api/growth/intelligence`, {
    cache: "no-store",
  })

  if (!response.ok) {
    return null
  }

  return response.json()
}

export default async function GrowthPage() {
  await connection()

  const data = await getGrowthData()
  const metrics = data.metrics

  const intelligenceData = await getGrowthIntelligence()
  const intelligence = intelligenceData?.intelligence

  const leadMagnets = await prisma.leadMagnet.findMany({
    orderBy: { createdAt: "desc" },
  })

  const totalDownloads = leadMagnets.reduce(
    (sum, magnet) => sum + magnet.downloads,
    0
  )
  const totalLeadMagnetSubscribers = leadMagnets.reduce(
    (sum, magnet) => sum + magnet.subscribers,
    0
  )
  const topLeadMagnet = [...leadMagnets].sort(
    (a, b) => b.subscribers - a.subscribers
  )[0]

  const leadSources = await prisma.subscriber.groupBy({
    by: ["source"],
    _count: {
      _all: true,
    },
  })

  const leadSourceRows = leadSources.map((row) => ({
    source: row.source || "unknown",
    count: row._count._all,
  }))

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Subscriber Growth</h1>
      <p>Audience growth, subscriber health, and recent signups.</p>

      <div style={gridStyle}>
        <StatCard label="Total Subscribers" value={metrics.totalSubscribers} />
        <StatCard label="Active Subscribers" value={metrics.activeSubscribers} />
        <StatCard label="New This Month" value={metrics.monthlySubscribers} />
        <StatCard label="Growth Rate" value={`${metrics.growthRate}%`} />
      </div>

      {intelligence && (
        <section style={sectionStyle}>
          <h2>Growth Intelligence</h2>

          <div style={cardStyle}>
            <p>
              <strong>Growth Score:</strong> {intelligence.growthScore}/100
            </p>

            <p>
              <strong>Status:</strong> {intelligence.status}
            </p>

            <p>
              <strong>Momentum:</strong> {intelligence.momentum}
            </p>

            <p>{intelligence.summary}</p>

            <h3>Strengths</h3>
            <ul>
              {intelligence.strengths.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h3>Risks</h3>
            <ul>
              {intelligence.risks.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h3>Opportunities</h3>
            <ul>
              {intelligence.opportunities.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h3>Recommendations</h3>
            <ul>
              {intelligence.recommendations.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section style={sectionStyle}>
        <h2>Lead Magnet Performance</h2>

        <div style={gridStyle}>
          <StatCard label="Total Lead Magnets" value={leadMagnets.length} />
          <StatCard label="Total Downloads" value={totalDownloads} />
          <StatCard
            label="Lead Magnet Subscribers"
            value={totalLeadMagnetSubscribers}
          />
          <StatCard
            label="Top Lead Magnet"
            value={
              topLeadMagnet
                ? `${topLeadMagnet.title} (${topLeadMagnet.subscribers})`
                : "None yet"
            }
          />
        </div>
      </section>

      <section style={sectionStyle}>
        <h2>Lead Sources</h2>

        <div style={{ display: "grid", gap: "12px" }}>
          {leadSourceRows.map((row) => (
            <div key={row.source} style={cardStyle}>
              <strong>{row.source}</strong>
              <p>{row.count} subscriber(s)</p>
            </div>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <h2>Recent Subscribers</h2>

        <div style={{ display: "grid", gap: "12px" }}>
          {data.recentSubscribers.map((subscriber: any) => (
            <div key={subscriber.id} style={cardStyle}>
              <strong>{subscriber.email}</strong>
              <p>Status: {subscriber.status}</p>
              <p>Joined: {new Date(subscriber.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

function StatCard({
  label,
  value,
}: {
  label: string
  value: number | string
}) {
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
}
