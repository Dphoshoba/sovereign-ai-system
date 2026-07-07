import Link from "next/link"
import { getMissionImpact } from "../../../lib/gamma/impact-reader"

export const dynamic = "force-dynamic"

export default async function ImpactMissionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getMissionImpact(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <article style={cardStyle}>
          <h1 style={titleStyle}>Impact Not Found</h1>
          <p style={mutedStyle}>No impact workspace exists for mission {id}.</p>
          <Link href="/impact" style={linkStyle}>Back to Impact</Link>
        </article>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Impact Engine</p>
        <h1 style={titleStyle}>Research Mission 001</h1>
        <p style={mutedStyle}>{workspace.missionTitle}</p>
      </section>

      <section style={metricsStyle}>
        <Metric label="Impact Areas" value={String(workspace.impactAreas)} />
        <Metric label="People Reached" value={String(workspace.peopleReached)} />
        <Metric label="Mission Influence" value={String(workspace.missionInfluence)} />
        <Metric label="Societal Value" value={String(workspace.societalValue)} />
        <Metric label="Legacy Score" value={String(workspace.legacyScore)} />
        <Metric label="Impact Score" value={String(workspace.impactScore)} />
      </section>

      <section style={metricsStyle}>
        <Metric label="Health Score" value={String(workspace.healthScore)} />
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Impact Areas</h2>
        <ul style={listStyle}>
          {workspace.areas.map((a) => (
            <li key={a.areaId} style={listItemStyle}>
              {a.areaName}: Reached {a.peopleReached}, Influence {a.influenceScore}, Legacy {a.legacyValue}
            </li>
          ))}
        </ul>
      </section>

      <section style={cardStyle}>
        <Link href="/impact" style={linkStyle}>Back to Impact</Link>
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
