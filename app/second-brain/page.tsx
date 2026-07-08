import Link from "next/link"
import { getSecondBrainWorkspace } from "../../lib/gamma/second-brain-reader"

export const dynamic = "force-dynamic"

export default async function SecondBrainPage() {
  const workspace = await getSecondBrainWorkspace("womanhood")

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <h1 style={titleStyle}>Second Brain Hub Not Found</h1>
          <p style={mutedStyle}>The requested second brain dashboard does not exist.</p>
        </section>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>EV-KOS</p>
          <h1 style={titleStyle}>Second Brain Hub</h1>
          <p style={subtitleStyle}>Unified dashboard across Research, Creator, Ministry, Executive, Agency, Shared Knowledge and Mission Registry.</p>
        </div>
        <div style={pillColumnStyle}>
          <Pill label="Mission" value={workspace.currentMission} />
          <Pill label="Health" value={String(workspace.healthScore)} />
          <Pill label="Brain" value={String(workspace.brainScore)} />
        </div>
      </section>

      <section style={grid5Style}>
        <MetricCard label="Mission Count" value={String(workspace.missionCount)} detail="Tracked missions" />
        <MetricCard label="Workspace Count" value={String(workspace.workspaceCount)} detail="Connected workspaces" />
        <MetricCard label="Discovery Count" value={String(workspace.discoveryCount)} detail="Research + knowledge" />
        <MetricCard label="Asset Count" value={String(workspace.assetCount)} detail="Reusable assets" />
        <MetricCard label="Timeline Count" value={String(workspace.timelineCount)} detail="Lifecycle entries" />
      </section>

      <section style={grid5Style}>
        <MetricCard label="Priority Count" value={String(workspace.priorityCount)} detail="Executive priorities" />
        <MetricCard label="Action Count" value={String(workspace.actionCount)} detail="Suggested actions" />
        <MetricCard label="Health Score" value={String(workspace.healthScore)} detail="Knowledge health" />
        <MetricCard label="Brain Score" value={String(workspace.brainScore)} detail="Second brain score" />
        <MetricCard label="Cross Reference Count" value={String(workspace.crossReferenceCount)} detail="Linked references" />
      </section>

      <section style={grid3Style}>
        <MetricCard label="Research Progress" value={`${workspace.researchProgress}%`} detail="Current mission" />
        <MetricCard label="Creator Progress" value={`${workspace.creatorProgress}%`} detail="Output velocity" />
        <MetricCard label="Ministry Progress" value={`${workspace.ministryProgress}%`} detail="Teaching readiness" />
      </section>

      <section style={grid2Style}>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Today's Dashboard</h2>
          <List items={workspace.dailyReview} />
          <h3 style={subTitleStyle}>Daily Prompt</h3>
          <List items={workspace.dailyPrompts} />
        </article>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Weekly Review</h2>
          <List items={workspace.weeklyReview} />
          <h3 style={subTitleStyle}>Suggested Actions</h3>
          <List items={workspace.suggestedActions} />
        </article>
      </section>

      <section style={grid2Style}>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Cross Workspace Summary</h2>
          <List items={workspace.crossWorkspaceSummary} />
          <h3 style={subTitleStyle}>Executive Priorities</h3>
          <List items={workspace.executivePriorities} />
        </article>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Agency Pipeline and Knowledge Assets</h2>
          <p style={mutedStyle}>Pipeline Stage: {workspace.agencyPipeline}</p>
          <List items={workspace.knowledgeAssets} />
          <h3 style={subTitleStyle}>Recent Discoveries</h3>
          <List items={workspace.recentDiscoveries} />
        </article>
      </section>

      <section style={grid2Style}>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Workspace Status</h2>
          <div style={stackStyle}>
            {workspace.workspaceStatus.map((item) => (
              <div key={item.workspace} style={timelineRowStyle}>
                <span style={timelineDateStyle}>{item.workspace}</span>
                <span style={timelineEventStyle}>{item.progress}%</span>
                <Badge value={item.status} />
              </div>
            ))}
          </div>
          <h3 style={subTitleStyle}>Stalled Missions</h3>
          <List items={workspace.stalledMissions.length > 0 ? workspace.stalledMissions : ["None"]} />
        </article>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Timeline and Growth Indicators</h2>
          <div style={stackStyle}>
            {workspace.timeline.map((item) => (
              <div key={`${item.date}-${item.event}`} style={timelineRowStyle}>
                <span style={timelineDateStyle}>{item.date}</span>
                <span style={timelineEventStyle}>{item.event}</span>
                <Badge value={item.status} />
              </div>
            ))}
          </div>
          <h3 style={subTitleStyle}>Knowledge Growth</h3>
          <ul style={listStyle}>
            {workspace.growthIndicators.map((item) => (
              <li key={item.date} style={listItemStyle}>
                {item.date}: discoveries {item.discoveries}, assets {item.assets}, score {item.score}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section style={footerStyle}>
        <Link href={`/second-brain/${workspace.id}`} style={linkStyle}>
          Open mission second-brain view
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
const grid3Style: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 24 }
const grid2Style: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12, marginBottom: 24 }
const metricCardStyle: React.CSSProperties = { border: "1px solid var(--border)", background: "var(--card-background)", borderRadius: 8, padding: 16 }
const metricLabelStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)" }
const metricValueStyle: React.CSSProperties = { margin: "6px 0 0", fontSize: 20, fontWeight: 700 }
const listStyle: React.CSSProperties = { margin: "8px 0 0", paddingLeft: 18 }
const listItemStyle: React.CSSProperties = { marginBottom: 8 }
const stackStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8 }
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

