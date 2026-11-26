import Link from "next/link"
import { getIntellectualPropertyRegistry } from "../../lib/gamma/intellectual-property-reader"

export const dynamic = "force-dynamic"

export default async function IntellectualPropertyPage() {
  const registry = await getIntellectualPropertyRegistry()

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Gamma Intellectual Property</p>
        <h1 style={titleStyle}>Intellectual Property Engine</h1>
        <p style={mutedStyle}>Deterministic IP intelligence for innovation, protection, and licensing optimization.</p>
      </section>

      <section style={metricsStyle}>
        <Metric label="IP Score" value={String(registry.ipScore)} />
        <Metric label="Innovation Score" value={String(registry.innovationScore)} />
        <Metric label="Protection Score" value={String(registry.protectionScore)} />
        <Metric label="Licensing Potential" value={String(registry.licensingPotential)} />
        <Metric label="Patent Strength" value={String(registry.patentStrength)} />
        <Metric label="Trademark Value" value={String(registry.trademarkValue)} />
        <Metric label="Copyright Coverage" value={String(registry.copyrightCoverage)} />
      </section>

      <section style={gridStyle}>
        {registry.missions.map((mission) => (
          <article key={mission.mission} style={cardStyle}>
            <p style={eyebrowStyle}>Mission</p>
            <h2 style={sectionTitleStyle}>Mission {mission.mission}</h2>
            <p style={mutedStyle}>{mission.missionTitle}</p>
            <p style={mutedStyle}>IP Score: {mission.ipScore}</p>
            <p style={mutedStyle}>Innovation Score: {mission.innovationScore}</p>
            <Link href={`/intellectual-property/${mission.mission}`} style={linkStyle}>View IP</Link>
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
