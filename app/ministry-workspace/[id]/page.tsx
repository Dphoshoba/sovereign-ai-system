import Link from "next/link"
import { getMinistryWorkspace } from "../../../lib/gamma/ministry-reader"

export default async function MinistryWorkspaceMissionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getMinistryWorkspace(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <h1 style={titleStyle}>Ministry Workspace Not Found</h1>
          <p style={bodyTextStyle}>The requested ministry workspace "{id}" does not exist.</p>
        </section>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>Ministry Workspace</p>
          <h1 style={titleStyle}>{workspace.name}</h1>
          <p style={subtitleStyle}>{workspace.relatedResearchMission}</p>
        </div>
        <div style={statusClusterStyle}>
          <StatusPill label="Status" value={workspace.status} />
          <StatusPill label="Progress" value={`${workspace.progress}%`} />
          <StatusPill label="Confidence" value={workspace.confidence} />
        </div>
      </section>

      <section style={summaryGridStyle}>
        <MetricCard label="Teaching Count" value={String(workspace.teachingCount)} detail="Sermons + studies + courses" />
        <MetricCard label="Scripture Count" value={String(workspace.scriptureCount)} detail="Scripture collections" />
        <MetricCard label="Lesson Count" value={String(workspace.lessonCount)} detail="Small-group lessons" />
        <MetricCard label="Suggested Next Teaching" value={workspace.suggestedNextTeaching} detail="Recommended next step" />
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Ministry Outputs</h2>
        <div style={gridStyle}>
          <ResourceCard title="Sermon Series" items={workspace.sermonSeries} />
          <ResourceCard title="Bible Studies" items={workspace.bibleStudies} />
          <ResourceCard title="Teaching Courses" items={workspace.teachingCourses} />
          <ResourceCard title="Small Group Resources" items={workspace.smallGroupResources} />
          <ResourceCard title="Scripture Collections" items={workspace.scriptureCollections} />
          <ResourceCard title="Prayer Themes" items={workspace.prayerThemes} />
          <ResourceCard title="Pastoral Applications" items={workspace.pastoralApplications} />
          <ResourceCard title="Illustrations" items={workspace.illustrations} />
          <ResourceCard title="Kingdom Principles" items={workspace.kingdomPrinciples} />
        </div>
      </section>

      <section style={twoColumnStyle}>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Themes</h2>
          <List items={workspace.themes} />
        </article>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Insights</h2>
          <List items={workspace.insights.slice(0, 10)} />
        </article>
      </section>

      <section style={twoColumnStyle}>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Cross References</h2>
          <List items={workspace.crossReferences.slice(0, 12)} />
        </article>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Timeline</h2>
          <div style={timelineStyle}>
            {workspace.timeline.map((entry) => (
              <div key={`${entry.date}-${entry.event}`} style={timelineRowStyle}>
                <span style={timelineDateStyle}>{entry.date}</span>
                <span style={timelineEventStyle}>{entry.event}</span>
                <StatusBadge status={entry.status} />
              </div>
            ))}
          </div>
        </article>
      </section>

      <section style={footerStyle}>
        <Link href="/ministry-workspace" style={linkStyle}>
          Back to Ministry Workspace
        </Link>
      </section>
    </main>
  )
}

function ResourceCard({ title, items }: { title: string; items: string[] }) {
  return (
    <article style={cardStyle}>
      <h3 style={cardTitleStyle}>{title}</h3>
      <List items={items.slice(0, 8)} />
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

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div style={pillStyle}>
      <span style={pillLabelStyle}>{label}</span>
      <span style={pillValueStyle}>{value}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  return <span style={badgeStyle}>{status}</span>
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <article style={metricCardStyle}>
      <p style={metricLabelStyle}>{label}</p>
      <p style={metricValueStyle}>{value}</p>
      <p style={detailTextStyle}>{detail}</p>
    </article>
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
const subtitleStyle: React.CSSProperties = { margin: 0, maxWidth: 760, color: "var(--muted)", lineHeight: 1.6 }
const statusClusterStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }
const summaryGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 24 }
const sectionStyle: React.CSSProperties = { marginBottom: 24 }
const sectionTitleStyle: React.CSSProperties = { margin: "0 0 12px", fontSize: 20 }
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }
const twoColumnStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12, marginBottom: 24 }
const cardStyle: React.CSSProperties = { border: "1px solid var(--border)", background: "var(--card-background)", borderRadius: 8, padding: 16 }
const cardTitleStyle: React.CSSProperties = { margin: 0, fontSize: 16 }
const bodyTextStyle: React.CSSProperties = { margin: "6px 0 0", color: "var(--muted)", lineHeight: 1.55 }
const metricCardStyle: React.CSSProperties = { border: "1px solid var(--border)", background: "var(--card-background)", borderRadius: 8, padding: 16 }
const metricLabelStyle: React.CSSProperties = { margin: 0, color: "var(--muted)", fontSize: 12 }
const metricValueStyle: React.CSSProperties = { margin: "6px 0 0", fontSize: 18, fontWeight: 700 }
const detailTextStyle: React.CSSProperties = { margin: "8px 0 0", fontSize: 12, color: "var(--muted)" }
const listStyle: React.CSSProperties = { margin: "8px 0 0", paddingLeft: 18 }
const listItemStyle: React.CSSProperties = { marginBottom: 8, color: "var(--foreground)" }
const timelineStyle: React.CSSProperties = { marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }
const timelineRowStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "110px 1fr auto", gap: 12, alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 8 }
const timelineDateStyle: React.CSSProperties = { fontSize: 12, color: "var(--muted)" }
const timelineEventStyle: React.CSSProperties = { fontSize: 14 }
const footerStyle: React.CSSProperties = { marginTop: 24 }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }
const pillStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 999, padding: "6px 10px", display: "flex", gap: 8, alignItems: "center", background: "var(--card-background)" }
const pillLabelStyle: React.CSSProperties = { fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5 }
const pillValueStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600 }
const badgeStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 999, padding: "4px 8px", fontSize: 11, color: "#16a34a" }
