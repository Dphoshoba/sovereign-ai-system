import Link from "next/link"
import { getInsightRegistry } from "../../lib/gamma/insight-reader"

export const dynamic = "force-dynamic"

export default async function InsightsPage() {
  const registry = await getInsightRegistry()

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Insight Engine</p>
        <h1 style={titleStyle}>Mission Insights</h1>
        <p style={mutedStyle}>Deterministic insight and trend surface for mission intelligence.</p>
      </section>

      <section style={metricsStyle}>
        <Metric label="Insight Count" value={String(registry.insightCount)} />
        <Metric label="Trend Count" value={String(registry.trendCount)} />
        <Metric label="Emerging Theme Count" value={String(registry.emergingThemeCount)} />
        <Metric label="Cross-Domain Signals" value={String(registry.crossDomainSignals)} />
        <Metric label="Knowledge Momentum" value={String(registry.knowledgeMomentum)} />
        <Metric label="Attention Score" value={String(registry.attentionScore)} />
        <Metric label="Health Score" value={String(registry.healthScore)} />
      </section>

      <section style={gridStyle}>
        {registry.missions.map((mission) => (
          <article key={mission.mission} style={cardStyle}>
            <p style={eyebrowStyle}>Mission</p>
            <h2 style={sectionTitleStyle}>Research Mission 001</h2>
            <p style={mutedStyle}>{mission.missionTitle}</p>
            <p style={mutedStyle}>Insight Count: {mission.insightCount}</p>
            <p style={mutedStyle}>Knowledge Momentum: {mission.knowledgeMomentum}</p>
            <p style={mutedStyle}>Attention Score: {mission.attentionScore}</p>
            <Link href={`/insights/${mission.mission}`} style={linkStyle}>
              Open insights
            </Link>
          </article>
        ))}
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article style={metricStyle}>
      <p style={metricLabelStyle}>{label}</p>
      <p style={metricValueStyle}>{value}</p>
    </article>
  )
}

const pageStyle: React.CSSProperties = { maxWidth: 1320, margin: "0 auto", padding: 32, color: "var(--foreground)" }
const cardStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 10, padding: 16, background: "var(--card-background)", marginBottom: 14 }
const eyebrowStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.8 }
const titleStyle: React.CSSProperties = { margin: "6px 0", fontSize: 32 }
const sectionTitleStyle: React.CSSProperties = { margin: 0, fontSize: 20 }
const mutedStyle: React.CSSProperties = { margin: "6px 0", color: "var(--muted)" }
const metricsStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginBottom: 14 }
const metricStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 8, padding: 12, background: "var(--background)" }
const metricLabelStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)" }
const metricValueStyle: React.CSSProperties = { margin: "6px 0 0", fontWeight: 700, fontSize: 20 }
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }
