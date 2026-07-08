import Link from "next/link"
import { getMissionMaturity } from "../../../lib/gamma/maturity-reader"

export const dynamic = "force-dynamic"

export default async function MissionMaturityPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspace = await getMissionMaturity(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <article style={cardStyle}>
          <h1 style={titleStyle}>Maturity Not Found</h1>
          <p style={mutedStyle}>No maturity workspace exists for mission {id}.</p>
          <Link href="/maturity" style={linkStyle}>
            Back to Maturity
          </Link>
        </article>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Mission Maturity Engine</p>
        <h1 style={titleStyle}>Womanhood</h1>
        <p style={mutedStyle}>{workspace.missionTitle}</p>
        <p style={mutedStyle}>Research Mission 001</p>
      </section>

      <section style={metricsGridStyle}>
        <Metric label="Mission Score" value={String(workspace.missionScore)} />
        <Metric label="Research Score" value={String(workspace.researchScore)} />
        <Metric label="Creator Score" value={String(workspace.creatorScore)} />
        <Metric label="Ministry Score" value={String(workspace.ministryScore)} />
        <Metric label="Executive Score" value={String(workspace.executiveScore)} />
        <Metric label="Agency Score" value={String(workspace.agencyScore)} />
        <Metric label="Knowledge Score" value={String(workspace.knowledgeScore)} />
        <Metric label="Second Brain Score" value={String(workspace.secondBrainScore)} />
        <Metric label="Coverage" value={`${workspace.coverageScore}%`} />
        <Metric label="Readiness" value={`${workspace.readinessScore}%`} />
        <Metric label="Maturity" value={workspace.classification} />
        <Metric label="Health" value={`${workspace.healthScore}%`} />
        <Metric label="Reuse" value={`${workspace.reuseScore}%`} />
        <Metric label="Teaching" value={`${workspace.teachingScore}%`} />
        <Metric label="Commercial" value={`${workspace.commercialScore}%`} />
        <Metric label="Scalability" value={`${workspace.scalabilityScore}%`} />
        <Metric label="Confidence" value={`${workspace.confidenceScore}%`} />
        <Metric label="Production Ready" value={`${workspace.productionReadyPercentage}%`} />
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Workspace Rankings</h2>
          <div style={stackStyle}>
            {workspace.workspaceRankings.map((item) => (
              <div key={item.workspace} style={rowStyle}>
                <strong>{item.workspace}</strong>
                <span style={mutedStyle}>Score: {item.score}</span>
                <span style={mutedStyle}>Status: {item.status}</span>
              </div>
            ))}
          </div>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Weakest Areas</h2>
          <p style={mutedStyle}>Strongest workspace: {workspace.strongestWorkspace.workspace} ({workspace.strongestWorkspace.score})</p>
          <p style={mutedStyle}>Weakest workspace: {workspace.weakestWorkspace.workspace} ({workspace.weakestWorkspace.score})</p>
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
          <h2 style={sectionTitleStyle}>Highest Performing Assets</h2>
          <div style={stackStyle}>
            {workspace.highestPerformingAssets.map((asset) => (
              <div key={`${asset.workspace}-${asset.title}`} style={rowStyle}>
                <strong>{asset.title}</strong>
                <span style={mutedStyle}>{asset.workspace}</span>
                <span style={mutedStyle}>Score: {asset.score}</span>
                <p style={mutedStyle}>{asset.rationale}</p>
              </div>
            ))}
          </div>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Reuse Potential</h2>
          <ul style={listStyle}>
            {workspace.reusePotential.map((item) => (
              <li key={item} style={listItemStyle}>
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Commercial Potential</h2>
          <ul style={listStyle}>
            {workspace.commercialPotential.map((item) => (
              <li key={item} style={listItemStyle}>
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Teaching Potential</h2>
          <ul style={listStyle}>
            {workspace.teachingPotential.map((item) => (
              <li key={item} style={listItemStyle}>
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section style={twoColStyle}>
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Readiness Timeline</h2>
          <div style={stackStyle}>
            {workspace.readinessTimeline.map((item) => (
              <div key={`${item.date}-${item.event}`} style={timelineRowStyle}>
                <span style={mutedStyle}>{item.date}</span>
                <span>{item.event}</span>
                <span style={mutedStyle}>{item.status}</span>
              </div>
            ))}
          </div>
        </article>

        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>Mission Evolution</h2>
          <ul style={listStyle}>
            {workspace.missionEvolution.map((item) => (
              <li key={item} style={listItemStyle}>
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section style={cardStyle}>
        <p style={mutedStyle}>Scaling ready: {workspace.scalingReady ? "yes" : "no"}</p>
        <p style={mutedStyle}>Teaching ready: {workspace.teachingReady ? "yes" : "no"}</p>
        <p style={mutedStyle}>Commercialization ready: {workspace.commercializationReady ? "yes" : "no"}</p>
        <Link href="/maturity" style={linkStyle}>
          Back to Maturity
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
