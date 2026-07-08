import Link from "next/link"
import { getMissionInference } from "../../../lib/gamma/inference-reader"

export const dynamic = "force-dynamic"

export default async function MissionInferencePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getMissionInference(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <article style={cardStyle}>
          <h1 style={titleStyle}>Inference Not Found</h1>
          <p style={mutedStyle}>No inference layer exists for mission {id}.</p>
          <Link href="/inference" style={linkStyle}>
            Back to Inference
          </Link>
        </article>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Inference Engine</p>
        <h1 style={titleStyle}>Womanhood</h1>
        <p style={mutedStyle}>{workspace.missionTitle}</p>
        <p style={mutedStyle}>Research Mission 001</p>
      </section>

      <section style={metricsGridStyle}>
        <Metric label="Inference Count" value={String(workspace.inferenceCount)} />
        <Metric label="Gap Count" value={String(workspace.gapCount)} />
        <Metric label="Unanswered Questions" value={String(workspace.unansweredQuestions)} />
        <Metric label="Unused Discoveries" value={String(workspace.unusedDiscoveries)} />
        <Metric label="Missing Frameworks" value={String(workspace.missingFrameworkCount)} />
        <Metric label="Coverage Score" value={`${workspace.coverageScore}%`} />
        <Metric label="Maturity Score" value={String(workspace.maturityScore)} />
        <Metric label="Confidence Score" value={String(workspace.confidenceScore)} />
        <Metric label="Recommendation Score" value={String(workspace.recommendationScore)} />
        <Metric label="Recommendation Count" value={String(workspace.recommendationCount)} />
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
              </div>
            ))}
          </div>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Knowledge Opportunities</h2>
          <div style={stackStyle}>
            {workspace.knowledgeOpportunities.map((item) => (
              <div key={item.id} style={rowStyle}>
                <strong>{item.source}</strong>
                <span style={mutedStyle}>{item.inference}</span>
                <span style={mutedStyle}>Action: {item.suggestedAction}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Unused Research</h2>
          <div style={stackStyle}>
            {workspace.unusedResearch.map((item) => (
              <div key={item.id} style={rowStyle}>
                <strong>{item.source}</strong>
                <span style={mutedStyle}>{item.inference}</span>
                <span style={mutedStyle}>{item.suggestedAction}</span>
              </div>
            ))}
          </div>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Missing Assets</h2>
          <div style={stackStyle}>
            {workspace.missingAssets.map((item) => (
              <div key={item.id} style={rowStyle}>
                <strong>{item.source}</strong>
                <span style={mutedStyle}>{item.inference}</span>
                <span style={mutedStyle}>Output: {item.suggestedOutput}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Mission Maturity</h2>
          <p style={mutedStyle}>Areas needing attention: {workspace.missionAreasNeedingAttention.join(", ")}</p>
          <div style={stackStyle}>
            {workspace.workspaceWeaknesses.map((item) => (
              <div key={item.workspace} style={weaknessRowStyle}>
                <strong>{item.workspace}</strong>
                <span style={mutedStyle}>Score: {item.score}</span>
                <span style={mutedStyle}>Status: {item.status}</span>
              </div>
            ))}
          </div>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Suggested Actions</h2>
          <ul style={listStyle}>
            {workspace.suggestedActions.map((action) => (
              <li key={action} style={listItemStyle}>
                {action}
              </li>
            ))}
          </ul>
          <h3 style={subTitleStyle}>Inference Timeline</h3>
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
        <Link href="/inference" style={linkStyle}>
          Back to Inference
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

const pageStyle: React.CSSProperties = { maxWidth: 1400, margin: "0 auto", padding: 32, color: "var(--foreground)" }
const cardStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 10, padding: 16, background: "var(--card-background)", marginBottom: 14 }
const titleStyle: React.CSSProperties = { margin: "6px 0", fontSize: 32 }
const sectionTitleStyle: React.CSSProperties = { margin: 0, fontSize: 18 }
const subTitleStyle: React.CSSProperties = { margin: "12px 0 0", fontSize: 15 }
const eyebrowStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.8 }
const mutedStyle: React.CSSProperties = { margin: "5px 0", color: "var(--muted)" }
const metricsGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 14 }
const metricCardStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 8, padding: 12, background: "var(--background)" }
const metricLabelStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)" }
const metricValueStyle: React.CSSProperties = { margin: "6px 0 0", fontWeight: 700, fontSize: 20 }
const twoColStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 12, marginBottom: 14 }
const stackStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }
const rowStyle: React.CSSProperties = { borderTop: "1px solid var(--border)", paddingTop: 8, display: "flex", flexDirection: "column", gap: 4 }
const weaknessRowStyle: React.CSSProperties = { borderTop: "1px solid var(--border)", paddingTop: 8, display: "grid", gap: 8, gridTemplateColumns: "1fr auto auto" }
const listStyle: React.CSSProperties = { margin: "8px 0 0", paddingLeft: 18 }
const listItemStyle: React.CSSProperties = { marginBottom: 8 }
const timelineRowStyle: React.CSSProperties = { borderTop: "1px solid var(--border)", paddingTop: 8, display: "grid", gridTemplateColumns: "110px 1fr auto", gap: 10 }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }

