import React from "react"
import { getSovereigntyRegistry } from "../../lib/gamma/sovereignty-reader"

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

export default async function SovereigntyPage() {
  const registry = await getSovereigntyRegistry()

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <h1>Sovereignty Engine</h1>
        <p>Ownership, control, and independence</p>
      </section>

      <section style={metricsStyle}>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Ownership Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.ownershipScore}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Control Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.controlScore}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Dependency Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.dependencyScore}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Resilience Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.resilienceScore}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Sovereignty Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.sovereigntyScore}</div>
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
              <span>Sovereignty: {mission.sovereigntyScore}</span>
              <span>Health: {mission.healthScore}</span>
            </div>
          </div>
        ))}
      </section>
    </main>
  )
}
