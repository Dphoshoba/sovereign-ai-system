import Link from "next/link"
import { getSharedKnowledgeWorkspace } from "../../../lib/gamma/shared-knowledge-reader"

export default async function SharedKnowledgeMissionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getSharedKnowledgeWorkspace(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <h1 style={titleStyle}>Shared Knowledge Not Found</h1>
          <p style={mutedStyle}>The requested shared knowledge workspace "{id}" does not exist.</p>
        </section>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>Shared Knowledge Layer</p>
          <h1 style={titleStyle}>{workspace.missionTitle}</h1>
          <p style={subtitleStyle}>Governed reusable knowledge for discoveries, frameworks, prompts, templates and cross references.</p>
        </div>
        <div style={pillColumnStyle}>
          <Pill label="Status" value={workspace.status} />
          <Pill label="Confidence" value={workspace.confidence} />
          <Pill label="Health" value={String(workspace.knowledgeHealthScore)} />
        </div>
      </section>

      <section style={grid5Style}>
        <MetricCard label="Asset Count" value={String(workspace.assetCount)} detail="Curated assets" />
        <MetricCard label="Framework Count" value={String(workspace.frameworkCount)} detail="Reusable frameworks" />
        <MetricCard label="Prompt Count" value={String(workspace.promptCount)} detail="Reusable prompts" />
        <MetricCard label="Template Count" value={String(workspace.templateCount)} detail="Reusable templates" />
        <MetricCard label="Discovery Count" value={String(workspace.discoveryCount)} detail="Promoted discoveries" />
      </section>

      <section style={grid2Style}>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Knowledge Assets</h2>
          <div style={stackStyle}>
            {workspace.knowledgeAssets.slice(0, 18).map((asset) => (
              <div key={asset.id} style={rowCardStyle}>
                <div style={rowHeaderStyle}>
                  <strong>{asset.title}</strong>
                  <Badge value={asset.category} />
                </div>
                <p style={mutedStyle}>Domain: {asset.domain}</p>
                <p style={mutedStyle}>Confidence: {asset.confidence}</p>
              </div>
            ))}
          </div>
        </article>

        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Search and Graph Preview</h2>
          <h3 style={subTitleStyle}>Search Preview</h3>
          <List items={workspace.searchPreview} />
          <h3 style={subTitleStyle}>Knowledge Graph Preview (Static)</h3>
          <p style={mutedStyle}>Nodes: {workspace.knowledgeGraphPreview.nodes.length}</p>
          <p style={mutedStyle}>Edges: {workspace.knowledgeGraphPreview.edges.length}</p>
          <div style={stackStyle}>
            {workspace.knowledgeGraphPreview.edges.slice(0, 8).map((edge) => (
              <div key={`${edge.from}-${edge.to}-${edge.relation}`} style={rowCardStyle}>
                <span style={mutedStyle}>
                  {edge.from} → {edge.to}
                </span>
                <Badge value={edge.relation} />
              </div>
            ))}
          </div>
        </article>
      </section>

      <section style={grid2Style}>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Timeline</h2>
          <div style={stackStyle}>
            {workspace.timeline.map((item) => (
              <div key={`${item.date}-${item.event}`} style={timelineRowStyle}>
                <span style={timelineDateStyle}>{item.date}</span>
                <span style={timelineEventStyle}>{item.event}</span>
                <Badge value={item.status} />
              </div>
            ))}
          </div>
        </article>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Related Missions and Applications</h2>
          <div style={stackStyle}>
            {workspace.relatedMissions.map((mission) => (
              <div key={mission.id} style={rowCardStyle}>
                <div style={rowHeaderStyle}>
                  <strong>{mission.title}</strong>
                  <Badge value={mission.status} />
                </div>
                <p style={mutedStyle}>{mission.id}</p>
              </div>
            ))}
          </div>
          <h3 style={subTitleStyle}>Suggested Applications</h3>
          <List items={workspace.suggestedApplications} />
        </article>
      </section>

      <section style={footerStyle}>
        <Link href="/shared-knowledge" style={linkStyle}>
          Back to Shared Knowledge Layer
        </Link>
      </section>
    </main>
  )
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article style={metricCardStyle}>
      <p style={metricLabelStyle}>{label}</p>
      <p style={metricValueStyle}>{value}</p>
      <p style={mutedStyle}>{detail}</p>
    </article>
  )
}

function List({ items }: { items: string[] }) {
  return (
    <ul style={listStyle}>
      {items.map((item) => (
        <li key={item} style={listItemStyle}>
          {item}
        </li>
      ))}
    </ul>
  )
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span style={pillStyle}>
      <span style={pillLabelStyle}>{label}</span>
      <span style={pillValueStyle}>{value}</span>
    </span>
  )
}

function Badge({ value }: { value: string }) {
  return <span style={badgeStyle}>{value}</span>
}

const pageStyle: React.CSSProperties = {
  padding: 40,
  maxWidth: 1400,
  margin: "0 auto",
  fontFamily: "Arial, sans-serif",
  background: "var(--background)",
  color: "var(--foreground)",
}

const headerStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  background: "var(--card-background)",
  borderRadius: 8,
  padding: 28,
  marginBottom: 24,
  display: "flex",
  justifyContent: "space-between",
  gap: 24,
}

const eyebrowStyle: React.CSSProperties = { margin: 0, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)" }
const titleStyle: React.CSSProperties = { margin: "8px 0", fontSize: 36 }
const subtitleStyle: React.CSSProperties = { margin: 0, color: "var(--muted)", maxWidth: 760, lineHeight: 1.6 }
const cardStyle: React.CSSProperties = { border: "1px solid var(--border)", background: "var(--card-background)", borderRadius: 8, padding: 16 }
const cardTitleStyle: React.CSSProperties = { margin: 0, fontSize: 16 }
const subTitleStyle: React.CSSProperties = { margin: "14px 0 0", fontSize: 14 }
const mutedStyle: React.CSSProperties = { margin: "6px 0 0", color: "var(--muted)", lineHeight: 1.5 }
const grid5Style: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 24 }
const grid2Style: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12, marginBottom: 24 }
const metricCardStyle: React.CSSProperties = { border: "1px solid var(--border)", background: "var(--card-background)", borderRadius: 8, padding: 16 }
const metricLabelStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)" }
const metricValueStyle: React.CSSProperties = { margin: "6px 0 0", fontSize: 20, fontWeight: 700 }
const listStyle: React.CSSProperties = { margin: "8px 0 0", paddingLeft: 18 }
const listItemStyle: React.CSSProperties = { marginBottom: 8 }
const stackStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8 }
const rowCardStyle: React.CSSProperties = { borderTop: "1px solid var(--border)", paddingTop: 8 }
const rowHeaderStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }
const timelineRowStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "110px 1fr auto", gap: 12, alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 8 }
const timelineDateStyle: React.CSSProperties = { fontSize: 12, color: "var(--muted)" }
const timelineEventStyle: React.CSSProperties = { fontSize: 14 }
const footerStyle: React.CSSProperties = { marginTop: 24 }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }
const pillColumnStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }
const pillStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 999, padding: "6px 10px", display: "inline-flex", gap: 8, alignItems: "center", background: "var(--card-background)" }
const pillLabelStyle: React.CSSProperties = { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--muted)" }
const pillValueStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600 }
const badgeStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 999, padding: "4px 8px", fontSize: 11, color: "#16a34a" }
