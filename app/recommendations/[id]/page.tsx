import Link from "next/link"
import { getMissionRecommendations } from "../../../lib/gamma/recommendation-reader"

export const dynamic = "force-dynamic"

export default async function MissionRecommendationsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getMissionRecommendations(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <article style={cardStyle}>
          <h1 style={titleStyle}>Recommendations Not Found</h1>
          <p style={mutedStyle}>No recommendation layer exists for mission {id}.</p>
          <Link href="/recommendations" style={linkStyle}>
            Back to Recommendations
          </Link>
        </article>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Recommendations</p>
        <h1 style={titleStyle}>Womanhood</h1>
        <p style={mutedStyle}>{workspace.missionTitle}</p>
      </section>

      <section style={metricsGridStyle}>
        <Metric label="Research Assets" value={String(workspace.researchAssets)} />
        <Metric label="Creator Assets" value={String(workspace.creatorAssets)} />
        <Metric label="Ministry Assets" value={String(workspace.ministryAssets)} />
        <Metric label="Executive Assets" value={String(workspace.executiveAssets)} />
        <Metric label="Agency Assets" value={String(workspace.agencyAssets)} />
        <Metric label="Knowledge Assets" value={String(workspace.knowledgeAssets)} />
        <Metric label="Questions" value={String(workspace.questions)} />
        <Metric label="Discoveries" value={String(workspace.discoveries)} />
        <Metric label="Coverage" value={`${workspace.coveragePercent}%`} />
        <Metric label="Readiness" value={String(workspace.readinessScore)} />
        <Metric label="Health" value={String(workspace.healthScore)} />
        <Metric label="Recommendation Count" value={String(workspace.recommendationCount)} />
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Recommendations</h2>
        <div style={stackStyle}>
          {workspace.recommendations.map((item) => (
            <article key={item.id} style={recommendationCardStyle}>
              <strong>{item.title}</strong>
              <p style={mutedStyle}>Priority: {item.priority}</p>
              <p style={mutedStyle}>Action Type: {item.actionType}</p>
              <p style={rationaleStyle}>{item.rationale}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={cardStyle}>
        <Link href="/recommendations" style={linkStyle}>
          Back to Recommendations
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

const pageStyle: React.CSSProperties = { maxWidth: 1300, margin: "0 auto", padding: 32, color: "var(--foreground)" }
const cardStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 10, padding: 16, background: "var(--card-background)", marginBottom: 14 }
const titleStyle: React.CSSProperties = { margin: "6px 0", fontSize: 32 }
const sectionTitleStyle: React.CSSProperties = { margin: 0, fontSize: 18 }
const eyebrowStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.8 }
const mutedStyle: React.CSSProperties = { margin: "5px 0", color: "var(--muted)" }
const rationaleStyle: React.CSSProperties = { margin: "8px 0 0", lineHeight: 1.5 }
const metricsGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 14 }
const metricCardStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 8, padding: 12, background: "var(--background)" }
const metricLabelStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)" }
const metricValueStyle: React.CSSProperties = { margin: "6px 0 0", fontWeight: 700, fontSize: 20 }
const stackStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }
const recommendationCardStyle: React.CSSProperties = { borderTop: "1px solid var(--border)", paddingTop: 8 }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }
