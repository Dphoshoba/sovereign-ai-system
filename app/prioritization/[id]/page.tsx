import Link from "next/link"
import { getMissionPrioritization } from "../../../lib/gamma/prioritization-reader"

export const dynamic = "force-dynamic"

export default async function PrioritizationMissionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getMissionPrioritization(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <article style={cardStyle}>
          <h1 style={titleStyle}>Prioritization Not Found</h1>
          <p style={mutedStyle}>No prioritization workspace exists for mission {id}.</p>
          <Link href="/prioritization" style={linkStyle}>Back to Prioritization</Link>
        </article>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Prioritization Engine</p>
        <h1 style={titleStyle}>Research Mission 001</h1>
        <p style={mutedStyle}>{workspace.missionTitle}</p>
      </section>

      <section style={metricsStyle}>
        <Metric label="Priority Count" value={String(workspace.priorityCount)} />
        <Metric label="Impact Score" value={String(workspace.impactScore)} />
        <Metric label="Effort Score" value={String(workspace.effortScore)} />
        <Metric label="ROI Score" value={String(workspace.roiScore)} />
        <Metric label="Urgency Score" value={String(workspace.urgencyScore)} />
        <Metric label="Alignment Score" value={String(workspace.alignmentScore)} />
        <Metric label="Focus Score" value={String(workspace.focusScore)} />
        <Metric label="Health Score" value={String(workspace.healthScore)} />
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Priority Queue</h2>
          <ul style={listStyle}>
            {workspace.priorities.map((item) => (
              <li key={item.title} style={listItemStyle}>
                <div style={{ fontWeight: 600 }}>{item.title}</div>
                <div style={detailStyle}>Impact: {item.impactScore} | Effort: {item.effortScore} | ROI: {item.roiScore}</div>
                <div style={detailStyle}>Urgency: {item.urgencyScore} | Alignment: {item.alignmentScore}</div>
              </li>
            ))}
          </ul>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Recommendations</h2>
          <ul style={listStyle}>
            {workspace.recommendations.map((item) => (
              <li key={item} style={listItemStyle}>{item}</li>
            ))}
          </ul>
          <h2 style={sectionTitleStyle}>Roadmap</h2>
          <div style={stackStyle}>
            {workspace.roadmap.map((item) => (
              <div key={`${item.date}-${item.event}`} style={rowStyle}>
                <span style={mutedStyle}>{item.date}</span>
                <span>{item.event}</span>
                <span style={mutedStyle}>{item.status}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section style={cardStyle}>
        <Link href="/prioritization" style={linkStyle}>Back to Prioritization</Link>
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

const pageStyle: React.CSSProperties = { maxWidth: 1320, margin: "0 auto", padding: 32, color: "var(--foreground)" }
const cardStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 10, padding: 16, background: "var(--card-background)", marginBottom: 14 }
const eyebrowStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.8 }
const titleStyle: React.CSSProperties = { margin: "6px 0", fontSize: 32 }
const sectionTitleStyle: React.CSSProperties = { margin: 0, fontSize: 20 }
const mutedStyle: React.CSSProperties = { margin: "6px 0", color: "var(--muted)" }
const metricsStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginBottom: 14 }
const metricStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 8, padding: 12, background: "var(--background)" }
const metricLabelStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)" }
const metricValueStyle: React.CSSProperties = { margin: "6px 0 0", fontWeight: 700, fontSize: 20 }
const twoColStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12, marginBottom: 14 }
const listStyle: React.CSSProperties = { margin: "12px 0", padding: "0 0 0 18px" }
const listItemStyle: React.CSSProperties = { margin: "12px 0", color: "var(--muted)", fontSize: 13 }
const detailStyle: React.CSSProperties = { fontSize: 12, margin: "4px 0 0 0", color: "var(--muted)" }
const stackStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }
const rowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: 13 }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }
