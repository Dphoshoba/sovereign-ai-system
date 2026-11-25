import Link from "next/link"
import { getRelationshipRegistry } from "../../lib/gamma/relationship-reader"

export const dynamic = "force-dynamic"

export default async function RelationshipsPage() {
  const registry = await getRelationshipRegistry()

  return (
    <main style={pageStyle}>
      <section style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>Relationships</p>
          <h1 style={titleStyle}>Knowledge Relationships</h1>
          <p style={mutedStyle}>Read-only deterministic relationship layer for Gamma Phase II.</p>
        </div>
        <div style={metricsRowStyle}>
          <Metric label="Mission Count" value={String(registry.missionCount)} />
          <Metric label="Relationship Count" value={String(registry.relationshipCount)} />
          <Metric label="Connection Count" value={String(registry.connectionCount)} />
          <Metric label="Coverage Score" value={`${registry.coverageScore}%`} />
        </div>
      </section>

      <section style={gridStyle}>
        {registry.missions.map((mission) => (
          <article key={mission.mission} style={cardStyle}>
            <p style={eyebrowStyle}>Mission</p>
            <h2 style={cardTitleStyle}>{mission.missionTitle}</h2>
            <p style={mutedStyle}>Slug: {mission.mission}</p>
            <p style={mutedStyle}>Coverage: {mission.coverageScore}%</p>
            <p style={mutedStyle}>Connections: {mission.connectionCount}</p>
            <p style={mutedStyle}>Relationships: {mission.relationshipCount}</p>
            <Link href={`/relationships/${mission.mission}`} style={linkStyle}>
              Open mission relationships
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

const pageStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: 32,
  color: "var(--foreground)",
}

const headerStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: 20,
  background: "var(--card-background)",
  marginBottom: 18,
}

const titleStyle: React.CSSProperties = { margin: "6px 0", fontSize: 32 }
const eyebrowStyle: React.CSSProperties = { margin: 0, color: "var(--muted)", fontSize: 12, letterSpacing: 0.8, textTransform: "uppercase" }
const mutedStyle: React.CSSProperties = { margin: "6px 0", color: "var(--muted)" }
const metricsRowStyle: React.CSSProperties = { display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginTop: 14 }
const metricStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 8, padding: 12, background: "var(--background)" }
const metricLabelStyle: React.CSSProperties = { margin: 0, color: "var(--muted)", fontSize: 12 }
const metricValueStyle: React.CSSProperties = { margin: "6px 0 0", fontSize: 20, fontWeight: 700 }
const gridStyle: React.CSSProperties = { display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }
const cardStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 10, padding: 16, background: "var(--card-background)" }
const cardTitleStyle: React.CSSProperties = { margin: "4px 0 10px", fontSize: 20 }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }

