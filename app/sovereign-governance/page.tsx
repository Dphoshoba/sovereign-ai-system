import React from "react"
import { getSovereignGovernanceRegistry } from "../../lib/gamma/sovereign-governance-reader"

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

export default async function SovereignGovernancePage() {
  const registry = await getSovereignGovernanceRegistry()

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <h1>Sovereign Governance Engine</h1>
        <p>Decentralized decision-making and transparent accountability</p>
      </section>

      <section style={metricsStyle}>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Governance Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.governanceScore}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Decision Quality</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.decisionQuality}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Transparency Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.transparencyScore}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Accountability Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.accountabilityScore}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Participation Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.participationScore}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Legitimacy</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.legitimacy}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Effectiveness Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.effectivenessScore}</div>
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
              <span>Score: {mission.governanceScore}</span>
              <span>Health: {mission.healthScore}</span>
            </div>
          </div>
        ))}
      </section>
    </main>
  )
}
