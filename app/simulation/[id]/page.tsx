import Link from "next/link"
import { getMissionSimulation } from "../../../lib/gamma/simulation-reader"

export const dynamic = "force-dynamic"

export default async function SimulationMissionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getMissionSimulation(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <article style={cardStyle}>
          <h1 style={titleStyle}>Simulation Not Found</h1>
          <p style={mutedStyle}>No simulation workspace exists for mission {id}.</p>
          <Link href="/simulation" style={linkStyle}>Back to Simulation</Link>
        </article>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Simulation Engine</p>
        <h1 style={titleStyle}>Research Mission 001</h1>
        <p style={mutedStyle}>{workspace.missionTitle}</p>
      </section>

      <section style={metricsStyle}>
        <Metric label="Simulation Count" value={String(workspace.simulationCount)} />
        <Metric label="Decision Models" value={String(workspace.decisionModels)} />
        <Metric label="Test Coverage" value={String(workspace.testCoverage)} />
        <Metric label="Execution Probability" value={String(workspace.executionProbability)} />
        <Metric label="Health Score" value={String(workspace.healthScore)} />
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Simulations</h2>
        <ul style={listStyle}>
          {workspace.simulations.map((s) => (
            <li key={s.simulationId} style={listItemStyle}>
              {s.name}: Outcome {s.outcome}%, {s.iterations} iterations
            </li>
          ))}
        </ul>
      </section>

      <section style={cardStyle}>
        <Link href="/simulation" style={linkStyle}>Back to Simulation</Link>
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
