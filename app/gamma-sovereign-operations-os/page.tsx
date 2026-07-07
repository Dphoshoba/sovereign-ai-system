import React from "react"
import { getGammaSovereignOperationsOSRegistry } from "../../lib/gamma/gamma-sovereign-operations-os-reader"

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

export default async function GammaSovereignOperationsOSPage() {
  const registry = await getGammaSovereignOperationsOSRegistry()

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <h1>Gamma Sovereign Operations OS</h1>
        <p>Unified command and control for 12 autonomous systems</p>
      </section>

      <section style={metricsStyle}>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Operations Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.operationsScore}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>System Integrity</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.systemIntegrity}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Operational Excellence</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.operationalExcellence}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Command Chain</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.commandChain}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Execution Capacity</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.executionCapacity}</div>
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
              <span>Operations: {mission.operationsScore}</span>
              <span>Health: {mission.healthScore}</span>
            </div>
          </div>
        ))}
      </section>
    </main>
  )
}
