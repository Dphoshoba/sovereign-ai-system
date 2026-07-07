import React from "react"
import { getMissionSovereignCore } from "../../../lib/gamma/sovereign-core-reader"

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

export default async function SovereignCoreDetailPage({ params }: { params: { id: string } }) {
  const workspace = await getMissionSovereignCore(params.id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <h1>Sovereign core not found</h1>
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
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Sovereign Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.sovereignScore}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Ecosystem Strength</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.ecosystemStrength}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Network Strength</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.networkStrength}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Mission Capital</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.missionCapital}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Knowledge Capital</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.knowledgeCapital}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Resilience Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.resilienceScore}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Autonomy Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.autonomyScore}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Health Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.healthScore}</div>
        </div>
      </section>
    </main>
  )
}
