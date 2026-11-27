import Link from "next/link"
import { getIntelligenceCoreRegistry } from "../../lib/gamma/intelligence-core-reader"

export const dynamic = "force-dynamic"

export default async function IntelligenceCorePage() {
  const registry = await getIntelligenceCoreRegistry()

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Intelligence Core</p>
        <h1 style={titleStyle}>Gamma Intelligence</h1>
        <p style={mutedStyle}>Unified adaptive intelligence system.</p>
      </section>

      <section style={metricsStyle}>
        <Metric label="Intelligence Score" value={String(registry.intelligenceScore)} />
        <Metric label="Adaptability Score" value={String(registry.adaptabilityScore)} />
        <Metric label="Learning Velocity" value={String(registry.learningVelocity)} />
        <Metric label="Innovation Capacity" value={String(registry.innovationCapacity)} />
        <Metric label="Impact Potential" value={String(registry.impactPotential)} />
        <Metric label="Market Readiness" value={String(registry.marketReadiness)} />
      </section>

      <section style={metricsStyle}>
        <Metric label="Ecosystem Strength" value={String(registry.ecosystemStrength)} />
        <Metric label="Knowledge Capital" value={String(registry.knowledgeCapital)} />
        <Metric label="Health Score" value={String(registry.healthScore)} />
      </section>

      <section style={gridStyle}>
        {registry.missions.map((mission) => (
          <article key={mission.mission} style={cardStyle}>
            <p style={eyebrowStyle}>Mission</p>
            <h2 style={sectionTitleStyle}>Research Mission 001</h2>
            <p style={mutedStyle}>{mission.missionTitle}</p>
            <p style={mutedStyle}>Intelligence: {mission.intelligenceScore}</p>
            <Link href={`/intelligence-core/${mission.mission}`} style={linkStyle}>View core</Link>
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
