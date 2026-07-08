import Link from "next/link"
import { getKnowledgeIntelligenceWorkspace } from "../../../lib/gamma/knowledge-intelligence-reader"

export const dynamic = "force-dynamic"

export default async function KnowledgeIntelligenceMissionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getKnowledgeIntelligenceWorkspace(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <h1 style={titleStyle}>Knowledge Intelligence Not Found</h1>
          <p style={mutedStyle}>The requested knowledge intelligence workspace "{id}" does not exist.</p>
        </section>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>Knowledge Intelligence</p>
          <h1 style={titleStyle}>{workspace.missionTitle}</h1>
          <p style={subtitleStyle}>Preview-only intelligence summary across the full Gamma workspace stack.</p>
        </div>
        <div style={pillColumnStyle}>
          <Pill label="Score" value={String(workspace.intelligenceScore)} />
          <Pill label="Confidence" value={workspace.confidence} />
          <Pill label="Mission" value={workspace.id} />
        </div>
      </section>

      <section style={grid6Style}>
        <MetricCard label="Mission Count" value={String(workspace.missionCount)} detail="Missions" />
        <MetricCard label="Workspace Count" value={String(workspace.workspaceCount)} detail="Workspaces" />
        <MetricCard label="Knowledge Assets" value={String(workspace.assetCount)} detail="Assets" />
        <MetricCard label="Framework Count" value={String(workspace.frameworkCount)} detail="Frameworks" />
        <MetricCard label="Question Count" value={String(workspace.questionCount)} detail="Questions" />
        <MetricCard label="Discovery Count" value={String(workspace.discoveryCount)} detail="Discoveries" />
      </section>

      <section style={grid6Style}>
        <MetricCard label="Teaching Count" value={String(workspace.teachingCount)} detail="Teaching" />
        <MetricCard label="Course Count" value={String(workspace.courseCount)} detail="Courses" />
        <MetricCard label="Presentation Count" value={String(workspace.presentationCount)} detail="Presentations" />
        <MetricCard label="Decision Count" value={String(workspace.decisionCount)} detail="Decisions" />
        <MetricCard label="Prompt Count" value={String(workspace.promptCount)} detail="Prompts" />
        <MetricCard label="Cross References" value={String(workspace.crossReferenceCount)} detail="Cross references" />
      </section>

      <section style={grid2Style}>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Intelligence Signals</h2>
          <div style={stackStyle}>
            {workspace.intelligenceSignals.map((signal) => (
              <div key={signal.id} style={rowStyle}>
                <div>
                  <strong>{signal.title}</strong>
                  <p style={mutedStyle}>{signal.source}</p>
                </div>
                <span style={mutedStyle}>{signal.score}</span>
                <Badge value={signal.status} />
              </div>
            ))}
          </div>
        </article>

        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Knowledge Graph Preview</h2>
          <p style={mutedStyle}>Nodes: {workspace.knowledgeGraphPreview.nodes.length}</p>
          <p style={mutedStyle}>Edges: {workspace.knowledgeGraphPreview.edges.length}</p>
          <div style={stackStyle}>
            {workspace.knowledgeGraphPreview.nodes.map((node) => (
              <div key={node.id} style={rowStyle}>
                <strong>{node.label}</strong>
                <Badge value={node.type} />
              </div>
            ))}
          </div>
        </article>
      </section>

      <section style={grid2Style}>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Cross Workspace Summary</h2>
          <List items={workspace.crossWorkspaceSummary} />
          <h3 style={subTitleStyle}>Signal Preview</h3>
          <List items={workspace.signalPreview} />
        </article>

        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Insights and Recommendations</h2>
          <List items={workspace.insights} />
          <h3 style={subTitleStyle}>Recommendations</h3>
          <List items={workspace.recommendations} />
        </article>
      </section>

      <section style={grid2Style}>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Workspace Status</h2>
          <div style={stackStyle}>
            {workspace.workspaceStatus.map((item) => (
              <div key={item.workspace} style={rowStyle}>
                <strong>{item.workspace}</strong>
                <span style={mutedStyle}>{item.progress}%</span>
                <Badge value={item.status} />
              </div>
            ))}
          </div>
        </article>

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
      </section>

      <section style={grid2Style}>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Daily Questions</h2>
          <List items={workspace.dailyQuestions} />
          <h3 style={subTitleStyle}>Weekly Review</h3>
          <List items={workspace.weeklyReview} />
        </article>

        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Related Missions</h2>
          <div style={stackStyle}>
            {workspace.relatedMissions.map((mission) => (
              <div key={mission.id} style={rowStyle}>
                <strong>{mission.title}</strong>
                <Badge value={mission.status} />
              </div>
            ))}
          </div>
        </article>
      </section>

      <section style={footerStyle}>
        <Link href="/knowledge-intelligence" style={linkStyle}>
          Back to Knowledge Intelligence Layer
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
const grid6Style: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }
const grid2Style: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12, marginBottom: 24 }
const metricCardStyle: React.CSSProperties = { border: "1px solid var(--border)", background: "var(--card-background)", borderRadius: 8, padding: 16 }
const metricLabelStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)" }
const metricValueStyle: React.CSSProperties = { margin: "6px 0 0", fontSize: 20, fontWeight: 700 }
const listStyle: React.CSSProperties = { margin: "8px 0 0", paddingLeft: 18 }
const listItemStyle: React.CSSProperties = { marginBottom: 8 }
const stackStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8 }
const rowStyle: React.CSSProperties = { borderTop: "1px solid var(--border)", paddingTop: 8, display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, alignItems: "start" }
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
