import Link from "next/link"
import { getMissionLearning } from "../../../lib/gamma/learning-reader"

export const dynamic = "force-dynamic"

export default async function LearningMissionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getMissionLearning(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <article style={cardStyle}>
          <h1 style={titleStyle}>Learning Not Found</h1>
          <p style={mutedStyle}>No learning workspace exists for mission {id}.</p>
          <Link href="/learning" style={linkStyle}>Back to Learning</Link>
        </article>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Learning Engine</p>
        <h1 style={titleStyle}>Research Mission 001</h1>
        <p style={mutedStyle}>{workspace.missionTitle}</p>
      </section>

      <section style={metricsStyle}>
        <Metric label="Learning Assets" value={String(workspace.learningAssets)} />
        <Metric label="Growth Rate" value={String(workspace.growthRate)} />
        <Metric label="Knowledge Gain" value={String(workspace.knowledgeGain)} />
        <Metric label="Improvement Score" value={String(workspace.improvementScore)} />
        <Metric label="Feedback Loops" value={String(workspace.feedbackLoops)} />
        <Metric label="Retention Score" value={String(workspace.retentionScore)} />
      </section>

      <section style={metricsStyle}>
        <Metric label="Health Score" value={String(workspace.healthScore)} />
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Learning Assets</h2>
        <ul style={listStyle}>
          {workspace.assets.map((a) => (
            <li key={a.assetId} style={listItemStyle}>
              {a.assetName}: Knowledge Gain {a.knowledgeGain}, Retention {a.retentionRate}
            </li>
          ))}
        </ul>
      </section>

      <section style={cardStyle}>
        <Link href="/learning" style={linkStyle}>Back to Learning</Link>
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
