import Link from "next/link"
import { getMissionKnowledgeGraph } from "../../../lib/gamma/graph-reader"

export default async function MissionKnowledgeGraphPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const graph = await getMissionKnowledgeGraph(id)

  if (!graph) {
    return (
      <main style={pageStyle}>
        <article style={cardStyle}>
          <h1 style={titleStyle}>Knowledge Graph Not Found</h1>
          <p style={mutedStyle}>No graph is available for mission {id}.</p>
          <Link href="/knowledge-graph" style={linkStyle}>
            Back to Knowledge Graph
          </Link>
        </article>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Knowledge Graph</p>
        <h1 style={titleStyle}>Womanhood</h1>
        <p style={mutedStyle}>{graph.missionTitle}</p>
      </section>

      <section style={metricsStyle}>
        <Metric label="Node Count" value={String(graph.nodeCount)} />
        <Metric label="Edge Count" value={String(graph.edgeCount)} />
        <Metric label="Mission Count" value={String(graph.missionCount)} />
        <Metric label="Asset Count" value={String(graph.assetCount)} />
        <Metric label="Coverage Score" value={`${graph.coverageScore}%`} />
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Chain View</h2>
        <p style={chainStyle}>{graph.chainView.join(" -> ")}</p>
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Nodes</h2>
          <div style={stackStyle}>
            {graph.nodes.map((node) => (
              <div key={node.id} style={rowStyle}>
                <strong>{node.label}</strong>
                <span style={mutedStyle}>{node.type}</span>
              </div>
            ))}
          </div>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Edges</h2>
          <div style={stackStyle}>
            {graph.edges.map((edge, index) => (
              <div key={`${edge.from}-${edge.to}-${index}`} style={rowStyle}>
                <span>{edge.from}</span>
                <span style={mutedStyle}>{edge.relationship}</span>
                <span>{edge.to}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section style={cardStyle}>
        <Link href="/knowledge-graph" style={linkStyle}>
          Back to Knowledge Graph
        </Link>
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

const pageStyle: React.CSSProperties = { maxWidth: 1300, margin: "0 auto", padding: 32, color: "var(--foreground)" }
const cardStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 10, padding: 16, background: "var(--card-background)", marginBottom: 14 }
const eyebrowStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.8 }
const titleStyle: React.CSSProperties = { margin: "6px 0", fontSize: 32 }
const sectionTitleStyle: React.CSSProperties = { margin: 0, fontSize: 18 }
const mutedStyle: React.CSSProperties = { margin: "6px 0", color: "var(--muted)" }
const metricsStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 14 }
const metricCardStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 8, padding: 12, background: "var(--background)" }
const metricLabelStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)" }
const metricValueStyle: React.CSSProperties = { margin: "6px 0 0", fontWeight: 700, fontSize: 20 }
const twoColStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 12, marginBottom: 14 }
const stackStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }
const rowStyle: React.CSSProperties = { borderTop: "1px solid var(--border)", paddingTop: 8, display: "grid", gap: 8, gridTemplateColumns: "1fr auto 1fr" }
const chainStyle: React.CSSProperties = { margin: "10px 0 0", lineHeight: 1.6 }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }
