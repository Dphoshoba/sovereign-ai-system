import Link from "next/link"
import { getRecommendationRegistry } from "../../lib/gamma/recommendation-reader"

export const dynamic = "force-dynamic"

export default async function RecommendationsPage() {
  const registry = await getRecommendationRegistry()

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Recommendations</p>
        <h1 style={titleStyle}>Deterministic Recommendation Layer</h1>
        <p style={mutedStyle}>Read-only recommendations without AI calls, execution, or persistence.</p>
      </section>

      <section style={metricsStyle}>
        <Metric label="Mission Count" value={String(registry.missionCount)} />
        <Metric label="Recommendation Count" value={String(registry.recommendationCount)} />
        <Metric label="Coverage" value={`${registry.coveragePercent}%`} />
        <Metric label="Readiness Score" value={String(registry.readinessScore)} />
        <Metric label="Health Score" value={String(registry.healthScore)} />
      </section>

      <section style={gridStyle}>
        {registry.missions.map((mission) => (
          <article key={mission.mission} style={cardStyle}>
            <p style={eyebrowStyle}>Mission</p>
            <h2 style={sectionTitleStyle}>{mission.missionTitle}</h2>
            <p style={mutedStyle}>Coverage: {mission.coveragePercent}%</p>
            <p style={mutedStyle}>Readiness: {mission.readinessScore}</p>
            <p style={mutedStyle}>Health: {mission.healthScore}</p>
            <p style={mutedStyle}>Recommendations: {mission.recommendationCount}</p>
            <Link href={`/recommendations/${mission.mission}`} style={linkStyle}>
              Open mission recommendations
            </Link>
          </article>
        ))}
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

const pageStyle: React.CSSProperties = { maxWidth: 1200, margin: "0 auto", padding: 32, color: "var(--foreground)" }
const cardStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 10, padding: 16, background: "var(--card-background)", marginBottom: 14 }
const eyebrowStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.8 }
const titleStyle: React.CSSProperties = { margin: "6px 0", fontSize: 32 }
const sectionTitleStyle: React.CSSProperties = { margin: "6px 0", fontSize: 20 }
const mutedStyle: React.CSSProperties = { margin: "6px 0", color: "var(--muted)" }
const metricsStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 14 }
const metricStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 8, padding: 12, background: "var(--background)" }
const metricLabelStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)" }
const metricValueStyle: React.CSSProperties = { margin: "6px 0 0", fontWeight: 700, fontSize: 20 }
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }
