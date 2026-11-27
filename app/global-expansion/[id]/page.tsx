import React from "react"
import { getMissionGlobalExpansion } from "../../../lib/gamma/global-expansion-reader"

export const dynamic = "force-dynamic"

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: "24px",
  background: "#0a0e27",
  color: "#e0e0e0",
}

const cardStyle: React.CSSProperties = {
  marginBottom: "24px",
  padding: "20px",
  background: "rgba(255,255,255,0.05)",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
}

const metricsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "12px",
  marginBottom: "24px",
}

const metricBoxStyle: React.CSSProperties = {
  padding: "16px",
  background: "rgba(255,255,255,0.02)",
  borderRadius: "6px",
  border: "1px solid rgba(255,255,255,0.08)",
}

export default async function GlobalExpansionDetailPage({ params }: { params: { id: string } }) {
  const workspace = await getMissionGlobalExpansion(params.id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <h1>Global expansion not found</h1>
        </section>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <h1>{workspace.missionTitle}</h1>
        <p>{workspace.mission}</p>
      </section>

      <section style={metricsStyle}>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Expansion Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.expansionScore}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Market Penetration</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.marketPenetration}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Geographic Reach</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.geographicReach}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Cultural Adaptation</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.culturalAdaptation}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Partnership Strength</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.partnershipStrength}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Risk Resilience</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.riskResilience}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Scalability</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.scalability}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Health Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.healthScore}</div>
        </div>
      </section>
    </main>
  )
}
