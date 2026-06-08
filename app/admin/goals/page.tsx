"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"

type QuarterlyGoal = {
  id: string
  title: string
  description: string | null
  quarter: string
  year: number
  category: string | null
  status: string
  targetValue: number | null
  currentValue: number | null
  progress: number
  owner: string | null
  createdAt: string
}

type PerformanceScorecard = {
  completionRate: number
  rating: "Excellent" | "Good" | "Needs Attention"
  totalGoals: number
  completedGoals: number
  initiativeCompletionRate?: number
  initiativeHealth?: "Excellent" | "Good" | "Needs Attention"
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<QuarterlyGoal[]>([])
  const [scorecard, setScorecard] = useState<PerformanceScorecard | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadGoals = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await fetch("/api/executive/goals", {
      cache: "no-store",
    })
    const result = await response.json()

    setLoading(false)

    if (!result.ok) {
      setError(result.error || "Failed to load quarterly goals")
      return
    }

    setGoals(result.goals)
    setScorecard(result.scorecard)
  }, [])

  useEffect(() => {
    loadGoals()
  }, [loadGoals])

  const summary = useMemo(() => {
    return {
      total: goals.length,
      active: goals.filter((goal) => goal.status === "active").length,
      atRisk: goals.filter((goal) => goal.status === "at-risk").length,
      completed: goals.filter((goal) => goal.status === "completed").length,
    }
  }, [goals])

  async function generateGoals() {
    setGenerating(true)
    setMessage(null)
    setError(null)

    const response = await fetch("/api/executive/goals/generate", {
      method: "POST",
    })
    const result = await response.json()

    setGenerating(false)

    if (!result.ok) {
      setError(result.error || "Failed to generate quarterly goals")
      return
    }

    setMessage(
      `Created ${result.created} goal${result.created === 1 ? "" : "s"} for ${result.quarter} ${result.year}${result.skipped > 0 ? ` (${result.skipped} duplicates skipped)` : ""}.`
    )

    await loadGoals()
  }

  async function updateGoal(
    id: string,
    patch: { status?: string; progress?: number; currentValue?: number }
  ) {
    setError(null)

    const response = await fetch("/api/executive/goals", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, ...patch }),
    })
    const result = await response.json()

    if (!result.ok) {
      setError(result.error || "Failed to update goal")
      return
    }

    await loadGoals()
  }

  function scorecardColor(rating: PerformanceScorecard["rating"]) {
    if (rating === "Excellent") {
      return "#15803d"
    }

    if (rating === "Good") {
      return "var(--foreground)"
    }

    return "#b91c1c"
  }

  function formatValue(value: number | null) {
    if (value === null) {
      return "Not set"
    }

    return value.toLocaleString("en-AU")
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Quarterly Goals</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Quarterly goals and scorecard generated from strategic plan, forecast,
          and execution data.
        </p>
        <div style={actionRowStyle}>
          <button
            type="button"
            disabled={generating}
            onClick={generateGoals}
            style={primaryButtonStyle}
          >
            {generating ? "Generating..." : "Generate Goals"}
          </button>
          <Link href="/admin/execution" style={secondaryLinkStyle}>
            Execution Engine
          </Link>
          <Link href="/admin/initiative-performance" style={secondaryLinkStyle}>
            Initiative Performance
          </Link>
          <Link href="/admin/planning-cycles" style={secondaryLinkStyle}>
            Planning Cycles
          </Link>
          <Link href="/admin/strategic-plan" style={secondaryLinkStyle}>
            Strategic Plan
          </Link>
          <Link href="/admin/operations" style={secondaryLinkStyle}>
            Operations Center
          </Link>
        </div>
      </section>

      {message && <p style={successMessageStyle}>{message}</p>}
      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}

      {loading && <p style={{ marginTop: 28 }}>Loading quarterly goals...</p>}

      {!loading && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Total Goals</p>
              <h2>{summary.total}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Active Goals</p>
              <h2>{summary.active}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>At Risk Goals</p>
              <h2>{summary.atRisk}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Completed Goals</p>
              <h2>{summary.completed}</h2>
            </div>
          </section>

          {scorecard && (
            <section style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Performance Scorecard</h2>
              <p style={{ margin: "0 0 8px" }}>
                <strong>Goal Completion Rate:</strong> {scorecard.completionRate}
                %
              </p>
              <p style={{ margin: "0 0 8px" }}>
                <strong>Completed:</strong> {scorecard.completedGoals} of{" "}
                {scorecard.totalGoals}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Rating:</strong>{" "}
                <span style={{ color: scorecardColor(scorecard.rating) }}>
                  {scorecard.rating}
                </span>{" "}
                {scorecard.rating === "Excellent" && "(≥ 80%)"}
                {scorecard.rating === "Good" && "(≥ 60%)"}
                {scorecard.rating === "Needs Attention" && "(< 60%)"}
              </p>
            </section>
          )}

          {scorecard &&
            scorecard.initiativeCompletionRate !== undefined &&
            scorecard.initiativeHealth && (
              <section style={panelStyle}>
                <h2 style={{ marginTop: 0 }}>Initiative Performance</h2>
                <p style={{ margin: "0 0 8px" }}>
                  <strong>Initiative Completion Rate:</strong>{" "}
                  {scorecard.initiativeCompletionRate}%
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Initiative Health:</strong>{" "}
                  <span
                    style={{ color: scorecardColor(scorecard.initiativeHealth) }}
                  >
                    {scorecard.initiativeHealth}
                  </span>{" "}
                  {scorecard.initiativeHealth === "Excellent" && "(≥ 80%)"}
                  {scorecard.initiativeHealth === "Good" && "(≥ 60%)"}
                  {scorecard.initiativeHealth === "Needs Attention" &&
                    "(< 60%)"}
                </p>
              </section>
            )}

          <section style={{ marginTop: 28 }}>
            <h2>Goal Table</h2>

            {goals.length === 0 ? (
              <p style={mutedText}>
                No quarterly goals yet. Generate goals from the strategic plan to
                begin tracking.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Title</th>
                      <th style={thStyle}>Quarter</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Progress</th>
                      <th style={thStyle}>Target Value</th>
                      <th style={thStyle}>Current Value</th>
                      <th style={thStyle}>Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goals.map((goal) => (
                      <tr key={goal.id}>
                        <td style={tdStyle}>
                          <strong>{goal.title}</strong>
                          {goal.description && (
                            <p style={descriptionStyle}>{goal.description}</p>
                          )}
                        </td>
                        <td style={tdStyle}>
                          {goal.quarter} {goal.year}
                        </td>
                        <td style={tdStyle}>{goal.status}</td>
                        <td style={tdStyle}>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={goal.progress}
                            onChange={(event) =>
                              updateGoal(goal.id, {
                                progress: Number(event.target.value),
                              })
                            }
                            style={{ width: "100%" }}
                          />
                          <span>{goal.progress}%</span>
                        </td>
                        <td style={tdStyle}>{formatValue(goal.targetValue)}</td>
                        <td style={tdStyle}>
                          <input
                            type="number"
                            value={goal.currentValue ?? 0}
                            onChange={(event) =>
                              updateGoal(goal.id, {
                                currentValue: Number(event.target.value),
                              })
                            }
                            style={{ width: "100%" }}
                          />
                        </td>
                        <td style={tdStyle}>
                          <div style={controlRowStyle}>
                            <button
                              type="button"
                              style={controlButtonStyle}
                              onClick={() =>
                                updateGoal(goal.id, { status: "active" })
                              }
                            >
                              Mark Active
                            </button>
                            <button
                              type="button"
                              style={controlButtonStyle}
                              onClick={() =>
                                updateGoal(goal.id, { status: "at-risk" })
                              }
                            >
                              Mark At Risk
                            </button>
                            <button
                              type="button"
                              style={controlButtonStyle}
                              onClick={() =>
                                updateGoal(goal.id, {
                                  status: "completed",
                                  progress: 100,
                                })
                              }
                            >
                              Mark Completed
                            </button>
                          </div>
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

const descriptionStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "var(--muted)",
  lineHeight: 1.5,
  fontSize: 14,
}

const controlRowStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
}

const controlButtonStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--card-background)",
  cursor: "pointer",
  fontSize: 13,
}
