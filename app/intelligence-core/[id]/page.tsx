import Link from "next/link"
import { getMissionIntelligenceCore } from "../../../lib/gamma/intelligence-core-reader"

export const dynamic = "force-dynamic"

export default async function IntelligenceCoreMissionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getMissionIntelligenceCore(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <article style={cardStyle}>
          <h1 style={titleStyle}>Intelligence Core Not Found</h1>
          <p style={mutedStyle}>No intelligence core workspace exists for mission {id}.</p>
          <Link href="/intelligence-core" style={linkStyle}>Back to Core</Link>
        </article>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Intelligence Core</p>
        <h1 style={titleStyle}>Research Mission 001</h1>
        <p style={mutedStyle}>{workspace.missionTitle}</p>
      </section>

      <section style={metricsStyle}>
        <Metric label="Intelligence Score" value={String(workspace.intelligenceScore)} />
        <Metric label="Adaptability Score" value={String(workspace.adaptabilityScore)} />
        <Metric label="Learning Velocity" value={String(workspace.learningVelocity)} />
        <Metric label="Innovation Capacity" value={String(workspace.innovationCapacity)} />
        <Metric label="Impact Potential" value={String(workspace.impactPotential)} />
        <Metric label="Market Readiness" value={String(workspace.marketReadiness)} />
      </section>

      <section style={metricsStyle}>
        <Metric label="Ecosystem Strength" value={String(workspace.ecosystemStrength)} />
        <Metric label="Knowledge Capital" value={String(workspace.knowledgeCapital)} />
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
        <Link href="/intelligence-core" style={linkStyle}>Back to Core</Link>
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
