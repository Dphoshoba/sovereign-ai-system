import Link from "next/link"
import { getMissionExecutiveDashboard } from "../../../lib/gamma/executive-dashboard-reader"

export default async function MissionExecutiveDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getMissionExecutiveDashboard(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <article style={cardStyle}>
          <h1 style={titleStyle}>Executive Dashboard Not Found</h1>
          <p style={mutedStyle}>No executive dashboard exists for mission {id}.</p>
          <Link href="/executive-dashboard" style={linkStyle}>Back to Executive Dashboard</Link>
        </article>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Executive Dashboard</p>
        <h1 style={titleStyle}>Research Mission 001</h1>
        <p style={mutedStyle}>{workspace.missionTitle}</p>
        <p style={mutedStyle}>Strategic alignment, risk, opportunity, and priority cockpit.</p>
      </section>

      <section style={metricsGridStyle}>
        <Metric label="Executive Score" value={String(workspace.executiveScore)} />
        <Metric label="Strategic Alignment" value={String(workspace.strategicAlignment)} />
        <Metric label="Knowledge Velocity" value={String(workspace.knowledgeVelocity)} />
        <Metric label="Growth Trajectory" value={String(workspace.growthTrajectory)} />
        <Metric label="Decision Quality" value={String(workspace.decisionQuality)} />
        <Metric label="Mission Risk" value={String(workspace.missionRisk)} />
        <Metric label="Opportunity Index" value={String(workspace.opportunityIndex)} />
        <Metric label="Capitalization Score" value={String(workspace.capitalizationScore)} />
        <Metric label="Focus Score" value={String(workspace.focusScore)} />
        <Metric label="Sustainability Score" value={String(workspace.sustainabilityScore)} />
        <Metric label="Priority Count" value={String(workspace.priorityCount)} />
        <Metric label="Decision Count" value={String(workspace.decisionCount)} />
        <Metric label="Risk Count" value={String(workspace.riskCount)} />
        <Metric label="Opportunity Count" value={String(workspace.opportunityCount)} />
        <Metric label="Health Score" value={String(workspace.healthScore)} />
        <Metric label="Readiness Score" value={String(workspace.readinessScore)} />
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Executive Summary</h2>
          <ul style={listStyle}>
            {workspace.executiveSummary.map((item) => (
              <li key={item} style={listItemStyle}>{item}</li>
            ))}
          </ul>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Strategic Alignment</h2>
          <p style={mutedStyle}>Current alignment score: {workspace.strategicAlignment}</p>
          <h2 style={sectionTitleStyle}>Knowledge Velocity</h2>
          <p style={mutedStyle}>Current velocity score: {workspace.knowledgeVelocity}</p>
          <h2 style={sectionTitleStyle}>Growth Trajectory</h2>
          <p style={mutedStyle}>Current trajectory score: {workspace.growthTrajectory}</p>
          <h2 style={sectionTitleStyle}>Sustainability</h2>
          <p style={mutedStyle}>Current sustainability score: {workspace.sustainabilityScore}</p>
        </article>
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Mission Risk</h2>
          <div style={stackStyle}>
            {workspace.missionRisks.map((risk) => (
              <div key={risk.title} style={rowStyle}>
                <strong>{risk.title}</strong>
                <span style={mutedStyle}>Severity: {risk.severity}</span>
                <span style={mutedStyle}>Score: {risk.score}</span>
                <p style={mutedStyle}>{risk.mitigation}</p>
              </div>
            ))}
          </div>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Opportunities</h2>
          <div style={stackStyle}>
            {workspace.opportunities.map((opportunity) => (
              <div key={opportunity.title} style={rowStyle}>
                <strong>{opportunity.title}</strong>
                <span style={mutedStyle}>Score: {opportunity.score}</span>
                <span style={mutedStyle}>Value: {opportunity.value}</span>
                <p style={mutedStyle}>{opportunity.nextMove}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Decision Queue</h2>
          <div style={stackStyle}>
            {workspace.decisionQueue.map((decision) => (
              <div key={decision.title} style={rowStyle}>
                <strong>{decision.title}</strong>
                <span style={mutedStyle}>{decision.workspace}</span>
                <span style={mutedStyle}>Priority: {decision.priority}</span>
                <p style={mutedStyle}>{decision.rationale}</p>
              </div>
            ))}
          </div>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Priority Radar</h2>
          <div style={stackStyle}>
            {workspace.priorityRadar.map((priority) => (
              <div key={priority.title} style={rowStyle}>
                <strong>{priority.title}</strong>
                <span style={mutedStyle}>Score: {priority.score}</span>
                <p style={mutedStyle}>{priority.rationale}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Next Executive Moves</h2>
          <ul style={listStyle}>
            {workspace.nextExecutiveMoves.map((item) => (
              <li key={item} style={listItemStyle}>{item}</li>
            ))}
          </ul>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Roadmap</h2>
          <div style={stackStyle}>
            {workspace.roadmap.map((item) => (
              <div key={`${item.date}-${item.event}`} style={timelineRowStyle}>
                <span style={mutedStyle}>{item.date}</span>
                <span>{item.event}</span>
                <span style={mutedStyle}>{item.status}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section style={cardStyle}>
        <Link href="/executive-dashboard" style={linkStyle}>Back to Executive Dashboard</Link>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article style={metricCardStyle}>
      <p style={metricLabelStyle}>{label}</p>
      <p style={metricValueStyle}>{value}</p>
    </article>
  )
}

const pageStyle: React.CSSProperties = { maxWidth: 1450, margin: "0 auto", padding: 32, color: "var(--foreground)" }
const cardStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 10, padding: 16, background: "var(--card-background)", marginBottom: 14 }
const titleStyle: React.CSSProperties = { margin: "6px 0", fontSize: 32 }
const sectionTitleStyle: React.CSSProperties = { margin: 0, fontSize: 18 }
const eyebrowStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.8 }
const mutedStyle: React.CSSProperties = { margin: "5px 0", color: "var(--muted)" }
const metricsGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginBottom: 14 }
const metricCardStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 8, padding: 12, background: "var(--background)" }
const metricLabelStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)" }
const metricValueStyle: React.CSSProperties = { margin: "6px 0 0", fontWeight: 700, fontSize: 20 }
const twoColStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 12, marginBottom: 14 }
const stackStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }
const rowStyle: React.CSSProperties = { borderTop: "1px solid var(--border)", paddingTop: 8, display: "flex", flexDirection: "column", gap: 4 }
const timelineRowStyle: React.CSSProperties = { borderTop: "1px solid var(--border)", paddingTop: 8, display: "grid", gridTemplateColumns: "110px 1fr auto", gap: 10 }
const listStyle: React.CSSProperties = { margin: "8px 0 0", paddingLeft: 18 }
const listItemStyle: React.CSSProperties = { marginBottom: 8 }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }