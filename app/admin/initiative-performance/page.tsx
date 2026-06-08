"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"

type GoalAlignmentItem = {
  goalId: string
  goalTitle: string
  linkedInitiatives: number
  averageProgress: number
  status: "On Track" | "At Risk" | "Off Track"
}

type InitiativePerformance = {
  totalInitiatives: number
  activeInitiatives: number
  blockedInitiatives: number
  completedInitiatives: number
  completionRate: number
  initiativeHealth: "Excellent" | "Good" | "Needs Attention"
  goalAlignment: GoalAlignmentItem[]
}

export default function InitiativePerformancePage() {
  const [performance, setPerformance] = useState<InitiativePerformance | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadPerformance = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await fetch("/api/executive/initiative-performance", {
      cache: "no-store",
    })
    const result = await response.json()

    setLoading(false)

    if (!result.ok) {
      setError(result.error || "Failed to load initiative performance")
      return
    }

    setPerformance(result.performance)
  }, [])

  useEffect(() => {
    loadPerformance()
  }, [loadPerformance])

  async function syncGoals() {
    setSyncing(true)
    setMessage(null)
    setError(null)

    const response = await fetch("/api/executive/goals/sync", {
      method: "POST",
    })
    const result = await response.json()

    setSyncing(false)

    if (!result.ok) {
      setError(result.error || "Failed to sync goals")
      return
    }

    setMessage(
      `Synced ${result.updatedGoals} goal${result.updatedGoals === 1 ? "" : "s"} from ${result.updatedInitiatives} linked initiative${result.updatedInitiatives === 1 ? "" : "s"}.`
    )

    await loadPerformance()
  }

  function healthColor(rating: InitiativePerformance["initiativeHealth"]) {
    if (rating === "Excellent") {
      return "#15803d"
    }

    if (rating === "Good") {
      return "var(--foreground)"
    }

    return "#b91c1c"
  }

  function alignmentColor(status: GoalAlignmentItem["status"]) {
    if (status === "On Track") {
      return "#15803d"
    }

    if (status === "At Risk") {
      return "var(--foreground)"
    }

    return "#b91c1c"
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Initiative Performance
        </h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Track strategic initiative completion, health, and alignment with
          quarterly goals.
        </p>
        <div style={actionRowStyle}>
          <button
            type="button"
            disabled={syncing}
            onClick={syncGoals}
            style={primaryButtonStyle}
          >
            {syncing ? "Syncing..." : "Sync Goals"}
          </button>
          <Link href="/admin/execution" style={secondaryLinkStyle}>
            Execution Engine
          </Link>
          <Link href="/admin/goals" style={secondaryLinkStyle}>
            Quarterly Goals
          </Link>
          <Link href="/admin/operations" style={secondaryLinkStyle}>
            Operations Center
          </Link>
        </div>
      </section>

      {message && <p style={successMessageStyle}>{message}</p>}
      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}

      {loading && (
        <p style={{ marginTop: 28 }}>Loading initiative performance...</p>
      )}

      {!loading && performance && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Total Initiatives</p>
              <h2>{performance.totalInitiatives}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Active</p>
              <h2>{performance.activeInitiatives}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Blocked</p>
              <h2>{performance.blockedInitiatives}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Completed</p>
              <h2>{performance.completedInitiatives}</h2>
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Performance</h2>
            <p style={{ margin: "0 0 8px" }}>
              <strong>Completion Rate:</strong> {performance.completionRate}%
            </p>
            <p style={{ margin: 0 }}>
              <strong>Initiative Health:</strong>{" "}
              <span style={{ color: healthColor(performance.initiativeHealth) }}>
                {performance.initiativeHealth}
              </span>{" "}
              {performance.initiativeHealth === "Excellent" && "(≥ 80%)"}
              {performance.initiativeHealth === "Good" && "(≥ 60%)"}
              {performance.initiativeHealth === "Needs Attention" && "(< 60%)"}
            </p>
          </section>

          <section style={{ marginTop: 28 }}>
            <h2>Goal Alignment</h2>

            {performance.goalAlignment.length === 0 ? (
              <p style={mutedText}>
                No quarterly goals found. Generate goals and link initiatives
                from the execution engine.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Goal</th>
                      <th style={thStyle}>Linked Initiatives</th>
                      <th style={thStyle}>Average Progress</th>
                      <th style={thStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance.goalAlignment.map((item) => (
                      <tr key={item.goalId}>
                        <td style={tdStyle}>{item.goalTitle}</td>
                        <td style={tdStyle}>{item.linkedInitiatives}</td>
                        <td style={tdStyle}>{item.averageProgress}%</td>
                        <td style={tdStyle}>
                          <span style={{ color: alignmentColor(item.status) }}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
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

const actionRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 20,
}

const primaryButtonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  background: "var(--button-background)",
  color: "var(--button-foreground)",
  fontWeight: 700,
  cursor: "pointer",
}

const secondaryLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "12px 18px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  color: "var(--button-foreground)",
  fontWeight: 600,
  textDecoration: "none",
}

const successMessageStyle: React.CSSProperties = {
  marginTop: 28,
  color: "#15803d",
  fontWeight: 600,
}

const metricsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 16,
  marginTop: 28,
}

const metricCard: React.CSSProperties = {
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

const panelStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
  marginTop: 28,
}

const mutedText: React.CSSProperties = {
  color: "var(--muted)",
}

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: 16,
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 10px",
  borderBottom: "2px solid var(--border)",
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "var(--muted)",
}

const tdStyle: React.CSSProperties = {
  padding: "14px 10px",
  borderBottom: "1px solid var(--border)",
  verticalAlign: "top",
}
