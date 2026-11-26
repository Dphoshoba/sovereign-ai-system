import Link from "next/link"
import { getMaturityRegistry } from "../../lib/gamma/maturity-reader"

export const dynamic = "force-dynamic"

export default async function MaturityPage() {
  const registry = await getMaturityRegistry()

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Mission Maturity Engine</p>
        <h1 style={titleStyle}>Reason Over Knowledge - Mission Maturity</h1>
        <p style={mutedStyle}>Deterministic read-only maturity scoring for EV-KOS missions.</p>
      </section>

      <section style={metricsGridStyle}>
        <Metric label="Mission Score" value={String(registry.missionScore)} />
        <Metric label="Coverage" value={`${registry.coverageScore}%`} />
        <Metric label="Readiness" value={`${registry.readinessScore}%`} />
        <Metric label="Reuse" value={`${registry.reuseScore}%`} />
        <Metric label="Health" value={`${registry.healthScore}%`} />
        <Metric label="Production Ready" value={`${registry.productionReadyPercentage}%`} />
      </section>

      <section style={cardStyle}>
        <p style={mutedStyle}>Strongest workspace: {registry.strongestWorkspace}</p>
        <p style={mutedStyle}>Weakest workspace: {registry.weakestWorkspace}</p>
      </section>

      <section style={gridStyle}>
        {registry.missions.map((mission) => (
          <article key={mission.mission} style={cardStyle}>
            <p style={eyebrowStyle}>Mission Maturity</p>
            <h2 style={sectionTitleStyle}>Womanhood</h2>
            <p style={mutedStyle}>{mission.missionTitle}</p>
            <p style={mutedStyle}>Maturity: {mission.classification}</p>
            <p style={mutedStyle}>Coverage: {mission.coverageScore}%</p>
            <p style={mutedStyle}>Readiness: {mission.readinessScore}%</p>
            <p style={mutedStyle}>Health: {mission.healthScore}%</p>
            <Link href={`/maturity/${mission.mission}`} style={linkStyle}>
              Open mission maturity
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
