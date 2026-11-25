import Link from "next/link"
import { getMissionEvolution } from "../../../lib/gamma/evolution-reader"

export const dynamic = "force-dynamic"

export default async function EvolutionMissionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getMissionEvolution(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <article style={cardStyle}>
          <h1 style={titleStyle}>Evolution Not Found</h1>
          <p style={mutedStyle}>No evolution workspace exists for mission {id}.</p>
          <Link href="/evolution" style={linkStyle}>Back to Evolution</Link>
        </article>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Evolution Engine</p>
        <h1 style={titleStyle}>Research Mission 001</h1>
        <p style={mutedStyle}>{workspace.missionTitle}</p>
      </section>

      <section style={metricsStyle}>
        <Metric label="Phase Count" value={String(workspace.phaseCount)} />
        <Metric label="Build Count" value={String(workspace.buildCount)} />
        <Metric label="Capability Score" value={String(workspace.capabilityScore)} />
        <Metric label="Autonomy Score" value={String(workspace.autonomyScore)} />
        <Metric label="Growth Velocity" value={String(workspace.growthVelocity)} />
        <Metric label="Evolution Score" value={String(workspace.evolutionScore)} />
      </section>

      <section style={metricsStyle}>
        <Metric label="Health Score" value={String(workspace.healthScore)} />
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Evolution Phases</h2>
        <ul style={listStyle}>
          {workspace.phases.map((p) => (
            <li key={p.phaseId} style={listItemStyle}>
              {p.phaseName}: Capability Gain {p.capabilityGain.toFixed(0)}, Autonomy Gain {p.autonomyGain.toFixed(0)}
            </li>
          ))}
        </ul>
      </section>

      <section style={cardStyle}>
        <Link href="/evolution" style={linkStyle}>Back to Evolution</Link>
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
