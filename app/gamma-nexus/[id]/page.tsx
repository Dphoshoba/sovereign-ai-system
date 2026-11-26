import Link from "next/link"
import { getMissionGammaNexus } from "../../../lib/gamma/gamma-nexus-reader"

export const dynamic = "force-dynamic"

export default async function GammaNexusMissionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getMissionGammaNexus(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <article style={cardStyle}>
          <h1 style={titleStyle}>Gamma Nexus Not Found</h1>
          <p style={mutedStyle}>No Gamma Nexus workspace exists for mission {id}.</p>
          <Link href="/gamma-nexus" style={linkStyle}>Back to Gamma Nexus</Link>
        </article>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Gamma Nexus</p>
        <h1 style={titleStyle}>{workspace.missionTitle}</h1>
        <p style={mutedStyle}>Autonomous enterprise unified command center</p>
      </section>

      <section style={metricsStyle}>
        <Metric label="Enterprise Score" value={String(workspace.enterpriseScore)} />
        <Metric label="Execution Readiness" value={String(workspace.executionReadiness)} />
        <Metric label="Knowledge Capital" value={String(workspace.knowledgeCapital)} />
        <Metric label="Growth Potential" value={String(workspace.growthPotential)} />
        <Metric label="Monetization Potential" value={String(workspace.monetizationPotential)} />
        <Metric label="Ecosystem Strength" value={String(workspace.ecosystemStrength)} />
      </section>

      <section style={metricsStyle}>
        <Metric label="Forecast Confidence" value={String(workspace.forecastConfidence)} />
        <Metric label="Autonomy Score" value={String(workspace.autonomyScore)} />
        <Metric label="Health Score" value={String(workspace.healthScore)} />
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>System Elements</h2>
        <ul style={listStyle}>
          {workspace.elements.map((e) => (
            <li key={e.elementId} style={listItemStyle}>
              {e.elementName}: {e.status} ({e.score})
            </li>
          ))}
        </ul>
      </section>

      <section style={cardStyle}>
        <Link href="/gamma-nexus" style={linkStyle}>Back to Gamma Nexus</Link>
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
const listStyle: React.CSSProperties = { margin: "12px 0", padding: "0 0 0 18px" }
const listItemStyle: React.CSSProperties = { margin: "6px 0", color: "var(--muted)" }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }
