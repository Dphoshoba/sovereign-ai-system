import Link from "next/link"
import { getMissionPlanner } from "../../../lib/gamma/planner-reader"

export default async function MissionPlannerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getMissionPlanner(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <article style={cardStyle}>
          <h1 style={titleStyle}>Planner Not Found</h1>
          <p style={mutedStyle}>No planner workspace exists for mission {id}.</p>
          <Link href="/planner" style={linkStyle}>
            Back to Planner
          </Link>
        </article>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Mission Planner</p>
        <h1 style={titleStyle}>Research Mission 001</h1>
        <p style={mutedStyle}>{workspace.missionTitle}</p>
        <p style={mutedStyle}>Roadmap and sequence for maximum mission impact.</p>
      </section>

      <section style={metricsGridStyle}>
        <Metric label="Task Count" value={String(workspace.taskCount)} />
        <Metric label="Today" value={String(workspace.todayCount)} />
        <Metric label="Week" value={String(workspace.weekCount)} />
        <Metric label="Month" value={String(workspace.monthCount)} />
        <Metric label="Dependencies" value={String(workspace.dependencyCount)} />
        <Metric label="Blockers" value={String(workspace.blockerCount)} />
        <Metric label="Execution Readiness" value={String(workspace.executionReadiness)} />
        <Metric label="Momentum" value={String(workspace.momentum)} />
        <Metric label="Roadmap Score" value={String(workspace.roadmapScore)} />
        <Metric label="Delivery Score" value={String(workspace.deliveryScore)} />
        <Metric label="Priority Score" value={String(workspace.priorityScore)} />
        <Metric label="Health" value={String(workspace.healthScore)} />
        <Metric label="Recommendations" value={String(workspace.recommendationCount)} />
      </section>

      <section style={threeColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Today</h2>
          <TaskList items={workspace.today} />
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>This Week</h2>
          <TaskList items={workspace.week} />
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>This Month</h2>
          <TaskList items={workspace.month} />
        </article>
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Dependencies</h2>
          <TaskList items={workspace.dependencies} showDependencies />
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Blockers</h2>
          <TaskList items={workspace.blockers} showDependencies />
        </article>
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Roadmap</h2>
          <div style={stackStyle}>
            {workspace.roadmap.map((item) => (
              <div key={`${item.date}-${item.event}`} style={timelineRowStyle}>
                <span style={mutedStyle}>{item.date}</span>
                <span>{item.event}</span>
                <span style={mutedStyle}>{item.status}</span>
              </div>
            ))}
          </div>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Priority Queue</h2>
          <TaskList items={workspace.priorityQueue} showDependencies />
        </article>
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Execution Plan</h2>
          <ul style={listStyle}>
            {workspace.executionPlan.map((item) => (
              <li key={item} style={listItemStyle}>
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Mission Schedule</h2>
          <ul style={listStyle}>
            {workspace.missionSchedule.map((item) => (
              <li key={item} style={listItemStyle}>
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Recommendations</h2>
        <ul style={listStyle}>
          {workspace.recommendations.map((item) => (
            <li key={item} style={listItemStyle}>
              {item}
            </li>
          ))}
        </ul>
        <Link href="/planner" style={linkStyle}>
          Back to Planner
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

function TaskList({ items, showDependencies }: { items: Array<{ id: string; title: string; priority: string; workspace: string; dependencies: string[] }>; showDependencies?: boolean }) {
  return (
    <div style={stackStyle}>
      {items.map((item) => (
        <div key={item.id} style={rowStyle}>
          <strong>{item.title}</strong>
          <span style={mutedStyle}>{item.workspace}</span>
          <span style={mutedStyle}>Priority: {item.priority}</span>
          {showDependencies && item.dependencies.length > 0 ? (
            <span style={mutedStyle}>Depends on: {item.dependencies.join(", ")}</span>
          ) : null}
        </div>
      ))}
    </div>
  )
}

const pageStyle: React.CSSProperties = { maxWidth: 1450, margin: "0 auto", padding: 32, color: "var(--foreground)" }
const cardStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 10, padding: 16, background: "var(--card-background)", marginBottom: 14 }
const titleStyle: React.CSSProperties = { margin: "6px 0", fontSize: 32 }
const sectionTitleStyle: React.CSSProperties = { margin: 0, fontSize: 18 }
const eyebrowStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.8 }
const mutedStyle: React.CSSProperties = { margin: "5px 0", color: "var(--muted)" }
const metricsGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginBottom: 14 }
const metricCardStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 8, padding: 12, background: "var(--background)" }
const metricLabelStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)" }
const metricValueStyle: React.CSSProperties = { margin: "6px 0 0", fontWeight: 700, fontSize: 20 }
const threeColStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 14 }
const twoColStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 12, marginBottom: 14 }
const stackStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }
const rowStyle: React.CSSProperties = { borderTop: "1px solid var(--border)", paddingTop: 8, display: "flex", flexDirection: "column", gap: 4 }
const timelineRowStyle: React.CSSProperties = { borderTop: "1px solid var(--border)", paddingTop: 8, display: "grid", gridTemplateColumns: "110px 1fr auto", gap: 10 }
const listStyle: React.CSSProperties = { margin: "8px 0 0", paddingLeft: 18 }
const listItemStyle: React.CSSProperties = { marginBottom: 8 }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }