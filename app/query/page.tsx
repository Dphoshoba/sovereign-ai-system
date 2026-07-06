import Link from "next/link"
import { getQueryRegistry } from "../../lib/gamma/query-reader"

export default async function QueryPage() {
  const registry = await getQueryRegistry()

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Knowledge Query Engine</p>
        <h1 style={titleStyle}>Reason Over Knowledge - Query Layer</h1>
        <p style={mutedStyle}>Read-only deterministic query engine for mission evidence and priorities.</p>
      </section>

      <section style={metricsGridStyle}>
        <Metric label="Mission Count" value={String(registry.missionCount)} />
        <Metric label="Query Count" value={String(registry.queryCount)} />
        <Metric label="Answer Count" value={String(registry.answerCount)} />
        <Metric label="Gap Count" value={String(registry.gapCount)} />
        <Metric label="Coverage Score" value={`${registry.coverageScore}%`} />
        <Metric label="Priority Score" value={String(registry.missionPriorityScore)} />
        <Metric label="Health Score" value={String(registry.healthScore)} />
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Mission Priority</h2>
        <p style={mutedStyle}>Highest maturity mission: {registry.highestMaturityMission}</p>
      </section>

      <section style={gridStyle}>
        {registry.missions.map((mission) => (
          <article key={mission.mission} style={cardStyle}>
            <p style={eyebrowStyle}>Mission</p>
            <h2 style={sectionTitleStyle}>Womanhood</h2>
            <p style={mutedStyle}>{mission.missionTitle}</p>
            <p style={mutedStyle}>Coverage: {mission.coverageScore}%</p>
            <p style={mutedStyle}>Priority Score: {mission.missionPriorityScore}</p>
            <p style={mutedStyle}>Knowledge Completeness: {mission.knowledgeCompleteness}</p>
            <Link href={`/query/${mission.mission}`} style={linkStyle}>
              Open mission query view
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
const titleStyle: React.CSSProperties = { margin: "6px 0", fontSize: 32 }
const sectionTitleStyle: React.CSSProperties = { margin: 0, fontSize: 20 }
const eyebrowStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.8 }
const mutedStyle: React.CSSProperties = { margin: "5px 0", color: "var(--muted)" }
const metricsGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginBottom: 14 }
const metricCardStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 8, padding: 12, background: "var(--background)" }
const metricLabelStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)" }
const metricValueStyle: React.CSSProperties = { margin: "6px 0 0", fontWeight: 700, fontSize: 20 }
const gridStyle: React.CSSProperties = { display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }
