import Link from "next/link"
import { getAgencyWorkspace } from "../../../lib/gamma/agency-reader"

export default async function AgencyWorkspaceMissionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getAgencyWorkspace(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <h1 style={titleStyle}>Agency Workspace Not Found</h1>
          <p style={mutedStyle}>The requested agency workspace "{id}" does not exist.</p>
        </section>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>Agency Workspace</p>
          <h1 style={titleStyle}>{workspace.name}</h1>
          <p style={subtitleStyle}>{workspace.relatedMission}</p>
        </div>
        <div style={pillColumnStyle}>
          <Pill label="Stage" value={workspace.pipelineStage} />
          <Pill label="Status" value={workspace.projectStatus} />
          <Pill label="Progress" value={`${workspace.progress}%`} />
        </div>
      </section>

      <section style={grid4Style}>
        <MetricCard label="Proposal Count" value={String(workspace.proposalCount)} detail="Client proposals" />
        <MetricCard label="Offer Count" value={String(workspace.offerCount)} detail="Offer templates" />
        <MetricCard label="Workshop Count" value={String(workspace.workshopCount)} detail="Workshop plans" />
        <MetricCard label="Package Count" value={String(workspace.packageCount)} detail="Service packages" />
      </section>

      <section style={grid2Style}>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Client Proposals</h2>
          <List items={workspace.clientProposals} />
        </article>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Service Packages</h2>
          <List items={workspace.servicePackages} />
        </article>
      </section>

      <section style={grid2Style}>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Discovery Documents</h2>
          <List items={workspace.discoveryDocuments} />
        </article>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Workshop Plans</h2>
          <List items={workspace.workshopPlans} />
        </article>
      </section>

      <section style={grid2Style}>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Consulting Deliverables</h2>
          <List items={workspace.consultingDeliverables} />
        </article>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Presentation Outlines</h2>
          <List items={workspace.presentationOutlines} />
        </article>
      </section>

      <section style={grid2Style}>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Case Studies and Offer Templates</h2>
          <List items={[...workspace.caseStudies, ...workspace.offerTemplates]} />
        </article>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Roadmaps</h2>
          <List items={workspace.roadmaps} />
        </article>
      </section>

      <section style={grid2Style}>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Cross References</h2>
          <List items={workspace.crossReferences.slice(0, 12)} />
        </article>
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Timeline</h2>
          <div style={stackStyle}>
            {workspace.timeline.map((item) => (
              <div key={`${item.date}-${item.event}`} style={timelineRowStyle}>
                <span style={timelineDateStyle}>{item.date}</span>
                <span style={timelineEventStyle}>{item.event}</span>
                <Badge value={item.status} />
              </div>
            ))}
          </div>
        </article>
      </section>

      <section style={footerStyle}>
        <Link href="/agency-workspace" style={linkStyle}>
          Back to Agency Workspace
        </Link>
      </section>
    </main>
  )
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article style={metricCardStyle}>
      <p style={metricLabelStyle}>{label}</p>
      <p style={metricValueStyle}>{value}</p>
      <p style={mutedStyle}>{detail}</p>
    </article>
  )
}

function List({ items }: { items: string[] }) {
  return (
    <ul style={listStyle}>
      {items.map((item) => (
        <li key={item} style={listItemStyle}>
          {item}
        </li>
      ))}
    </ul>
  )
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span style={pillStyle}>
      <span style={pillLabelStyle}>{label}</span>
      <span style={pillValueStyle}>{value}</span>
    </span>
  )
}

function Badge({ value }: { value: string }) {
  return <span style={badgeStyle}>{value}</span>
}

const pageStyle: React.CSSProperties = {
  padding: 40,
  maxWidth: 1400,
  margin: "0 auto",
  fontFamily: "Arial, sans-serif",
  background: "var(--background)",
  color: "var(--foreground)",
}

const headerStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  background: "var(--card-background)",
  borderRadius: 8,
  padding: 28,
  marginBottom: 24,
  display: "flex",
  justifyContent: "space-between",
  gap: 24,
}

const eyebrowStyle: React.CSSProperties = { margin: 0, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)" }
const titleStyle: React.CSSProperties = { margin: "8px 0", fontSize: 36 }
const subtitleStyle: React.CSSProperties = { margin: 0, color: "var(--muted)", maxWidth: 760, lineHeight: 1.6 }
const cardStyle: React.CSSProperties = { border: "1px solid var(--border)", background: "var(--card-background)", borderRadius: 8, padding: 16 }
const cardTitleStyle: React.CSSProperties = { margin: 0, fontSize: 16 }
const mutedStyle: React.CSSProperties = { margin: "6px 0 0", color: "var(--muted)", lineHeight: 1.5 }
const grid4Style: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }
const grid2Style: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12, marginBottom: 24 }
const metricCardStyle: React.CSSProperties = { border: "1px solid var(--border)", background: "var(--card-background)", borderRadius: 8, padding: 16 }
const metricLabelStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)" }
const metricValueStyle: React.CSSProperties = { margin: "6px 0 0", fontSize: 20, fontWeight: 700 }
const listStyle: React.CSSProperties = { margin: "8px 0 0", paddingLeft: 18 }
const listItemStyle: React.CSSProperties = { marginBottom: 8 }
const stackStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8 }
const timelineRowStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "110px 1fr auto", gap: 12, alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 8 }
const timelineDateStyle: React.CSSProperties = { fontSize: 12, color: "var(--muted)" }
const timelineEventStyle: React.CSSProperties = { fontSize: 14 }
const footerStyle: React.CSSProperties = { marginTop: 24 }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }
const pillColumnStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }
const pillStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 999, padding: "6px 10px", display: "inline-flex", gap: 8, alignItems: "center", background: "var(--card-background)" }
const pillLabelStyle: React.CSSProperties = { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--muted)" }
const pillValueStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600 }
const badgeStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 999, padding: "4px 8px", fontSize: 11, color: "#16a34a" }
