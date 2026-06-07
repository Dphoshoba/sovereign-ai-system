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

export default async function GrowthPage() {
  const data = await getGrowthData()
  const metrics = data.metrics

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
  border: "1px solid #ddd",
  borderRadius: "14px",
  padding: "18px",
  display: "grid",
  gap: "8px",
}

const sectionStyle: React.CSSProperties = {
  marginTop: "32px",
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "16px",
}
