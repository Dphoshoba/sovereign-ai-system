import Link from "next/link"
import { getMissionGapAnalysis } from "../../../lib/gamma/gap-analysis-reader"

export const dynamic = "force-dynamic"

export default async function MissionGapAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getMissionGapAnalysis(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <article style={cardStyle}>
          <h1 style={titleStyle}>Gap Analysis Not Found</h1>
          <p style={mutedStyle}>No gap analysis exists for mission {id}.</p>
          <Link href="/gap-analysis" style={linkStyle}>
            Back to Gap Analysis
          </Link>
        </article>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Gap Analysis Engine</p>
        <h1 style={titleStyle}>Womanhood</h1>
        <p style={mutedStyle}>{workspace.missionTitle}</p>
        <p style={mutedStyle}>Research Mission 001</p>
      </section>

      <section style={metricsGridStyle}>
        <Metric label="Gap Count" value={String(workspace.gapCount)} />
        <Metric label="Asset Deficit" value={String(workspace.assetDeficit)} />
        <Metric label="Missing Frameworks" value={String(workspace.missingFrameworkCount)} />
        <Metric label="Missing Creator Assets" value={String(workspace.missingCreatorAssets)} />
        <Metric label="Missing Teachings" value={String(workspace.missingTeachings)} />
        <Metric label="Missing Executive Assets" value={String(workspace.missingExecutiveAssets)} />
        <Metric label="Missing Agency Assets" value={String(workspace.missingAgencyAssets)} />
        <Metric label="Missing Knowledge Assets" value={String(workspace.missingKnowledgeAssets)} />
        <Metric label="Coverage" value={`${workspace.coverageScore}%`} />
        <Metric label="Maturity Score" value={String(workspace.maturityScore)} />
        <Metric label="Priority Score" value={String(workspace.priorityScore)} />
        <Metric label="Recommendation Score" value={String(workspace.recommendationScore)} />
        <Metric label="Health Score" value={String(workspace.healthScore)} />
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Knowledge Gaps</h2>
          <div style={stackStyle}>
            {workspace.knowledgeGaps.map((gap) => (
              <div key={gap.id} style={rowStyle}>
                <strong>{gap.title}</strong>
                <span style={mutedStyle}>Severity: {gap.severity}</span>
                <p style={mutedStyle}>{gap.description}</p>
                <span style={mutedStyle}>Action: {gap.suggestedAction}</span>
              </div>
            ))}
          </div>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Mission Deficits</h2>
          <p style={mutedStyle}>Weakest workspace: {workspace.weakestWorkspace.workspace} ({workspace.weakestWorkspace.score})</p>
          <p style={mutedStyle}>Low maturity areas: {workspace.lowMaturityAreas.join(", ")}</p>
          <h3 style={subTitleStyle}>Missing Assets</h3>
          <ul style={listStyle}>
            {workspace.missingAssets.map((item) => (
              <li key={item} style={listItemStyle}>
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Recommendations</h2>
          <ul style={listStyle}>
            {workspace.recommendations.map((item) => (
              <li key={item} style={listItemStyle}>
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Gap Timeline</h2>
          <div style={stackStyle}>
            {workspace.timeline.map((item) => (
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
        <Link href="/gap-analysis" style={linkStyle}>
          Back to Gap Analysis
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
const subTitleStyle: React.CSSProperties = { margin: "12px 0 0", fontSize: 15 }
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
