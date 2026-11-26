import Link from "next/link"
import { getKingdomEnterpriseRegistry } from "../../lib/gamma/kingdom-enterprise-reader"

export const dynamic = "force-dynamic"

export default async function KingdomEnterprisePage() {
  const registry = await getKingdomEnterpriseRegistry()

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Gamma Kingdom Enterprise</p>
        <h1 style={titleStyle}>Kingdom Enterprise Engine</h1>
        <p style={mutedStyle}>Deterministic enterprise intelligence for scalable kingdom building and organizational excellence.</p>
      </section>

      <section style={metricsStyle}>
        <Metric label="Enterprise Score" value={String(registry.enterpriseScore)} />
        <Metric label="Scale Score" value={String(registry.scaleScore)} />
        <Metric label="Discipline Score" value={String(registry.disciplineScore)} />
        <Metric label="Leadership Score" value={String(registry.leadershipScore)} />
        <Metric label="Operational Score" value={String(registry.operationalScore)} />
        <Metric label="Financial Score" value={String(registry.financialScore)} />
        <Metric label="Cultural Score" value={String(registry.culturalScore)} />
      </section>

      <section style={gridStyle}>
        {registry.missions.map((mission) => (
          <article key={mission.mission} style={cardStyle}>
            <p style={eyebrowStyle}>Mission</p>
            <h2 style={sectionTitleStyle}>Mission {mission.mission}</h2>
            <p style={mutedStyle}>{mission.missionTitle}</p>
            <p style={mutedStyle}>Enterprise Score: {mission.enterpriseScore}</p>
            <p style={mutedStyle}>Scale Score: {mission.scaleScore}</p>
            <Link href={`/kingdom-enterprise/${mission.mission}`} style={linkStyle}>View enterprise</Link>
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
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }
