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
}

export default function GlobalPulseBar() {
  const [data, setData] = useState<PulseData | null>(null)

  async function loadPulse() {
    try {
      const response = await fetch("/api/global-pulse", {
        cache: "no-store",
      })

      const result = await response.json()

      if (result.ok) {
        setData(result)
      }
    } catch (error) {
      console.error(error)
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
          <strong>{status}</strong>
        </div>
      </div>

      <div style={metricsStyle}>
        <Mini label="Health" value={data?.metrics.healthScore ?? "..."} />
        <Mini label="Agents" value={data?.metrics.activeAgents ?? "..."} />
        <Mini label="Events" value={data?.metrics.newEvents ?? "..."} />
        <Mini label="Queued" value={data?.metrics.queuedActions ?? "..."} />
      </div>

      <div style={actionsStyle}>
        <Link href="/admin/operational-events" style={buttonStyle}>
          Alerts
        </Link>

        <Link href="/admin/optimization-engine" style={buttonStyle}>
          Optimize
        </Link>
      </div>
    </section>
  )
}

function Mini({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
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
          : "#22c55e"

  return {
    width: 14,
    height: 14,
    borderRadius: "999px",
    background: color,
  }
}

const barStyle: React.CSSProperties = {
  margin: "0 40px 18px",
  padding: "14px 16px",
  border: "1px solid var(--border)",
  borderRadius: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  background: "var(--card-background)",
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
  color: "var(--muted)",
}

const metricsStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
}

const miniStyle: React.CSSProperties = {
  background: "var(--card-background)",
  borderRadius: 12,
  padding: "8px 10px",
}

const miniLabel: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  color: "var(--muted)",
}

const actionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
}

const buttonStyle: React.CSSProperties = {
  textDecoration: "none",
  color: "var(--button-foreground)",
  background: "var(--hero-background)",
  padding: "8px 12px",
  borderRadius: 10,
  fontSize: 13,
}