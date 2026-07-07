import React from "react"
import { getMissionStrategicTiming } from "../../../lib/gamma/strategic-timing-reader"

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

export default async function StrategicTimingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const workspace = await getMissionStrategicTiming(id)

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
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Timing Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.timingScore}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Market Readiness</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.marketReadiness}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Execution Window</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.executionWindow}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Momentum</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.momentum}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Seasonality</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.seasonality}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Coordination</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.coordination}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Predictability</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.predictability}</div>
        </div>
        <div style={metricBoxStyle}>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>Health Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{workspace.healthScore}</div>
        </div>
      </section>
    </main>
  )
}
