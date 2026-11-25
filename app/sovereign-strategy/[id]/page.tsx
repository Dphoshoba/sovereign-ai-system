import Link from "next/link"
import { getMissionSovereignStrategy } from "../../../lib/gamma/sovereign-strategy-reader"

export const dynamic = "force-dynamic"

export default async function SovereignStrategyMissionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getMissionSovereignStrategy(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <article style={cardStyle}>
          <h1 style={titleStyle}>Strategy Not Found</h1>
          <p style={mutedStyle}>No strategy exists for mission {id}.</p>
          <Link href="/sovereign-strategy" style={linkStyle}>Back to Sovereign Strategy</Link>
        </article>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Gamma Sovereign Strategy</p>
        <h1 style={titleStyle}>Mission {workspace.mission}</h1>
        <p style={mutedStyle}>{workspace.missionTitle}</p>
      </section>

      <section style={metricsStyle}>
        <Metric label="Strategy Score" value={String(workspace.strategyScore)} />
        <Metric label="Alignment Score" value={String(workspace.alignmentScore)} />
        <Metric label="Execution Score" value={String(workspace.executionScore)} />
        <Metric label="Mission Cohesion" value={String(workspace.missionCohesion)} />
        <Metric label="Resource Allocation" value={String(workspace.resourceAllocation)} />
        <Metric label="Success Probability" value={String(workspace.successProbability)} />
        <Metric label="Risk Mitigation" value={String(workspace.riskMitigation)} />
      </section>

      <section style={cardStyle}>
        <Link href="/sovereign-strategy" style={linkStyle}>Back to Sovereign Strategy</Link>
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

const pageStyle: React.CSSProperties = { maxWidth: 1360, margin: "0 auto", padding: 32, color: "var(--foreground)" }
const cardStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 10, padding: 16, background: "var(--card-background)", marginBottom: 14 }
const eyebrowStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.8 }
const titleStyle: React.CSSProperties = { margin: "6px 0", fontSize: 32 }
const sectionTitleStyle: React.CSSProperties = { margin: "0 0 6px", fontSize: 18 }
const mutedStyle: React.CSSProperties = { margin: "4px 0", color: "var(--muted)" }
const metricsStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginBottom: 14 }
const metricStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 8, padding: 12, background: "var(--background)" }
const metricLabelStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)" }
const metricValueStyle: React.CSSProperties = { margin: "6px 0 0", fontWeight: 700, fontSize: 20 }
const twoColStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 12, marginBottom: 14 }
const listStyle: React.CSSProperties = { margin: 0, paddingLeft: 18 }
const listItemStyle: React.CSSProperties = { marginBottom: 8 }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }
