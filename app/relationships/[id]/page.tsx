import Link from "next/link"
import { getMissionRelationships } from "../../../lib/gamma/relationship-reader"

export default async function MissionRelationshipsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getMissionRelationships(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <article style={cardStyle}>
          <h1 style={titleStyle}>Relationships Not Found</h1>
          <p style={mutedStyle}>No relationship data exists for mission {id}.</p>
          <Link href="/relationships" style={linkStyle}>
            Back to Relationships
          </Link>
        </article>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Relationships</p>
        <h1 style={titleStyle}>Womanhood</h1>
        <p style={mutedStyle}>{workspace.missionTitle}</p>
        <p style={mutedStyle}>Coverage: {workspace.coverageScore}%</p>
      </section>

      <section style={metricsGridStyle}>
        <Metric label="Relationship Count" value={String(workspace.relationshipCount)} />
        <Metric label="Connection Count" value={String(workspace.connectionCount)} />
        <Metric label="Workspace Count" value={String(workspace.workspaceCount)} />
        <Metric label="Research Links" value={String(workspace.researchLinks)} />
        <Metric label="Creator Links" value={String(workspace.creatorLinks)} />
        <Metric label="Ministry Links" value={String(workspace.ministryLinks)} />
        <Metric label="Executive Links" value={String(workspace.executiveLinks)} />
        <Metric label="Agency Links" value={String(workspace.agencyLinks)} />
        <Metric label="Knowledge Links" value={String(workspace.knowledgeLinks)} />
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Connections</h2>
          <div style={stackStyle}>
            {workspace.connections.map((connection, index) => (
              <div key={`${connection.source}-${connection.target}-${index}`} style={rowStyle}>
                <strong>{connection.sourceWorkspace}/{connection.source}</strong>
                <span style={mutedStyle}>{connection.relationship}</span>
                <strong>{connection.targetWorkspace}/{connection.target}</strong>
              </div>
            ))}
          </div>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Knowledge Graph</h2>
          <p style={mutedStyle}>Nodes: {workspace.graph.nodes.length}</p>
          <p style={mutedStyle}>Edges: {workspace.graph.edges.length}</p>
          <div style={stackStyle}>
            {workspace.graph.edges.map((edge, index) => (
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
        <h2 style={sectionTitleStyle}>Workspace Metrics</h2>
        <div style={stackStyle}>
          {workspace.workspaceMetrics.map((metric) => (
            <div key={metric.workspace} style={rowStyle}>
              <strong>{metric.workspace}</strong>
              <span style={mutedStyle}>in: {metric.inbound}</span>
              <span style={mutedStyle}>out: {metric.outbound}</span>
              <span style={mutedStyle}>total: {metric.total}</span>
            </div>
          ))}
        </div>
        <Link href="/relationships" style={linkStyle}>
          Back to Relationships
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
const titleStyle: React.CSSProperties = { margin: "6px 0", fontSize: 32 }
const sectionTitleStyle: React.CSSProperties = { margin: 0, fontSize: 18 }
const eyebrowStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.8 }
const mutedStyle: React.CSSProperties = { margin: "6px 0", color: "var(--muted)" }
const metricsGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 14 }
const metricCardStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 8, padding: 12, background: "var(--background)" }
const metricLabelStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)" }
const metricValueStyle: React.CSSProperties = { margin: "6px 0 0", fontWeight: 700, fontSize: 20 }
const twoColStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 12, marginBottom: 14 }
const stackStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }
const rowStyle: React.CSSProperties = { display: "grid", gap: 10, gridTemplateColumns: "1fr auto 1fr", borderTop: "1px solid var(--border)", paddingTop: 8, alignItems: "center" }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600, display: "inline-block", marginTop: 10 }
