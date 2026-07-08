import Link from "next/link"
import { getMissionControl } from "../../../lib/gamma/mission-control-reader"

export const dynamic = "force-dynamic"

export default async function MissionControlDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getMissionControl(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <article style={cardStyle}>
          <h1 style={titleStyle}>Mission Control Not Found</h1>
          <p style={mutedStyle}>No mission control workspace exists for mission {id}.</p>
          <Link href="/mission-control" style={linkStyle}>Back to Mission Control</Link>
        </article>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Mission Control</p>
        <h1 style={titleStyle}>Research Mission 001</h1>
        <p style={mutedStyle}>{workspace.missionTitle}</p>
        <p style={mutedStyle}>Unified command center for strategic and execution control.</p>
      </section>

      <section style={metricsGridStyle}>
        <Metric label="Mission Score" value={String(workspace.missionScore)} />
        <Metric label="Executive Score" value={String(workspace.executiveScore)} />
        <Metric label="Planner Score" value={String(workspace.plannerScore)} />
        <Metric label="Advisor Score" value={String(workspace.advisorScore)} />
        <Metric label="Review Score" value={String(workspace.reviewScore)} />
        <Metric label="Readiness Score" value={String(workspace.readinessScore)} />
        <Metric label="Momentum Score" value={String(workspace.momentumScore)} />
        <Metric label="Health Score" value={String(workspace.healthScore)} />
        <Metric label="Knowledge Debt" value={String(workspace.knowledgeDebt)} />
        <Metric label="Risk Score" value={String(workspace.riskScore)} />
        <Metric label="Opportunity Score" value={String(workspace.opportunityScore)} />
        <Metric label="Alignment Score" value={String(workspace.alignmentScore)} />
        <Metric label="Execution Score" value={String(workspace.executionScore)} />
        <Metric label="Priority Count" value={String(workspace.priorityCount)} />
        <Metric label="Decision Count" value={String(workspace.decisionCount)} />
        <Metric label="Blocker Count" value={String(workspace.blockerCount)} />
        <Metric label="Recommendation Count" value={String(workspace.recommendationCount)} />
        <Metric label="Action Count" value={String(workspace.actionCount)} />
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Mission Status</h2>
          <ul style={listStyle}>
            {workspace.missionStatus.map((item) => (
              <li key={item.title} style={listItemStyle}>{item.title}: {item.score} - {item.summary}</li>
            ))}
          </ul>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Executive View</h2>
          <ul style={listStyle}>
            {workspace.executiveView.map((item) => (
              <li key={item.title} style={listItemStyle}>{item.title}: {item.score} - {item.summary}</li>
            ))}
          </ul>
        </article>
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Advisor Insights</h2>
          <ul style={listStyle}>
            {workspace.advisorInsights.map((item) => (
              <li key={item} style={listItemStyle}>{item}</li>
            ))}
          </ul>
          <h2 style={sectionTitleStyle}>Execution Radar</h2>
          <ul style={listStyle}>
            {workspace.executionRadar.map((item) => (
              <li key={item.title} style={listItemStyle}>{item.title}: {item.score} - {item.summary}</li>
            ))}
          </ul>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Planner Queue</h2>
          <ul style={listStyle}>
            {workspace.plannerQueue.map((item) => (
              <li key={item} style={listItemStyle}>{item}</li>
            ))}
          </ul>
          <h2 style={sectionTitleStyle}>Review Snapshot</h2>
          <ul style={listStyle}>
            {workspace.reviewSnapshot.map((item) => (
              <li key={item} style={listItemStyle}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Risks</h2>
          <ul style={listStyle}>
            {workspace.risks.map((risk) => (
              <li key={risk.title} style={listItemStyle}>{risk.title} ({risk.severity}) {risk.score}: {risk.mitigation}</li>
            ))}
          </ul>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Opportunities</h2>
          <ul style={listStyle}>
            {workspace.opportunities.map((item) => (
              <li key={item.title} style={listItemStyle}>{item.title} ({item.score}): {item.action}</li>
            ))}
          </ul>
        </article>
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Recommendations</h2>
          <ul style={listStyle}>
            {workspace.recommendations.map((item) => (
              <li key={item} style={listItemStyle}>{item}</li>
            ))}
          </ul>
          <h2 style={sectionTitleStyle}>Immediate Actions</h2>
          <ul style={listStyle}>
            {workspace.immediateActions.map((item) => (
              <li key={item.title} style={listItemStyle}>{item.title} ({item.priority}, {item.owner}): {item.rationale}</li>
            ))}
          </ul>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Next 7 Days</h2>
          <ul style={listStyle}>
            {workspace.nextSevenDays.map((item) => (
              <li key={item} style={listItemStyle}>{item}</li>
            ))}
          </ul>
          <h2 style={sectionTitleStyle}>Mission Outlook</h2>
          <ul style={listStyle}>
            {workspace.missionOutlook.map((item) => (
              <li key={item} style={listItemStyle}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section style={cardStyle}>
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
        <Link href="/mission-control" style={linkStyle}>Back to Mission Control</Link>
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
const timelineRowStyle: React.CSSProperties = { borderTop: "1px solid var(--border)", paddingTop: 8, display: "grid", gridTemplateColumns: "110px 1fr auto", gap: 10 }
const listStyle: React.CSSProperties = { margin: "8px 0 0", paddingLeft: 18 }
const listItemStyle: React.CSSProperties = { marginBottom: 8 }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }
