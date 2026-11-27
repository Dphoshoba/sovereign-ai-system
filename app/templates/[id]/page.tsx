import Link from "next/link"
import { getMissionTemplateWorkspace } from "../../../lib/gamma/template-reader"

export const dynamic = "force-dynamic"

export default async function TemplatesMissionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getMissionTemplateWorkspace(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <article style={cardStyle}>
          <h1 style={titleStyle}>Templates Workspace Not Found</h1>
          <p style={mutedStyle}>No templates workspace exists for mission {id}.</p>
          <Link href="/templates" style={linkStyle}>Back to Templates</Link>
        </article>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Knowledge Template Engine</p>
        <h1 style={titleStyle}>Research Mission 001</h1>
        <p style={mutedStyle}>{workspace.missionTitle}</p>
      </section>

      <section style={metricsStyle}>
        <Metric label="Template Count" value={String(workspace.templateCount)} />
        <Metric label="Coverage Score" value={String(workspace.coverageScore)} />
        <Metric label="Adoption Score" value={String(workspace.adoptionScore)} />
        <Metric label="Reuse Score" value={String(workspace.reuseScore)} />
        <Metric label="Health Score" value={String(workspace.healthScore)} />
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Templates</h2>
          <ul style={listStyle}>
            {workspace.templates.map((item) => (
              <li key={item.slug} style={listItemStyle}>{item.title} ({item.category}) - {item.filePath}</li>
            ))}
          </ul>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Recommendations</h2>
          <ul style={listStyle}>
            {workspace.recommendations.map((item) => (
              <li key={item} style={listItemStyle}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section style={cardStyle}>
        <Link href="/templates" style={linkStyle}>Back to Templates</Link>
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
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }
