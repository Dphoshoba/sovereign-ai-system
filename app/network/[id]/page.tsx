import React from "react"
import { getMissionNetwork } from "../../../lib/gamma/network-reader"

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

export default async function NetworkDetailPage({ params }: { params: { id: string } }) {
  const workspace = await getMissionNetwork(params.id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <h1>Network not found</h1>
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
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Network Count</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.networkCount}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Connected Missions</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.connectedMissions}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Connected Assets</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.connectedAssets}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Network Density</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.networkDensity}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Network Health</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.networkHealth}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Collaboration Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.collaborationScore}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Health Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.healthScore}</div>
        </div>
      </section>
    </main>
  )
}
