import Link from "next/link"
import { getKnowledgeGraphRegistry } from "../../lib/gamma/graph-reader"

export default async function KnowledgeGraphPage() {
  const registry = await getKnowledgeGraphRegistry()

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Knowledge Graph</p>
        <h1 style={titleStyle}>Knowledge Graph Viewer</h1>
        <p style={mutedStyle}>Read-only graph visualization for cross-workspace knowledge flow.</p>
      </section>

      <section style={metricsStyle}>
        <Metric label="Mission Count" value={String(registry.missionCount)} />
        <Metric label="Node Count" value={String(registry.nodeCount)} />
        <Metric label="Edge Count" value={String(registry.edgeCount)} />
        <Metric label="Asset Count" value={String(registry.assetCount)} />
        <Metric label="Coverage Score" value={`${registry.coverageScore}%`} />
      </section>

      <section style={gridStyle}>
        {registry.missions.map((mission) => (
          <article key={mission.mission} style={cardStyle}>
            <p style={eyebrowStyle}>Mission</p>
            <h2 style={sectionTitleStyle}>{mission.missionTitle}</h2>
            <p style={mutedStyle}>Nodes: {mission.nodeCount}</p>
            <p style={mutedStyle}>Edges: {mission.edgeCount}</p>
            <p style={mutedStyle}>Coverage: {mission.coverageScore}%</p>
            <Link href={`/knowledge-graph/${mission.mission}`} style={linkStyle}>
              Open mission graph
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

const pageStyle: React.CSSProperties = { maxWidth: 1200, margin: "0 auto", padding: 32, color: "var(--foreground)" }
const cardStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 10, padding: 16, background: "var(--card-background)", marginBottom: 14 }
const eyebrowStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.8 }
const titleStyle: React.CSSProperties = { margin: "6px 0", fontSize: 32 }
const sectionTitleStyle: React.CSSProperties = { margin: "6px 0", fontSize: 20 }
const mutedStyle: React.CSSProperties = { margin: "6px 0", color: "var(--muted)" }
const metricsStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 14 }
const metricStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 8, padding: 12, background: "var(--background)" }
const metricLabelStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)" }
const metricValueStyle: React.CSSProperties = { margin: "6px 0 0", fontWeight: 700, fontSize: 20 }
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }
