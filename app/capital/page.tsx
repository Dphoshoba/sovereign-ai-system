import Link from "next/link"
import { getCapitalRegistry } from "../../lib/gamma/capital-reader"

export const dynamic = "force-dynamic"

export default async function CapitalPage() {
  const registry = await getCapitalRegistry()

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Knowledge Capital Engine</p>
        <h1 style={titleStyle}>Knowledge Capital</h1>
        <p style={mutedStyle}>Deterministic valuation surface for mission knowledge assets.</p>
      </section>

      <section style={metricsStyle}>
        <Metric label="Asset Value" value={String(registry.assetValue)} />
        <Metric label="Knowledge Capital" value={String(registry.knowledgeCapital)} />
        <Metric label="Reuse Score" value={String(registry.reuseScore)} />
        <Metric label="Commercialization Score" value={String(registry.commercializationScore)} />
        <Metric label="Licensing Score" value={String(registry.licensingScore)} />
        <Metric label="Content Score" value={String(registry.contentScore)} />
        <Metric label="Health Score" value={String(registry.healthScore)} />
      </section>

      <section style={gridStyle}>
        {registry.missions.map((mission) => (
          <article key={mission.mission} style={cardStyle}>
            <p style={eyebrowStyle}>Mission</p>
            <h2 style={sectionTitleStyle}>Research Mission 001</h2>
            <p style={mutedStyle}>{mission.missionTitle}</p>
            <p style={mutedStyle}>Asset Value: {mission.assetValue}</p>
            <p style={mutedStyle}>Knowledge Capital: {mission.knowledgeCapital}</p>
            <Link href={`/capital/${mission.mission}`} style={linkStyle}>Open capital view</Link>
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
