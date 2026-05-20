"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

type PulseData = {
  status: string
  metrics: {
    healthScore: number
    activeAgents: number
    newEvents: number
    highEvents: number
    criticalEvents: number
    queuedActions: number
    failedActions: number
    pendingMissions: number
    hotLeads: number
    forecastCount: number
    projectedRevenue: number
    invoicedRevenue: number
  }
  latest: {
    event: any
    forecast: any
    optimization: any
  }
}

export default function GlobalPulseBar() {
  const [data, setData] = useState<PulseData | null>(null)
  const [loading, setLoading] = useState(false)

  async function loadPulse() {
    setLoading(true)

    try {
      const response = await fetch("/api/global-pulse", {
        cache: "no-store",
      })

      const result = await response.json()

      if (result.ok) {
        setData(result)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPulse()

    const timer = setInterval(() => {
      loadPulse()
    }, 10000)

    return () => clearInterval(timer)
  }, [])

  const status = data?.status || "loading"

  return (
    <section style={barStyle}>
      <div style={leftStyle}>
        <div style={pulseDot(status)} />

        <div>
          <p style={eyebrowStyle}>Global AI System Pulse</p>
          <strong style={{ textTransform: "capitalize" }}>
            {loading && !data ? "Loading" : status}
          </strong>
        </div>
      </div>

      <div style={metricsStyle}>
        <Mini label="Health" value={data ? `${data.metrics.healthScore}%` : "..."} />
        <Mini label="Agents" value={data ? data.metrics.activeAgents : "..."} />
        <Mini label="Events" value={data ? data.metrics.newEvents : "..."} />
        <Mini label="Queued" value={data ? data.metrics.queuedActions : "..."} />
        <Mini label="Missions" value={data ? data.metrics.pendingMissions : "..."} />
        <Mini label="Hot Leads" value={data ? data.metrics.hotLeads : "..."} />
        <Mini
          label="Pipeline"
          value={
            data
              ? `AUD ${Math.round(data.metrics.projectedRevenue).toLocaleString("en-AU")}`
              : "..."
          }
        />
      </div>

      <div style={actionsStyle}>
        <Link href="/admin/operational-events" style={buttonStyle}>
          Alerts
        </Link>

        <Link href="/admin/optimization-engine" style={buttonStyle}>
          Optimize
        </Link>

        <Link href="/admin/autonomous-missions" style={buttonStyle}>
          Mission
        </Link>

        <Link href="/admin/predictive-intelligence" style={buttonStyle}>
          Forecast
        </Link>
      </div>
    </section>
  )
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={miniStyle}>
      <span style={miniLabel}>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function pulseDot(status: string): React.CSSProperties {
  const color =
    status === "critical"
      ? "#ef4444"
      : status === "warning"
        ? "#f59e0b"
        : status === "active"
          ? "#6366f1"
          : status === "stable"
            ? "#22c55e"
            : "#71717a"

  return {
    width: 14,
    height: 14,
    borderRadius: "999px",
    background: color,
    boxShadow: `0 0 18px ${color}`,
    flexShrink: 0,
  }
}

const barStyle: React.CSSProperties = {
  margin: "0 40px 18px",
  padding: "14px 16px",
  border: "1px solid #ddd",
  borderRadius: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  background: "#fff",
}

const leftStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
}

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 1.5,
  color: "#777",
}

const metricsStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
}

const miniStyle: React.CSSProperties = {
  background: "#f4f4f5",
  borderRadius: 12,
  padding: "8px 10px",
  minWidth: 80,
}

const miniLabel: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  color: "#71717a",
  textTransform: "uppercase",
  letterSpacing: 1,
}

const actionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
}

const buttonStyle: React.CSSProperties = {
  textDecoration: "none",
  color: "#fff",
  background: "#111",
  padding: "8px 12px",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: "bold",
}