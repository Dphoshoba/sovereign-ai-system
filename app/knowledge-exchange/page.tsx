import React from "react"
import { getKnowledgeExchangeRegistry } from "../../lib/gamma/knowledge-exchange-reader"

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

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "16px",
}

const missionCardStyle: React.CSSProperties = {
  padding: "16px",
  background: "rgba(255,255,255,0.03)",
  borderRadius: "6px",
  border: "1px solid rgba(255,255,255,0.1)",
}

export default async function KnowledgeExchangePage() {
  const registry = await getKnowledgeExchangeRegistry()

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <h1>Knowledge Exchange Engine</h1>
        <p>Cross-mission knowledge marketplace</p>
      </section>

      <section style={metricsStyle}>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Exchange Count</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.exchangeCount}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Knowledge Flow</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.knowledgeFlow}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Reuse Potential</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.reusePotential}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Cross Pollinization</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.crossPollinization}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Exchange Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.exchangeScore}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Health Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.healthScore}</div>
        </div>
      </section>

      <section style={gridStyle}>
        {registry.missions.map((mission) => (
          <div key={mission.mission} style={missionCardStyle}>
            <h3>{mission.missionTitle}</h3>
            <p style={{ fontSize: "12px", opacity: 0.6 }}>{mission.mission}</p>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
              <span>Exchanges: {mission.exchangeCount}</span>
              <span>Flow: {mission.knowledgeFlow}</span>
            </div>
          </div>
        ))}
      </section>
    </main>
  )
}
