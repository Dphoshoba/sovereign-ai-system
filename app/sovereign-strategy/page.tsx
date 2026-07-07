import Link from "next/link"
import { getSovereignStrategyRegistry } from "../../lib/gamma/sovereign-strategy-reader"

export const dynamic = "force-dynamic"

export default async function SovereignStrategyPage() {
  const registry = await getSovereignStrategyRegistry()

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Gamma Sovereign Strategy</p>
        <h1 style={titleStyle}>Sovereign Strategy Engine</h1>
        <p style={mutedStyle}>Deterministic strategy intelligence for sovereign mission alignment and execution.</p>
      </section>

      <section style={metricsStyle}>
        <Metric label="Strategy Score" value={String(registry.strategyScore)} />
        <Metric label="Alignment Score" value={String(registry.alignmentScore)} />
        <Metric label="Execution Score" value={String(registry.executionScore)} />
        <Metric label="Mission Cohesion" value={String(registry.missionCohesion)} />
        <Metric label="Resource Allocation" value={String(registry.resourceAllocation)} />
        <Metric label="Success Probability" value={String(registry.successProbability)} />
        <Metric label="Risk Mitigation" value={String(registry.riskMitigation)} />
      </section>

      <section style={gridStyle}>
        {registry.missions.map((mission) => (
          <article key={mission.mission} style={cardStyle}>
            <p style={eyebrowStyle}>Mission</p>
            <h2 style={sectionTitleStyle}>Mission {mission.mission}</h2>
            <p style={mutedStyle}>{mission.missionTitle}</p>
            <p style={mutedStyle}>Strategy Score: {mission.strategyScore}</p>
            <p style={mutedStyle}>Alignment Score: {mission.alignmentScore}</p>
            <Link href={`/sovereign-strategy/${mission.mission}`} style={linkStyle}>View strategy</Link>
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
