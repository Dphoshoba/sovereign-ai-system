import Link from "next/link"
import { getExecutiveWorkspace } from "../../lib/gamma/executive-reader"

export const dynamic = "force-dynamic"

export default async function ExecutiveWorkspacePage() {
  const workspace = await getExecutiveWorkspace("womanhood")

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <h1 style={titleStyle}>Executive Workspace Not Found</h1>
          <p style={mutedTextStyle}>The requested executive workspace does not exist.</p>
        </section>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>EV-KOS</p>
          <h1 style={titleStyle}>Executive Workspace</h1>
          <p style={subtitleStyle}>{workspace.executiveOverview}</p>
        </div>
        <div style={pillColumnStyle}>
          <Pill label="Status" value={workspace.status} />
          <Pill label="Mode" value="Read-Only" />
          <Pill label="Preview" value="Enabled" />
        </div>
      </section>

      <section style={grid4Style}>
        <MetricCard label="Readiness Score" value={String(workspace.readinessScore)} detail="Platform readiness" />
        <MetricCard label="Active Missions" value={String(workspace.activeMissionCount)} detail="Cross-workspace missions" />
        <MetricCard label="Priority Items" value={String(workspace.priorityCount)} detail="Executive priorities" />
        <MetricCard label="Decision Queue" value={String(workspace.decisionCount)} detail="Pending decisions" />
      </section>

      <section style={grid3Style}>
        <MetricCard label="Research Progress" value={`${workspace.researchProgress}%`} detail="Research workspace" />
        <MetricCard label="Creator Output Progress" value={`${workspace.creatorOutputProgress}%`} detail="Creator workspace" />
        <MetricCard label="Ministry Output Progress" value={`${workspace.ministryOutputProgress}%`} detail="Ministry workspace" />
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Active Missions</h2>
        <div style={grid2Style}>
          {workspace.activeMissions.map((mission) => (
            <article key={mission.id} style={cardStyle}>
              <div style={cardHeaderStyle}>
                <h3 style={cardTitleStyle}>{mission.title}</h3>
                <Badge value={mission.status} />
              </div>
              <p style={mutedTextStyle}>Confidence: {mission.confidence}</p>
              <ul style={listStyle}>
                <li style={listItemStyle}>Research: {mission.researchProgress}%</li>
                <li style={listItemStyle}>Creator: {mission.creatorProgress}%</li>
                <li style={listItemStyle}>Ministry: {mission.ministryProgress}%</li>
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section style={grid2Style}>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Priority List</h2>
          <List items={workspace.priorityList} />
        </article>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Next Recommended Actions</h2>
          <List items={workspace.nextRecommendedActions} />
        </article>
      </section>

      <section style={grid2Style}>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Decision Queue</h2>
          <div style={stackStyle}>
            {workspace.decisionQueue.map((item) => (
              <div key={item.id} style={rowCardStyle}>
                <div style={rowHeaderStyle}>
                  <strong>{item.title}</strong>
                  <Badge value={`${item.priority} â€¢ ${item.status}`} />
                </div>
                <p style={mutedTextStyle}>{item.reason}</p>
              </div>
            ))}
          </div>
        </article>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Risk Notes</h2>
          <div style={stackStyle}>
            {workspace.riskNotes.map((item) => (
              <div key={item.id} style={rowCardStyle}>
                <div style={rowHeaderStyle}>
                  <strong>{item.note}</strong>
                  <Badge value={item.severity} />
                </div>
                <p style={mutedTextStyle}>{item.mitigation}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section style={grid2Style}>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Blocked Capabilities</h2>
          <List items={workspace.blockedCapabilities} />
        </article>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Related Workspaces</h2>
          <div style={stackStyle}>
            {workspace.relatedWorkspaces.map((item) => (
              <div key={item.route} style={rowCardStyle}>
                <div style={rowHeaderStyle}>
                  <strong>{item.name}</strong>
                  <Badge value={item.status} />
                </div>
                <Link href={item.route} style={linkStyle}>
                  {item.route}
                </Link>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section style={cardStyle}>
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
      </section>

      <section style={footerStyle}>
        <Link href={`/executive-workspace/${workspace.id}`} style={linkStyle}>
          Open mission executive view
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
      <p style={mutedTextStyle}>{detail}</p>
    </article>
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
const subtitleStyle: React.CSSProperties = { margin: 0, maxWidth: 760, lineHeight: 1.6, color: "var(--muted)" }
const sectionStyle: React.CSSProperties = { marginBottom: 24 }
const sectionTitleStyle: React.CSSProperties = { margin: "0 0 12px", fontSize: 20 }
const grid4Style: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }
const grid3Style: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 24 }
const grid2Style: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12, marginBottom: 24 }
const cardStyle: React.CSSProperties = { border: "1px solid var(--border)", background: "var(--card-background)", borderRadius: 8, padding: 16 }
const cardHeaderStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8, alignItems: "flex-start" }
const cardTitleStyle: React.CSSProperties = { margin: 0, fontSize: 16 }
const metricCardStyle: React.CSSProperties = { border: "1px solid var(--border)", background: "var(--card-background)", borderRadius: 8, padding: 16 }
const metricLabelStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)" }
const metricValueStyle: React.CSSProperties = { margin: "6px 0 0", fontSize: 20, fontWeight: 700 }
const mutedTextStyle: React.CSSProperties = { margin: "6px 0 0", color: "var(--muted)", lineHeight: 1.5 }
const stackStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8 }
const rowCardStyle: React.CSSProperties = { borderTop: "1px solid var(--border)", paddingTop: 8 }
const rowHeaderStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }
const listStyle: React.CSSProperties = { margin: "8px 0 0", paddingLeft: 18 }
const listItemStyle: React.CSSProperties = { marginBottom: 8 }
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

