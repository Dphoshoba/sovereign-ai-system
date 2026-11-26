import Link from "next/link"
import { getMissionAdvisor } from "../../../lib/gamma/advisor-reader"

export const dynamic = "force-dynamic"

export default async function AdvisorMissionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getMissionAdvisor(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <article style={cardStyle}>
          <h1 style={titleStyle}>Advisor Not Found</h1>
          <p style={mutedStyle}>No advisor workspace exists for mission {id}.</p>
          <Link href="/advisor" style={linkStyle}>
            Back to Advisor
          </Link>
        </article>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Daily Advisor</p>
        <h1 style={titleStyle}>Research Mission 001</h1>
        <p style={mutedStyle}>{workspace.missionTitle}</p>
        <p style={mutedStyle}>Priorities and actions for today.</p>
      </section>

      <section style={metricsGridStyle}>
        <Metric label="Advice Count" value={String(workspace.adviceCount)} />
        <Metric label="Priority Actions" value={String(workspace.priorityActionCount)} />
        <Metric label="Highest ROI Gap" value={workspace.highestRoiGap} />
        <Metric label="Weakest Workspace" value={workspace.weakestWorkspace} />
        <Metric label="Urgency" value={String(workspace.urgencyScore)} />
        <Metric label="Impact" value={String(workspace.impactScore)} />
        <Metric label="Momentum" value={String(workspace.momentumScore)} />
        <Metric label="Execution" value={String(workspace.executionScore)} />
        <Metric label="Health" value={String(workspace.healthScore)} />
        <Metric label="Recommendations" value={String(workspace.recommendationCount)} />
        <Metric label="Mission Focus" value={String(workspace.missionFocusScore)} />
        <Metric label="Knowledge Debt" value={String(workspace.knowledgeDebt)} />
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Today's Priorities</h2>
          <div style={stackStyle}>
            {workspace.priorityActions.map((action) => (
              <div key={action.id} style={rowStyle}>
                <strong>{action.title}</strong>
                <span style={mutedStyle}>{action.category}</span>
                <span style={mutedStyle}>Priority: {action.priority}</span>
                <p style={mutedStyle}>{action.rationale}</p>
              </div>
            ))}
          </div>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Top Actions</h2>
          <ul style={listStyle}>
            {workspace.topActions.map((action) => (
              <li key={action.id} style={listItemStyle}>
                {action.title}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Knowledge Debt</h2>
          <p style={mutedStyle}>Highest ROI opportunities drive the next round of asset creation.</p>
          <ul style={listStyle}>
            {workspace.highestRoiOpportunities.map((item) => (
              <li key={item} style={listItemStyle}>
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Weakest Areas</h2>
          <ul style={listStyle}>
            {workspace.weakestAreas.map((item) => (
              <li key={item} style={listItemStyle}>
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Creator Suggestions</h2>
          <ul style={listStyle}>
            {workspace.creatorSuggestions.map((item) => (
              <li key={item} style={listItemStyle}>
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Teaching Suggestions</h2>
          <ul style={listStyle}>
            {workspace.teachingSuggestions.map((item) => (
              <li key={item} style={listItemStyle}>
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Executive Suggestions</h2>
          <ul style={listStyle}>
            {workspace.executiveSuggestions.map((item) => (
              <li key={item} style={listItemStyle}>
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Agency Suggestions</h2>
          <ul style={listStyle}>
            {workspace.agencySuggestions.map((item) => (
              <li key={item} style={listItemStyle}>
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Mission Focus</h2>
          <ul style={listStyle}>
            {workspace.missionFocus.map((item) => (
              <li key={item} style={listItemStyle}>
                {item}
              </li>
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
        <Link href="/advisor" style={linkStyle}>
          Back to Advisor
        </Link>
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
