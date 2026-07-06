import Link from "next/link"
import { getAdvisorRegistry } from "../../lib/gamma/advisor-reader"

export default async function AdvisorPage() {
  const registry = await getAdvisorRegistry()

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Daily Advisor</p>
        <h1 style={titleStyle}>Operate Knowledge - Daily Advisor</h1>
        <p style={mutedStyle}>Deterministic read-only mission guidance for what David should work on today.</p>
      </section>

      <section style={metricsGridStyle}>
        <Metric label="Advice Count" value={String(registry.adviceCount)} />
        <Metric label="Priority Actions" value={String(registry.priorityActionCount)} />
        <Metric label="Urgency" value={String(registry.urgencyScore)} />
        <Metric label="Impact" value={String(registry.impactScore)} />
        <Metric label="Momentum" value={String(registry.momentumScore)} />
        <Metric label="Health" value={String(registry.healthScore)} />
        <Metric label="Knowledge Debt" value={String(registry.knowledgeDebt)} />
        <Metric label="Mission Focus" value={String(registry.missionFocusScore)} />
      </section>

      <section style={gridStyle}>
        {registry.missions.map((mission) => (
          <article key={mission.mission} style={cardStyle}>
            <p style={eyebrowStyle}>Priorities</p>
            <h2 style={sectionTitleStyle}>Research Mission 001</h2>
            <p style={mutedStyle}>{mission.missionTitle}</p>
            <p style={mutedStyle}>Actions: {mission.priorityActionCount}</p>
            <p style={mutedStyle}>Momentum: {mission.momentumScore}</p>
            <p style={mutedStyle}>Health: {mission.healthScore}</p>
            <p style={mutedStyle}>Knowledge Debt: {mission.knowledgeDebt}</p>
            <Link href={`/advisor/${mission.mission}`} style={linkStyle}>
              Open mission advisor
            </Link>
          </article>
        ))}
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article style={metricCardStyle}>
      <p style={metricLabelStyle}>{label}</p>
      <p style={metricValueStyle}>{value}</p>
    </article>
  )
}

const pageStyle: React.CSSProperties = { maxWidth: 1400, margin: "0 auto", padding: 32, color: "var(--foreground)" }
const cardStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 10, padding: 16, background: "var(--card-background)", marginBottom: 14 }
const eyebrowStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.8 }
const titleStyle: React.CSSProperties = { margin: "6px 0", fontSize: 32 }
const sectionTitleStyle: React.CSSProperties = { margin: 0, fontSize: 20 }
const mutedStyle: React.CSSProperties = { margin: "5px 0", color: "var(--muted)" }
const metricsGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginBottom: 14 }
const metricCardStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 8, padding: 12, background: "var(--background)" }
const metricLabelStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)" }
const metricValueStyle: React.CSSProperties = { margin: "6px 0 0", fontWeight: 700, fontSize: 20 }
const gridStyle: React.CSSProperties = { display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }