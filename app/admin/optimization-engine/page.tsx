"use client"

import { useEffect, useState } from "react"
import {
  PageShell,
  MetricCard,
  ExecutiveGrid,
  ExecutiveCard,
} from "@/components/executive-ui"

type OptimizationRun = {
  id: string
  title: string
  status: string
  summary: string | null
  healthScore: number
  findings: any
  createdAt: string
}

type OptimizationAction = {
  id: string
  runId: string | null
  title: string
  description: string | null
  actionType: string
  targetSystem: string
  priority: string
  status: string
  riskLevel: string
  payload: any
  result: any
  error: string | null
  createdAt: string
}

export default function OptimizationEnginePage() {
  const [runs, setRuns] = useState<OptimizationRun[]>([])
  const [actions, setActions] = useState<OptimizationAction[]>([])
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const response = await fetch("/api/optimization-engine")
    const result = await response.json()

    if (result.ok) {
      setRuns(result.runs)
      setActions(result.actions)
    }
  }

  async function runOptimization() {
    setLoading(true)

    const response = await fetch("/api/optimization-engine", {
      method: "POST",
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Optimization run failed")
      return
    }

    await loadData()
  }

  async function runAction(actionId: string) {
    setLoading(true)

    const response = await fetch("/api/optimization-engine/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ actionId }),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Optimization action failed")
      return
    }

    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  const latestRun = runs[0]
  const proposedActions = actions.filter((action) => action.status === "proposed")
  const completedActions = actions.filter((action) => action.status === "completed")

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Self-Healing Systems</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Autonomous Optimization Engine
        </h1>

        <p style={{ color: "#ddd", maxWidth: 880, lineHeight: 1.7 }}>
          Detect operational friction, stalled loops, failed patterns and
          optimization opportunities across the AI organization.
        </p>
      </section>

      <section style={metricsGrid}>
        <Metric
          label="System Health"
          value={latestRun ? `${latestRun.healthScore}/100` : "N/A"}
        />
        <Metric label="Optimization Runs" value={runs.length.toString()} />
        <Metric label="Proposed Actions" value={proposedActions.length.toString()} />
        <Metric label="Completed Actions" value={completedActions.length.toString()} />
      </section>

      <section style={toolbarStyle}>
        <button disabled={loading} onClick={runOptimization} style={buttonStyle}>
          {loading ? "Optimizing..." : "Run Optimization Scan"}
        </button>

        <button disabled={loading} onClick={loadData} style={secondaryButton}>
          Refresh
        </button>
      </section>

      {latestRun ? (
        <section style={panelStyle}>
          <p style={metaStyle}>{latestRun.status}</p>
          <h2>{latestRun.title}</h2>
          <p style={{ lineHeight: 1.7 }}>{latestRun.summary}</p>

          {latestRun.findings ? (
            <div style={gridTwo}>
              <FindingList title="Bottlenecks" items={latestRun.findings.bottlenecks} />
              <FindingList title="Failures" items={latestRun.findings.failures} />
              <FindingList title="Stalled Loops" items={latestRun.findings.stalledLoops} />
              <FindingList
                title="Optimization Opportunities"
                items={latestRun.findings.optimizationOpportunities}
              />
            </div>
          ) : null}
        </section>
      ) : null}

      <section style={{ marginTop: 34 }}>
        <h2>Self-Healing Actions</h2>

        <div style={{ display: "grid", gap: 16 }}>
          {actions.map((action) => (
            <article key={action.id} style={cardStyle}>
              <p style={metaStyle}>
                {action.priority} · {action.riskLevel} · {action.status} ·{" "}
                {action.targetSystem}
              </p>

              <h3>{action.title}</h3>

              {action.description ? (
                <p style={{ color: "#555", lineHeight: 1.7 }}>
                  {action.description}
                </p>
              ) : null}

              <p>
                <strong>Action Type:</strong> {action.actionType}
              </p>

              {action.error ? (
                <p style={{ color: "#b00020" }}>
                  <strong>Error:</strong> {action.error}
                </p>
              ) : null}

              {action.result ? (
                <div style={summaryBox}>
                  <strong>Result</strong>
                  <pre style={{ whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(action.result, null, 2)}
                  </pre>
                </div>
              ) : null}

              {["proposed", "approved"].includes(action.status) ? (
                <button
                  disabled={loading}
                  onClick={() => runAction(action.id)}
                  style={buttonStyle}
                >
                  Run Self-Healing Action
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 34 }}>
        <h2>Optimization History</h2>

        <div style={{ display: "grid", gap: 16 }}>
          {runs.map((run) => (
            <article key={run.id} style={cardStyle}>
              <p style={metaStyle}>
                Health {run.healthScore}/100 · {run.status}
              </p>
              <h3>{run.title}</h3>
              <p>{run.summary}</p>
              <p style={{ color: "#777" }}>
                {new Date(run.createdAt).toLocaleString("en-AU")}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

function FindingList({ title, items }: { title: string; items?: string[] }) {
  return (
    <div style={summaryBox}>
      <strong>{title}</strong>
      <ul style={{ lineHeight: 1.8, paddingLeft: 20 }}>
        {(items || []).map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
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
  background: "#111",
  color: "#fff",
  borderRadius: 24,
  padding: 34,
}

const eyebrowStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "#aaa",
  margin: 0,
}

const metricsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
  marginTop: 28,
}

const metricCard: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 24,
}

const toolbarStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 28,
  marginBottom: 28,
}

const panelStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 24,
}

const gridTwo: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
  marginTop: 20,
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
}

const secondaryButton: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "1px solid #111",
  background: "#fff",
  color: "#111",
  cursor: "pointer",
  fontWeight: "bold",
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 24,
}

const summaryBox: React.CSSProperties = {
  background: "#f5f5f5",
  borderRadius: 12,
  padding: 16,
  marginTop: 12,
  marginBottom: 12,
}

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "#777",
  fontSize: 13,
  margin: 0,
}