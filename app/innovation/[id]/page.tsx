import Link from "next/link"
import { getMissionInnovation } from "../../../lib/gamma/innovation-reader"

export const dynamic = "force-dynamic"

export default async function InnovationMissionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getMissionInnovation(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <article style={cardStyle}>
          <h1 style={titleStyle}>Innovation Not Found</h1>
          <p style={mutedStyle}>No innovation workspace exists for mission {id}.</p>
          <Link href="/innovation" style={linkStyle}>Back to Innovation</Link>
        </article>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Innovation Engine</p>
        <h1 style={titleStyle}>Research Mission 001</h1>
        <p style={mutedStyle}>{workspace.missionTitle}</p>
      </section>

      <section style={metricsStyle}>
        <Metric label="Innovation Count" value={String(workspace.innovationCount)} />
        <Metric label="New Concepts" value={String(workspace.newConcepts)} />
        <Metric label="Prototype Count" value={String(workspace.prototypeCount)} />
        <Metric label="Idea Velocity" value={String(workspace.ideaVelocity)} />
        <Metric label="Innovation Score" value={String(workspace.innovationScore)} />
        <Metric label="Commercial Potential" value={String(workspace.commercialPotential)} />
      </section>

      <section style={metricsStyle}>
        <Metric label="Health Score" value={String(workspace.healthScore)} />
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Innovation Ideas</h2>
        <ul style={listStyle}>
          {workspace.ideas.map((i) => (
            <li key={i.ideaId} style={listItemStyle}>
              {i.ideaName}: Novelty {i.noveltyScore}, Feasibility {i.feasibilityScore}
            </li>
          ))}
        </ul>
      </section>

      <section style={cardStyle}>
        <Link href="/innovation" style={linkStyle}>Back to Innovation</Link>
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
