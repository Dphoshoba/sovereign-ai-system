import React from "react"
import { getMissionCivilizationIntelligence } from "../../../lib/gamma/civilization-intelligence-reader"

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

export default async function CivilizationIntelligenceDetailPage({ params }: { params: { id: string } }) {
  const workspace = await getMissionCivilizationIntelligence(params.id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <h1>Civilization intelligence not found</h1>
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
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Civilization Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.civilizationScore}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Cultural Maturity</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.culturalMaturity}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>System Complexity</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.systemComplexity}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Resilience Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.resilienceScore}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Knowledge Capital</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.knowledgeCapital}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Symbolic Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.symbolicScore}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Evolution Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.evolutionScore}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Health Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.healthScore}</div>
        </div>
      </section>
    </main>
  )
}
