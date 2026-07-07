import Link from "next/link"
import { getMissionExecution } from "../../../lib/gamma/execution-reader"

export const dynamic = "force-dynamic"

export default async function ExecutionMissionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getMissionExecution(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <article style={cardStyle}>
          <h1 style={titleStyle}>Execution Not Found</h1>
          <p style={mutedStyle}>No execution workspace exists for mission {id}.</p>
          <Link href="/execution" style={linkStyle}>Back to Execution</Link>
        </article>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Execution Engine</p>
        <h1 style={titleStyle}>Research Mission 001</h1>
        <p style={mutedStyle}>{workspace.missionTitle}</p>
      </section>

      <section style={metricsStyle}>
        <Metric label="Task Count" value={String(workspace.taskCount)} />
        <Metric label="Active Projects" value={String(workspace.activeProjects)} />
        <Metric label="Execution Capacity" value={String(workspace.executionCapacity)} />
        <Metric label="Execution Velocity" value={String(workspace.executionVelocity)} />
        <Metric label="Bottlenecks" value={String(workspace.bottlenecks)} />
        <Metric label="Blocked Items" value={String(workspace.blockedItems)} />
        <Metric label="Focus Score" value={String(workspace.focusScore)} />
        <Metric label="Delivery Score" value={String(workspace.deliveryScore)} />
        <Metric label="Health Score" value={String(workspace.healthScore)} />
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Active Tasks</h2>
          <ul style={listStyle}>
            {workspace.execution.map((item) => (
              <li key={item.title} style={listItemStyle}>
                {item.title} ({item.status}) - {item.priority}: {item.progress}%
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
        <Link href="/execution" style={linkStyle}>Back to Execution</Link>
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
const listItemStyle: React.CSSProperties = { margin: "6px 0", color: "var(--muted)" }
const stackStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }
const rowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: 13 }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }
