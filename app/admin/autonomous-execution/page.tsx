"use client"

import { useEffect, useState } from "react"

type AutonomousAction = {
  id: string
  title: string
  description: string | null
  source: string
  status: string
  priority: string
  actionType: string
  createdAt: string
}

export default function AutonomousExecutionPage() {
  const [actions, setActions] = useState<AutonomousAction[]>([])
  const [loading, setLoading] = useState(false)

  async function loadActions() {
    const response = await fetch("/api/ai/autonomous-execution")
    const result = await response.json()

    if (result.ok) {
      setActions(result.actions)
    }
  }

  async function scanForActions() {
    setLoading(true)

    const response = await fetch("/api/ai/autonomous-execution", {
      method: "POST",
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Autonomous scan failed")
      return
    }

    alert(`Generated ${result.actions.length} proposed actions.`)
    loadActions()
  }

  async function runAction(actionId: string) {
    setLoading(true)

    const response = await fetch("/api/ai/autonomous-execution/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ actionId }),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Action execution failed")
      return
    }

    loadActions()
  }

  useEffect(() => {
    loadActions()
  }, [])

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Self-Directed Operations</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Autonomous Execution Engine
        </h1>

        <p style={{ color: "var(--hero-muted)", maxWidth: 880, lineHeight: 1.7 }}>
          Detect operational opportunities, propose safe next actions and
          execute approved internal actions across jobs, memory, CRM and system
          activity.
        </p>
      </section>

      <section style={toolbarStyle}>
        <button disabled={loading} onClick={scanForActions} style={buttonStyle}>
          {loading ? "Scanning..." : "Scan for Autonomous Actions"}
        </button>

        <button disabled={loading} onClick={loadActions} style={secondaryButton}>
          Refresh
        </button>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Autonomous Actions</h2>

        <div style={{ display: "grid", gap: 16 }}>
          {actions.map((action) => (
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
                <strong>Action Type:</strong> {action.actionType}
              </p>

              <p style={{ color: "var(--muted)" }}>
                Created: {new Date(action.createdAt).toLocaleString("en-AU")}
              </p>

              {["approved", "proposed"].includes(action.status) ? (
                <button
                  disabled={loading}
                  onClick={() => runAction(action.id)}
                  style={buttonStyle}
                >
                  Execute Action
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
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

const toolbarStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 24,
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