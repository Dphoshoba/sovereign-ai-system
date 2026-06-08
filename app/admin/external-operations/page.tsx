"use client"

import { useEffect, useState } from "react"
import {
  PageShell,
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  StatusBadge,
} from "@/components/executive-ui"

type Integration = {
  id: string
  name: string
  provider: string
  category: string
  status: string
  enabled: boolean
  lastError: string | null
}

type OperationLog = {
  id: string
  integration: string
  operationType: string
  status: string
  title: string
  error: string | null
  createdAt: string
}

export default function ExternalOperationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [logs, setLogs] = useState<OperationLog[]>([])
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const res = await fetch("/api/external-operations")
    const result = await res.json()

    if (result.ok) {
      setIntegrations(result.integrations)
      setLogs(result.logs)
    }
  }

  async function checkIntegrations() {
    setLoading(true)

    const res = await fetch("/api/external-operations/check", {
      method: "POST",
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Health check failed")
      return
    }

    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  const configured = integrations.filter((i) => i.status === "configured").length
  const enabled = integrations.filter((i) => i.enabled).length
  const failedLogs = logs.filter((l) => l.status === "failed").length

  return (
    <PageShell
      eyebrow="Real Infrastructure"
      title="External Operations Layer"
      description="Connect real providers for email, Stripe, calendar booking, webhooks and execution logs while preserving governance and operational visibility."
    >
      <ExecutiveGrid min={220}>
        <MetricCard label="Integrations" value={integrations.length} />
        <MetricCard label="Configured" value={configured} />
        <MetricCard label="Enabled" value={enabled} />
        <MetricCard label="Failed Ops" value={failedLogs} />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Integration Health" eyebrow="Provider status">
          <button disabled={loading} onClick={checkIntegrations} style={buttonStyle}>
            {loading ? "Checking..." : "Run Health Check"}
          </button>

          <div style={{ marginTop: 18 }}>
            <ExecutiveGrid min={260}>
              {integrations.map((item) => (
                <div key={item.id} style={cardStyle}>
                  <StatusBadge status={item.status} />
                  <h3>{item.name}</h3>
                  <p>
                    <strong>Provider:</strong> {item.provider}
                  </p>
                  <p>
                    <strong>Category:</strong> {item.category}
                  </p>
                  {item.lastError ? (
                    <p style={{ color: "#b00020" }}>{item.lastError}</p>
                  ) : null}
                </div>
              ))}
            </ExecutiveGrid>
          </div>
        </ExecutiveCard>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="External Operation Logs" eyebrow="Execution trail">
          <div style={{ display: "grid", gap: 12 }}>
            {logs.map((log) => (
              <div key={log.id} style={cardStyle}>
                <StatusBadge status={log.status} />
                <h3>{log.title}</h3>
                <p>
                  {log.integration} · {log.operationType}
                </p>
                {log.error ? <p style={{ color: "#b00020" }}>{log.error}</p> : null}
                <p style={{ color: "var(--muted)", fontSize: 12 }}>
                  {new Date(log.createdAt).toLocaleString("en-AU")}
                </p>
              </div>
            ))}
          </div>
        </ExecutiveCard>
      </div>
    </PageShell>
  )
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 12,
  border: "none",
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  cursor: "pointer",
  fontWeight: "bold",
}

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 18,
  background: "var(--card-background)",
}