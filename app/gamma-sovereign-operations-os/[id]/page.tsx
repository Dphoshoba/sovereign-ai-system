import React from "react"
import { getMissionGammaSovereignOperationsOS } from "../../../lib/gamma/gamma-sovereign-operations-os-reader"

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

export default async function GammaSovereignOperationsOSDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const workspace = await getMissionGammaSovereignOperationsOS(id)

  if (!workspace) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <h1>Not Found</h1>
          <p>Mission workspace not found</p>
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
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Operations Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.operationsScore}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>System Integrity</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.systemIntegrity}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Operational Excellence</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.operationalExcellence}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Command Chain</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.commandChain}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Execution Capacity</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.executionCapacity}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Health Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.healthScore}</div>
        </div>
      </section>
    </main>
  )
}
