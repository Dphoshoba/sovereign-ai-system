import Link from "next/link"
import { getMissionStrategy } from "../../../lib/gamma/strategy-reader"

export const dynamic = "force-dynamic"

export default async function StrategyMissionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getMissionStrategy(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <article style={cardStyle}>
          <h1 style={titleStyle}>Strategy Not Found</h1>
          <p style={mutedStyle}>No strategy workspace exists for mission {id}.</p>
          <Link href="/strategy" style={linkStyle}>Back to Strategy</Link>
        </article>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Strategy Engine</p>
        <h1 style={titleStyle}>Research Mission 001</h1>
        <p style={mutedStyle}>{workspace.missionTitle}</p>
      </section>

      <section style={metricsStyle}>
        <Metric label="Strategy Count" value={String(workspace.strategyCount)} />
        <Metric label="Strategic Themes" value={String(workspace.strategicThemes)} />
        <Metric label="Competitive Advantage" value={String(workspace.competitiveAdvantage)} />
        <Metric label="Mission Fit" value={String(workspace.missionFit)} />
        <Metric label="Alignment Score" value={String(workspace.alignmentScore)} />
        <Metric label="Execution Potential" value={String(workspace.executionPotential)} />
      </section>

      <section style={metricsStyle}>
        <Metric label="Health Score" value={String(workspace.healthScore)} />
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Strategies</h2>
        <ul style={listStyle}>
          {workspace.strategies.map((s) => (
            <li key={s.strategyId} style={listItemStyle}>
              {s.strategyName}: Advantage {s.competitiveAdvantage}, Alignment {s.alignment}
            </li>
          ))}
        </ul>
      </section>

      <section style={cardStyle}>
        <Link href="/strategy" style={linkStyle}>Back to Strategy</Link>
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
