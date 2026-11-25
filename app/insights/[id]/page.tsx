import Link from "next/link"
import { getMissionInsights } from "../../../lib/gamma/insight-reader"

export const dynamic = "force-dynamic"

export default async function InsightsMissionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getMissionInsights(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <article style={cardStyle}>
          <h1 style={titleStyle}>Insights Not Found</h1>
          <p style={mutedStyle}>No insight workspace exists for mission {id}.</p>
          <Link href="/insights" style={linkStyle}>Back to Insights</Link>
        </article>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Insight Engine</p>
        <h1 style={titleStyle}>Research Mission 001</h1>
        <p style={mutedStyle}>{workspace.missionTitle}</p>
      </section>

      <section style={metricsStyle}>
        <Metric label="Insight Count" value={String(workspace.insightCount)} />
        <Metric label="Trend Count" value={String(workspace.trendCount)} />
        <Metric label="Emerging Theme Count" value={String(workspace.emergingThemeCount)} />
        <Metric label="Cross-Domain Signals" value={String(workspace.crossDomainSignals)} />
        <Metric label="Knowledge Momentum" value={String(workspace.knowledgeMomentum)} />
        <Metric label="Attention Score" value={String(workspace.attentionScore)} />
        <Metric label="Health Score" value={String(workspace.healthScore)} />
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Insights</h2>
          <ul style={listStyle}>
            {workspace.insights.map((item) => (
              <li key={item} style={listItemStyle}>{item}</li>
            ))}
          </ul>
          <h2 style={sectionTitleStyle}>Emerging Themes</h2>
          <ul style={listStyle}>
            {workspace.emergingThemes.map((item) => (
              <li key={item} style={listItemStyle}>{item}</li>
            ))}
          </ul>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Trends</h2>
          <ul style={listStyle}>
            {workspace.trends.map((item) => (
              <li key={item.title} style={listItemStyle}>{item.title} ({item.score}): {item.rationale}</li>
            ))}
          </ul>
          <h2 style={sectionTitleStyle}>Cross-Domain Signals</h2>
          <ul style={listStyle}>
            {workspace.signals.map((item) => (
              <li key={item.title} style={listItemStyle}>{item.title} ({item.source}) - {item.score}</li>
            ))}
          </ul>
        </article>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Recommendations</h2>
        <ul style={listStyle}>
          {workspace.recommendations.map((item) => (
            <li key={item} style={listItemStyle}>{item}</li>
          ))}
        </ul>
        <h2 style={sectionTitleStyle}>Roadmap</h2>
        <div style={stackStyle}>
          {workspace.roadmap.map((item) => (
            <div key={`${item.date}-${item.event}`} style={rowStyle}>
              <span style={mutedStyle}>{item.date}</span>
              <span>{item.event}</span>
              <span style={mutedStyle}>{item.status}</span>
            </div>
          ))}
        </div>
        <Link href="/insights" style={linkStyle}>Back to Insights</Link>
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
const stackStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8 }
const rowStyle: React.CSSProperties = { borderTop: "1px solid var(--border)", paddingTop: 8, display: "grid", gridTemplateColumns: "110px 1fr auto", gap: 10 }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }
