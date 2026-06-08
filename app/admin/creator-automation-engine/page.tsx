"use client"

import { useEffect, useMemo, useState } from "react"

type AutomationAction = {
  id: string
  source: string
  title: string
  description: string | null
  actionType: string
  status: string
  priority: string
  leadId: string | null
  auditId: string | null
  createdAt: string
}

export default function CreatorAutomationEnginePage() {
  const [actions, setActions] = useState<AutomationAction[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState("pending")

  async function loadActions() {
    const response = await fetch("/api/creator-automation-engine")
    const result = await response.json()

    if (result.ok) {
      setActions(result.actions)
    }
  }

  async function scanActions() {
    setLoading(true)

    const response = await fetch("/api/creator-automation-engine", {
      method: "POST",
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to scan automation opportunities")
      return
    }

    await loadActions()
  }

  async function runAction(actionId: string) {
    setLoading(true)

    const response = await fetch("/api/creator-automation-engine/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ actionId }),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to run action")
      return
    }

    await loadActions()
  }

  useEffect(() => {
    loadActions()
  }, [])

  const filteredActions = useMemo(() => {
    if (statusFilter === "all") return actions
    return actions.filter((action) => action.status === statusFilter)
  }, [actions, statusFilter])

  const pending = actions.filter((action) => action.status === "pending").length
  const completed = actions.filter((action) => action.status === "completed").length
  const highPriority = actions.filter((action) => action.priority === "high").length

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Autonomous Creator Operations</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Workflow Automation Engine
        </h1>

        <p style={{ color: "var(--hero-muted)", maxWidth: 860, lineHeight: 1.7 }}>
          Scan leads, nurturing activity and audit requests to recommend and run
          safe creator workflow automations.
        </p>
      </section>

      <section style={metricsGrid}>
        <Metric label="Pending Actions" value={pending.toString()} />
        <Metric label="Completed Actions" value={completed.toString()} />
        <Metric label="High Priority" value={highPriority.toString()} />
      </section>

      <section style={toolbarStyle}>
        <button disabled={loading} onClick={scanActions} style={buttonStyle}>
          {loading ? "Scanning..." : "Scan Automation Opportunities"}
        </button>

        <button disabled={loading} onClick={loadActions} style={secondaryButton}>
          Refresh
        </button>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={inputStyle}
        >
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="approved">Approved</option>
          <option value="failed">Failed</option>
          <option value="all">All</option>
        </select>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Automation Actions</h2>

        <div style={{ display: "grid", gap: 16 }}>
          {filteredActions.map((action) => (
            <article key={action.id} style={cardStyle}>
              <p style={metaStyle}>
                {action.priority} · {action.status} · {action.source}
              </p>

              <h3>{action.title}</h3>

              {action.description ? (
                <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
                  {action.description}
                </p>
              ) : null}

              <p>
                <strong>Action:</strong> {action.actionType}
              </p>

              {action.leadId ? (
                <p>
                  <strong>Lead:</strong> {action.leadId}
                </p>
              ) : null}

              {action.auditId ? (
                <p>
                  <strong>Audit:</strong> {action.auditId}
                </p>
              ) : null}

              <p style={{ color: "var(--muted)" }}>
                Created: {new Date(action.createdAt).toLocaleString("en-AU")}
              </p>

              {["pending", "approved"].includes(action.status) ? (
                <button
                  disabled={loading}
                  onClick={() => runAction(action.id)}
                  style={buttonStyle}
                >
                  Run Action
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={metricCard}>
      <p style={metaStyle}>{label}</p>
      <h2>{value}</h2>
    </div>
  )
}

const heroStyle: React.CSSProperties = {
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  borderRadius: 24,
  padding: 34,
}

const eyebrowStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "var(--muted)",
  margin: 0,
}

const metricsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
  marginTop: 28,
}

const metricCard: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const toolbarStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto auto 1fr",
  gap: 12,
  marginTop: 28,
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 10,
  border: "1px solid var(--border)",
  fontSize: 15,
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  cursor: "pointer",
  fontWeight: "bold",
}

const secondaryButton: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "1px solid #111",
  background: "var(--card-background)",
  color: "var(--foreground)",
  cursor: "pointer",
  fontWeight: "bold",
}

const cardStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "var(--muted)",
  fontSize: 13,
  margin: 0,
}