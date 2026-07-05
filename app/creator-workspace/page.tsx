import Link from "next/link"
import { getCreatorWorkspace } from "../../lib/gamma/creator-output-reader"

export default async function CreatorWorkspacePage() {
  const workspace = await getCreatorWorkspace("womanhood")

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <h1 style={titleStyle}>Creator Workspace Not Found</h1>
          <p style={bodyTextStyle}>The requested creator workspace does not exist.</p>
        </section>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>EV-KOS</p>
          <h1 style={titleStyle}>Creator Workspace</h1>
          <p style={subtitleStyle}>
            Transform research mission content into creator outputs. Read-only preview mode only.
          </p>
        </div>
        <div style={statusClusterStyle}>
          <StatusPill label="Mode" value="Read-Only" />
          <StatusPill label="Preview" value="Enabled" />
          <StatusPill label="Publishing" value="Disabled" />
        </div>
      </section>

      <section style={summaryGridStyle}>
        <MetricCard label="Progress" value={`${workspace.progress}%`} detail="Output readiness" />
        <MetricCard label="Confidence" value={workspace.confidence} detail="Preview certainty" />
        <MetricCard label="Related Mission" value={workspace.relatedMissionName} detail={workspace.relatedMissionId} />
        <MetricCard label="Next Suggested Output" value={labelForOutput(workspace.nextSuggestedOutput)} detail="Recommended next move" />
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Creator Projects</h2>
        <div style={gridStyle}>
          {workspace.creatorProjects.map((project) => (
            <article key={project.id} style={cardStyle}>
              <div style={cardHeaderStyle}>
                <h3 style={cardTitleStyle}>{project.title}</h3>
                <StatusBadge status={project.status} />
              </div>
              <p style={bodyTextStyle}>{project.summary}</p>
              <p style={detailTextStyle}>{project.itemCount} content blocks</p>
            </article>
          ))}
        </div>
      </section>

      <section style={twoColumnStyle}>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Book Outlines</h2>
          <List items={workspace.bookOutlines} />
        </article>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Course Outlines</h2>
          <List items={workspace.courseOutlines} />
        </article>
      </section>

      <section style={twoColumnStyle}>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>YouTube Series</h2>
          <List items={workspace.youtubeSeries} />
        </article>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Article Ideas</h2>
          <List items={workspace.articleIdeas} />
        </article>
      </section>

      <section style={cardStyle}>
        <h2 style={cardTitleStyle}>Content Status</h2>
        <p style={bodyTextStyle}>{workspace.contentStatus}</p>
        <dl style={metaListStyle}>
          <Row label="Read Only" value="Yes" />
          <Row label="Preview Only" value="Yes" />
          <Row label="No Publishing" value="Yes" />
          <Row label="No OpenAI" value="Yes" />
        </dl>
      </section>

      <section style={footerStyle}>
        <Link href={`/creator-workspace/${workspace.relatedMissionId}`} style={linkStyle}>
          Open {workspace.relatedMissionName}
        </Link>
      </section>
    </main>
  )
}

function labelForOutput(value: string) {
  switch (value) {
    case "book-outline":
      return "Book Outline"
    case "course-outline":
      return "Course Outline"
    case "youtube-series":
      return "YouTube Series"
    case "article-ideas":
      return "Article Ideas"
    default:
      return value
  }
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={rowStyle}>
      <dt style={labelStyle}>{label}</dt>
      <dd style={valueStyle}>{value}</dd>
    </div>
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
const summaryGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }
const sectionStyle: React.CSSProperties = { marginBottom: 24 }
const sectionTitleStyle: React.CSSProperties = { margin: "0 0 12px", fontSize: 20 }
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }
const twoColumnStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12, marginBottom: 24 }
const cardStyle: React.CSSProperties = { border: "1px solid var(--border)", background: "var(--card-background)", borderRadius: 8, padding: 16 }
const cardHeaderStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 8 }
const cardTitleStyle: React.CSSProperties = { margin: 0, fontSize: 16 }
const bodyTextStyle: React.CSSProperties = { margin: "6px 0 0", color: "var(--muted)", lineHeight: 1.55 }
const detailTextStyle: React.CSSProperties = { margin: "8px 0 0", fontSize: 12, color: "var(--muted)" }
const metricCardStyle: React.CSSProperties = { border: "1px solid var(--border)", background: "var(--card-background)", borderRadius: 8, padding: 16 }
const metricLabelStyle: React.CSSProperties = { margin: 0, color: "var(--muted)", fontSize: 12 }
const metricValueStyle: React.CSSProperties = { margin: "6px 0 0", fontSize: 18, fontWeight: 700 }
const listStyle: React.CSSProperties = { margin: "8px 0 0", paddingLeft: 18 }
const listItemStyle: React.CSSProperties = { marginBottom: 8, color: "var(--foreground)" }
const metaListStyle: React.CSSProperties = { margin: "12px 0 0" }
const rowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 8 }
const labelStyle: React.CSSProperties = { margin: 0, color: "var(--muted)", fontSize: 12 }
const valueStyle: React.CSSProperties = { margin: 0, fontWeight: 600 }
const footerStyle: React.CSSProperties = { marginTop: 24 }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }
const pillStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 999, padding: "6px 10px", display: "flex", gap: 8, alignItems: "center", background: "var(--card-background)" }
const pillLabelStyle: React.CSSProperties = { fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5 }
const pillValueStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600 }
const badgeStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 999, padding: "4px 8px", fontSize: 11, color: "#16a34a" }