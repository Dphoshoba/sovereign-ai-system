import Link from "next/link"
import { getMissionMissionEconomy } from "../../../lib/gamma/mission-economy-reader"

export const dynamic = "force-dynamic"

export default async function MissionEconomyMissionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getMissionMissionEconomy(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <article style={cardStyle}>
          <h1 style={titleStyle}>Economy Not Found</h1>
          <p style={mutedStyle}>No economy data exists for mission {id}.</p>
          <Link href="/mission-economy" style={linkStyle}>Back to Mission Economy</Link>
        </article>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Gamma Mission Economy</p>
        <h1 style={titleStyle}>Mission {workspace.mission}</h1>
        <p style={mutedStyle}>{workspace.missionTitle}</p>
      </section>

      <section style={metricsStyle}>
        <Metric label="Economy Score" value={String(workspace.economyScore)} />
        <Metric label="Value Generation" value={String(workspace.valueGeneration)} />
        <Metric label="Revenue Potential" value={String(workspace.revenuePotential)} />
        <Metric label="Cost Optimization" value={String(workspace.costOptimization)} />
        <Metric label="Profit Margin" value={String(workspace.profitMargin)} />
        <Metric label="Capital Efficiency" value={String(workspace.capitalEfficiency)} />
        <Metric label="Growth Rate" value={String(workspace.growthRate)} />
      </section>

      <section style={cardStyle}>
        <Link href="/mission-economy" style={linkStyle}>Back to Mission Economy</Link>
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
