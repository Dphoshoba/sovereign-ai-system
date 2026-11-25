import React from "react"
import { getFounderCommandCenterRegistry } from "../../lib/gamma/founder-command-center-reader"

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

export default async function FounderCommandCenterPage() {
  const registry = await getFounderCommandCenterRegistry()

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <h1>Founder Command Center</h1>
        <p>Visionary leadership and strategic command</p>
      </section>

      <section style={metricsStyle}>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Founder Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.founderScore}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Leadership Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.leadershipScore}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Visionary</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.visionary}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Decision Authority</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.decisionAuthority}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Strategic Directive</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.strategicDirective}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Resource Command</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.resourceCommand}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Vision Realization</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{registry.visionRealization}</div>
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
              <span>Founder: {mission.founderScore}</span>
              <span>Health: {mission.healthScore}</span>
            </div>
          </div>
        ))}
      </section>
    </main>
  )
}
