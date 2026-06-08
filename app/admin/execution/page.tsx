"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { ExecutionImpact } from "@/lib/executive/execution-impact"

type ExecutionInitiative = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  owner: string | null
  source: string | null
  progress: number
  actions: string[]
  createdAt: string
  updatedAt: string
}

export default function ExecutionPage() {
  const [initiatives, setInitiatives] = useState<ExecutionInitiative[]>([])
  const [executionImpact, setExecutionImpact] = useState<ExecutionImpact | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadExecution = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await fetch("/api/executive/execution", {
      cache: "no-store",
    })
    const result = await response.json()

    setLoading(false)

    if (!result.ok) {
      setError(result.error || "Failed to load execution initiatives")
      return
    }

    setInitiatives(result.initiatives)
    setExecutionImpact(result.executionImpact)
  }, [])

  useEffect(() => {
    loadExecution()
  }, [loadExecution])

  const summary = useMemo(() => {
    return {
      total: initiatives.length,
      active: initiatives.filter((item) => item.status === "active").length,
      blocked: initiatives.filter((item) => item.status === "blocked").length,
      completed: initiatives.filter((item) => item.status === "completed").length,
    }
  }, [initiatives])

  async function generateFromStrategicPlan() {
    setGenerating(true)
    setMessage(null)
    setError(null)

    const response = await fetch("/api/executive/execution/generate", {
      method: "POST",
    })
    const result = await response.json()

    setGenerating(false)

    if (!result.ok) {
      setError(result.error || "Failed to generate execution plan")
      return
    }

    setMessage(
      `Created ${result.createdCount} initiative${result.createdCount === 1 ? "" : "s"}${result.skippedCount > 0 ? ` (${result.skippedCount} skipped as duplicates)` : ""}.`
    )

    await loadExecution()
  }

  async function updateInitiative(
    id: string,
    patch: { status?: string; progress?: number }
  ) {
    setError(null)

    const response = await fetch("/api/executive/execution", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, ...patch }),
    })
    const result = await response.json()

    if (!result.ok) {
      setError(result.error || "Failed to update initiative")
      return
    }

    await loadExecution()
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString("en-AU", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Execution Engine</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Convert strategic initiatives into executable records aligned with
          delivery projects and tasks.
        </p>
        <div style={actionRowStyle}>
          <button
            type="button"
            disabled={generating}
            onClick={generateFromStrategicPlan}
            style={primaryButtonStyle}
          >
            {generating ? "Generating..." : "Generate From Strategic Plan"}
          </button>
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

      {loading && <p style={{ marginTop: 28 }}>Loading execution engine...</p>}

      {!loading && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Total Initiatives</p>
              <h2>{summary.total}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Active</p>
              <h2>{summary.active}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Blocked</p>
              <h2>{summary.blocked}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Completed</p>
              <h2>{summary.completed}</h2>
            </div>
          </section>

          {executionImpact && (
            <section style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Execution Impact</h2>
              <div style={impactGrid}>
                <div>
                  <h3 style={impactHeading}>Related Projects</h3>
                  {executionImpact.relatedProjects.length === 0 ? (
                    <p style={mutedText}>No related active projects detected.</p>
                  ) : (
                    <ul style={listStyle}>
                      {executionImpact.relatedProjects.map((project) => (
                        <li key={project.id}>
                          {project.title} ({project.status})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h3 style={impactHeading}>Related Tasks</h3>
                  {executionImpact.relatedTasks.length === 0 ? (
                    <p style={mutedText}>No related open tasks detected.</p>
                  ) : (
                    <ul style={listStyle}>
                      {executionImpact.relatedTasks.map((task) => (
                        <li key={task.id}>
                          {task.title} ({task.status})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h3 style={impactHeading}>Active Initiatives</h3>
                  {executionImpact.activeInitiatives.length === 0 ? (
                    <p style={mutedText}>No planned or active initiatives.</p>
                  ) : (
                    <ul style={listStyle}>
                      {executionImpact.activeInitiatives.map((initiative) => (
                        <li key={initiative.id}>
                          {initiative.title} ({initiative.status},{" "}
                          {initiative.progress}%)
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          )}

          <section style={{ marginTop: 28 }}>
            <h2>Initiatives</h2>

            {initiatives.length === 0 ? (
              <p style={mutedText}>
                No execution initiatives yet. Generate from the strategic plan to
                get started.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Title</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Priority</th>
                      <th style={thStyle}>Progress</th>
                      <th style={thStyle}>Created Date</th>
                      <th style={thStyle}>Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {initiatives.map((initiative) => (
                      <tr key={initiative.id}>
                        <td style={tdStyle}>
                          <strong>{initiative.title}</strong>
                          {initiative.description && (
                            <p style={descriptionStyle}>
                              {initiative.description}
                            </p>
                          )}
                          {initiative.actions.length > 0 && (
                            <ul style={compactListStyle}>
                              {initiative.actions.map((action) => (
                                <li key={action}>{action}</li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td style={tdStyle}>{initiative.status}</td>
                        <td style={tdStyle}>{initiative.priority}</td>
                        <td style={tdStyle}>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={initiative.progress}
                            onChange={(event) =>
                              updateInitiative(initiative.id, {
                                progress: Number(event.target.value),
                              })
                            }
                            style={{ width: "100%" }}
                          />
                          <span>{initiative.progress}%</span>
                        </td>
                        <td style={tdStyle}>
                          {formatDate(initiative.createdAt)}
                        </td>
                        <td style={tdStyle}>
                          <div style={controlRowStyle}>
                            <button
                              type="button"
                              style={controlButtonStyle}
                              onClick={() =>
                                updateInitiative(initiative.id, {
                                  status: "active",
                                })
                              }
                            >
                              Mark Active
                            </button>
                            <button
                              type="button"
                              style={controlButtonStyle}
                              onClick={() =>
                                updateInitiative(initiative.id, {
                                  status: "blocked",
                                })
                              }
                            >
                              Mark Blocked
                            </button>
                            <button
                              type="button"
                              style={controlButtonStyle}
                              onClick={() =>
                                updateInitiative(initiative.id, {
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

const impactGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 20,
}

const impactHeading: React.CSSProperties = {
  marginTop: 0,
  fontSize: 16,
}

const mutedText: React.CSSProperties = {
  color: "var(--muted)",
  margin: 0,
}

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  lineHeight: 1.7,
}

const compactListStyle: React.CSSProperties = {
  margin: "8px 0 0",
  paddingLeft: 18,
  lineHeight: 1.5,
  fontSize: 14,
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
