import Link from "next/link"
import { getKnowledgeIntelligenceWorkspace } from "../../lib/gamma/knowledge-intelligence-reader"

export const dynamic = "force-dynamic"

export default async function KnowledgeIntelligencePage() {
  const workspace = await getKnowledgeIntelligenceWorkspace("womanhood")

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <h1 style={titleStyle}>Knowledge Intelligence Not Found</h1>
          <p style={mutedStyle}>The requested knowledge intelligence layer does not exist.</p>
        </section>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>EV-KOS</p>
          <h1 style={titleStyle}>Knowledge Intelligence</h1>
          <p style={subtitleStyle}>A deterministic intelligence view that synthesizes signals across Research, Creator, Ministry, Executive, Agency, Shared Knowledge and Second Brain.</p>
          <p style={mutedStyle}>Research Mission 001 — Womanhood</p>
        </div>
        <div style={pillColumnStyle}>
          <Pill label="Status" value={workspace.status} />
          <Pill label="Confidence" value={workspace.confidence} />
          <Pill label="Score" value={String(workspace.intelligenceScore)} />
        </div>
      </section>

      <section style={grid6Style}>
        <MetricCard label="Mission Count" value={String(workspace.missionCount)} detail="Tracked missions" />
        <MetricCard label="Workspace Count" value={String(workspace.workspaceCount)} detail="Connected layers" />
        <MetricCard label="Knowledge Assets" value={String(workspace.assetCount)} detail="Governed assets" />
        <MetricCard label="Framework Count" value={String(workspace.frameworkCount)} detail="Reusable frameworks" />
        <MetricCard label="Question Count" value={String(workspace.questionCount)} detail="Research questions" />
        <MetricCard label="Discovery Count" value={String(workspace.discoveryCount)} detail="Discoveries" />
      </section>

      <section style={grid6Style}>
        <MetricCard label="Teaching Count" value={String(workspace.teachingCount)} detail="Teaching assets" />
        <MetricCard label="Course Count" value={String(workspace.courseCount)} detail="Course structures" />
        <MetricCard label="Presentation Count" value={String(workspace.presentationCount)} detail="Presentation assets" />
        <MetricCard label="Decision Count" value={String(workspace.decisionCount)} detail="Executive decisions" />
        <MetricCard label="Prompt Count" value={String(workspace.promptCount)} detail="Prompt assets" />
        <MetricCard label="Cross Reference Count" value={String(workspace.crossReferenceCount)} detail="Linked references" />
      </section>

      <section style={grid3Style}>
        <MetricCard label="Research Coverage" value={`${workspace.researchCoverage}%`} detail="Research layer" />
        <MetricCard label="Creator Coverage" value={`${workspace.creatorCoverage}%`} detail="Creator layer" />
        <MetricCard label="Ministry Coverage" value={`${workspace.ministryCoverage}%`} detail="Ministry layer" />
        <MetricCard label="Executive Coverage" value={`${workspace.executiveCoverage}%`} detail="Executive layer" />
        <MetricCard label="Agency Coverage" value={`${workspace.agencyCoverage}%`} detail="Agency layer" />
        <MetricCard label="Knowledge Coverage" value={`${workspace.knowledgeCoverage}%`} detail="Knowledge layer" />
      </section>

      <section style={grid3Style}>
        <MetricCard label="Overall Score" value={`${workspace.overallScore}%`} detail="Coverage composite" />
        <MetricCard label="Knowledge Health" value={`${workspace.knowledgeHealthScore}%`} detail="Knowledge health" />
        <MetricCard label="Intelligence Score" value={`${workspace.intelligenceScore}%`} detail="Layer intelligence" />
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
                <div style={{ textAlign: "right" }}>
                  <Badge value={signal.status} />
                  <p style={mutedStyle}>{signal.score}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Signal Preview</h2>
          <List items={workspace.signalPreview} />
          <h3 style={subTitleStyle}>Daily Questions</h3>
          <List items={workspace.dailyQuestions} />
        </article>
      </section>

      <section style={grid2Style}>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Cross Workspace Summary</h2>
          <List items={workspace.crossWorkspaceSummary} />
          <h3 style={subTitleStyle}>Recommendations</h3>
          <List items={workspace.recommendations} />
        </article>

        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Insights and Patterns</h2>
          <List items={workspace.insights} />
          <h3 style={subTitleStyle}>Patterns</h3>
          <List items={workspace.patterns} />
        </article>
      </section>

      <section style={grid2Style}>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Workspace Status</h2>
          <div style={stackStyle}>
            {workspace.workspaceStatus.map((item) => (
              <div key={item.workspace} style={rowStyle}>
                <span style={rowLabelStyle}>{item.workspace}</span>
                <span style={mutedStyle}>{item.progress}%</span>
                <Badge value={item.status} />
              </div>
            ))}
          </div>
        </article>

        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Weekly Review and Timeline</h2>
          <List items={workspace.weeklyReview} />
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
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
          <h2 style={cardTitleStyle}>Relationship View</h2>
          <p style={mutedStyle}>{workspace.relationshipView.join(" -> ")}</p>
          <h3 style={subTitleStyle}>Mission Navigator</h3>
          <List items={workspace.missionNavigator} />
        </article>

        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Knowledge Graph Preview</h2>
          <p style={mutedStyle}>Nodes: {workspace.knowledgeGraphPreview.nodes.length}</p>
          <p style={mutedStyle}>Edges: {workspace.knowledgeGraphPreview.edges.length}</p>
          <div style={stackStyle}>
            {workspace.knowledgeGraphPreview.nodes.map((node) => (
              <div key={node.id} style={rowStyle}>
                <span style={rowLabelStyle}>{node.label}</span>
                <Badge value={node.type} />
              </div>
            ))}
          </div>
        </article>

        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Related Missions</h2>
          <div style={stackStyle}>
            {workspace.relatedMissions.map((mission) => (
              <div key={mission.id} style={rowStyle}>
                <span style={rowLabelStyle}>{mission.title}</span>
                <Badge value={mission.status} />
              </div>
            ))}
          </div>
        </article>
      </section>

      <section style={footerStyle}>
        <Link href={`/knowledge-intelligence/${workspace.id}`} style={linkStyle}>
          Open mission knowledge-intelligence view
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
const grid3Style: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 24 }
const grid2Style: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12, marginBottom: 24 }
const metricCardStyle: React.CSSProperties = { border: "1px solid var(--border)", background: "var(--card-background)", borderRadius: 8, padding: 16 }
const metricLabelStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)" }
const metricValueStyle: React.CSSProperties = { margin: "6px 0 0", fontSize: 20, fontWeight: 700 }
const listStyle: React.CSSProperties = { margin: "8px 0 0", paddingLeft: 18 }
const listItemStyle: React.CSSProperties = { marginBottom: 8 }
const stackStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8 }
const rowStyle: React.CSSProperties = { borderTop: "1px solid var(--border)", paddingTop: 8, display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, alignItems: "start" }
const rowLabelStyle: React.CSSProperties = { fontWeight: 600 }
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
