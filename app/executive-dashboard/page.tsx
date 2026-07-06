import Link from "next/link"
import { getExecutiveDashboardRegistry } from "../../lib/gamma/executive-dashboard-reader"

export default async function ExecutiveDashboardPage() {
  const registry = await getExecutiveDashboardRegistry()

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Executive Dashboard</p>
        <h1 style={titleStyle}>Operate Knowledge - Executive Cockpit</h1>
        <p style={mutedStyle}>Deterministic mission-level strategic state and priority surface.</p>
      </section>

      <section style={metricsGridStyle}>
        <Metric label="Executive Score" value={String(registry.executiveScore)} />
        <Metric label="Strategic Alignment" value={String(registry.strategicAlignment)} />
        <Metric label="Mission Risk" value={String(registry.missionRisk)} />
        <Metric label="Opportunity Index" value={String(registry.opportunityIndex)} />
        <Metric label="Health" value={String(registry.healthScore)} />
        <Metric label="Readiness" value={String(registry.readinessScore)} />
      </section>

      <section style={gridStyle}>
        {registry.missions.map((mission) => (
          <article key={mission.mission} style={cardStyle}>
            <p style={eyebrowStyle}>Priority Radar</p>
            <h2 style={sectionTitleStyle}>Research Mission 001</h2>
            <p style={mutedStyle}>{mission.missionTitle}</p>
            <p style={mutedStyle}>Strategic Alignment: {mission.strategicAlignment}</p>
            <p style={mutedStyle}>Mission Risk: {mission.missionRisk}</p>
            <p style={mutedStyle}>Opportunity Index: {mission.opportunityIndex}</p>
            <p style={mutedStyle}>Health: {mission.healthScore}</p>
            <p style={mutedStyle}>Readiness: {mission.readinessScore}</p>
            <Link href={`/executive-dashboard/${mission.mission}`} style={linkStyle}>
              Open executive dashboard
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