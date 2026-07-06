import Link from "next/link"
import { getGovernanceRegistry } from "../../lib/gamma/governance-reader"

export const dynamic = "force-dynamic"

export default async function GovernancePage() {
  const registry = await getGovernanceRegistry()

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Governance Engine</p>
        <h1 style={titleStyle}>Governance Dashboard</h1>
        <p style={mutedStyle}>Deterministic governance and freeze-readiness surface.</p>
      </section>

      <section style={metricsStyle}>
        <Metric label="Determinism Score" value={String(registry.determinismScore)} />
        <Metric label="Hydration Score" value={String(registry.hydrationScore)} />
        <Metric label="SSR Score" value={String(registry.ssrScore)} />
        <Metric label="Security Score" value={String(registry.securityScore)} />
        <Metric label="Governance Score" value={String(registry.governanceScore)} />
        <Metric label="Freeze Readiness" value={String(registry.freezeReadiness)} />
      </section>

      <section style={gridStyle}>
        {registry.missions.map((mission) => (
          <article key={mission.mission} style={cardStyle}>
            <p style={eyebrowStyle}>Mission</p>
            <h2 style={sectionTitleStyle}>Research Mission 001</h2>
            <p style={mutedStyle}>{mission.missionTitle}</p>
            <p style={mutedStyle}>Governance Score: {mission.governanceScore}</p>
            <p style={mutedStyle}>Freeze Readiness: {mission.freezeReadiness}</p>
            <Link href={`/governance/${mission.mission}`} style={linkStyle}>Open governance</Link>
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
