import Link from "next/link"
import { getPlannerRegistry } from "../../lib/gamma/planner-reader"

export const dynamic = "force-dynamic"

export default async function PlannerPage() {
  const registry = await getPlannerRegistry()

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Mission Planner</p>
        <h1 style={titleStyle}>Operate Knowledge - Mission Planner</h1>
        <p style={mutedStyle}>Deterministic plan sequencing for today, this week, and this month.</p>
      </section>

      <section style={metricsGridStyle}>
        <Metric label="Task Count" value={String(registry.taskCount)} />
        <Metric label="Today" value={String(registry.todayCount)} />
        <Metric label="Week" value={String(registry.weekCount)} />
        <Metric label="Month" value={String(registry.monthCount)} />
        <Metric label="Dependencies" value={String(registry.dependencyCount)} />
        <Metric label="Blockers" value={String(registry.blockerCount)} />
        <Metric label="Momentum" value={String(registry.momentum)} />
        <Metric label="Health" value={String(registry.healthScore)} />
      </section>

      <section style={gridStyle}>
        {registry.missions.map((mission) => (
          <article key={mission.mission} style={cardStyle}>
            <p style={eyebrowStyle}>Roadmap</p>
            <h2 style={sectionTitleStyle}>Research Mission 001</h2>
            <p style={mutedStyle}>{mission.missionTitle}</p>
            <p style={mutedStyle}>Today: {mission.todayCount}</p>
            <p style={mutedStyle}>Week: {mission.weekCount}</p>
            <p style={mutedStyle}>Month: {mission.monthCount}</p>
            <p style={mutedStyle}>Momentum: {mission.momentum}</p>
            <p style={mutedStyle}>Health: {mission.healthScore}</p>
            <Link href={`/planner/${mission.mission}`} style={linkStyle}>
              Open mission planner
            </Link>
          </article>
        ))}
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

const pageStyle: React.CSSProperties = { maxWidth: 1400, margin: "0 auto", padding: 32, color: "var(--foreground)" }
const cardStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 10, padding: 16, background: "var(--card-background)", marginBottom: 14 }
const eyebrowStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.8 }
const titleStyle: React.CSSProperties = { margin: "6px 0", fontSize: 32 }
const sectionTitleStyle: React.CSSProperties = { margin: 0, fontSize: 20 }
const mutedStyle: React.CSSProperties = { margin: "5px 0", color: "var(--muted)" }
const metricsGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginBottom: 14 }
const metricCardStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 8, padding: 12, background: "var(--background)" }
const metricLabelStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)" }
const metricValueStyle: React.CSSProperties = { margin: "6px 0 0", fontWeight: 700, fontSize: 20 }
const gridStyle: React.CSSProperties = { display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }