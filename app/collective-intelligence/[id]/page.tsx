import React from "react"
import { getMissionCollectiveIntelligence } from "../../../lib/gamma/collective-intelligence-reader"

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

export default async function CollectiveIntelligenceDetailPage({ params }: { params: { id: string } }) {
  const workspace = await getMissionCollectiveIntelligence(params.id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <h1>Collective intelligence not found</h1>
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
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Collective Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.collectiveScore}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Cross-Mission Learning</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.crossMissionLearning}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Knowledge Reuse</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.knowledgeReuse}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Adaptation Capacity</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.adaptationCapacity}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Coordination Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.coordinationScore}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Health Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.healthScore}</div>
        </div>
      </section>
    </main>
  )
}
