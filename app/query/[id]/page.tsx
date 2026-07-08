import Link from "next/link"
import { getMissionQueryWorkspace } from "../../../lib/gamma/query-reader"

export const dynamic = "force-dynamic"

export default async function MissionQueryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getMissionQueryWorkspace(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <article style={cardStyle}>
          <h1 style={titleStyle}>Query View Not Found</h1>
          <p style={mutedStyle}>No query workspace exists for mission {id}.</p>
          <Link href="/query" style={linkStyle}>
            Back to Query Engine
          </Link>
        </article>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Knowledge Query Engine</p>
        <h1 style={titleStyle}>Womanhood</h1>
        <p style={mutedStyle}>{workspace.missionTitle}</p>
        <p style={mutedStyle}>Research Mission 001</p>
      </section>

      <section style={metricsGridStyle}>
        <Metric label="Query Count" value={String(workspace.queryCount)} />
        <Metric label="Question Count" value={String(workspace.questionCount)} />
        <Metric label="Answer Count" value={String(workspace.answerCount)} />
        <Metric label="Gap Count" value={String(workspace.gapCount)} />
        <Metric label="Coverage Score" value={`${workspace.coverageScore}%`} />
        <Metric label="Inference Coverage" value={`${workspace.inferenceCoverage}%`} />
        <Metric label="Confidence Score" value={String(workspace.confidenceScore)} />
        <Metric label="Recommendation Score" value={String(workspace.recommendationScore)} />
        <Metric label="Mission Priority Score" value={String(workspace.missionPriorityScore)} />
        <Metric label="Knowledge Completeness" value={String(workspace.knowledgeCompleteness)} />
        <Metric label="Health Score" value={String(workspace.healthScore)} />
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Questions</h2>
          <div style={stackStyle}>
            {workspace.answers.map((item) => (
              <div key={item.id} style={rowStyle}>
                <strong>{item.query}</strong>
                <span style={mutedStyle}>Confidence: {item.confidence}</span>
                <span style={mutedStyle}>Priority: {item.priority}</span>
              </div>
            ))}
          </div>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Answers</h2>
          <div style={stackStyle}>
            {workspace.answers.map((item) => (
              <div key={`${item.id}-answer`} style={answerBlockStyle}>
                <strong>{item.query}</strong>
                <ul style={listStyle}>
                  {item.answer.map((answerLine) => (
                    <li key={`${item.id}-${answerLine}`} style={listItemStyle}>
                      {answerLine}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Evidence</h2>
          <div style={stackStyle}>
            {workspace.answers.map((item) => (
              <div key={`${item.id}-evidence`} style={answerBlockStyle}>
                <strong>{item.query}</strong>
                {item.evidence.map((evidence) => (
                  <p key={`${item.id}-${evidence.source}`} style={mutedStyle}>
                    {evidence.source}: {evidence.summary}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Recommendations</h2>
          <ul style={listStyle}>
            {workspace.suggestedNextActions.map((action) => (
              <li key={action} style={listItemStyle}>
                {action}
              </li>
            ))}
          </ul>
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
          <h2 style={sectionTitleStyle}>Weak Areas</h2>
          <div style={stackStyle}>
            {workspace.weakAreas.map((item) => (
              <div key={item.workspace} style={scoreRowStyle}>
                <strong>{item.workspace}</strong>
                <span style={mutedStyle}>Score: {item.score}</span>
                <span style={mutedStyle}>Status: {item.status}</span>
              </div>
            ))}
          </div>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Strong Areas</h2>
          <div style={stackStyle}>
            {workspace.strongAreas.map((item) => (
              <div key={item.workspace} style={scoreRowStyle}>
                <strong>{item.workspace}</strong>
                <span style={mutedStyle}>Score: {item.score}</span>
                <span style={mutedStyle}>Status: {item.status}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section style={cardStyle}>
        <Link href="/query" style={linkStyle}>
          Back to Query Engine
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
const answerBlockStyle: React.CSSProperties = { borderTop: "1px solid var(--border)", paddingTop: 8 }
const scoreRowStyle: React.CSSProperties = { borderTop: "1px solid var(--border)", paddingTop: 8, display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8 }
const listStyle: React.CSSProperties = { margin: "8px 0 0", paddingLeft: 18 }
const listItemStyle: React.CSSProperties = { marginBottom: 8 }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }

