"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type PlanningCycleAction = {
  title: string
  description: string
  link?: string
  actionType?: string
}

type PlanningCycle = {
  id: string
  cycleType: string
  status: string
  healthScore: number | null
  summary: string | null
  recommendations: string[]
  risks: string[]
  opportunities: string[]
  actions: PlanningCycleAction[]
  createdAt: string
  updatedAt: string
}

const LINK_ACTION_MAP: Record<string, string> = {
  "/admin/delivery": "review-overdue-tasks",
  "/admin/client-projects": "review-overdue-tasks",
  "/admin/invoices": "review-invoices",
  "/admin/creator-leads": "review-leads",
  "/admin/articles": "review-content",
  "/admin/execution": "review-initiatives",
  "/admin/goals": "review-goals",
  "/admin/planning-cycles": "review-planning",
  "/admin/initiative-performance": "sync-goals",
}

function resolveActionType(action: PlanningCycleAction): string | null {
  if (
    action.actionType &&
    action.actionType !== "open-page" &&
    action.actionType !== "open_page"
  ) {
    return action.actionType
  }

  if (action.link && LINK_ACTION_MAP[action.link]) {
    return LINK_ACTION_MAP[action.link]
  }

  if (action.title.toLowerCase().includes("sync goal")) {
    return "sync-goals"
  }

  return null
}

export default function PlanningCyclesPage() {
  const router = useRouter()
  const [cycles, setCycles] = useState<PlanningCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null)
  const [executedActionsCount, setExecutedActionsCount] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadCycles = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await fetch("/api/executive/planning-cycles", {
      cache: "no-store",
    })
    const result = await response.json()

    setLoading(false)

    if (!result.ok) {
      setError(result.error || "Failed to load planning cycles")
      return
    }

    setCycles(result.cycles)
  }, [])

  useEffect(() => {
    loadCycles()
  }, [loadCycles])

  const summary = useMemo(() => {
    return {
      total: cycles.length,
      draft: cycles.filter((cycle) => cycle.status === "draft").length,
      reviewed: cycles.filter((cycle) => cycle.status === "reviewed").length,
      approved: cycles.filter((cycle) => cycle.status === "approved").length,
    }
  }, [cycles])

  async function generateCycle() {
    setGenerating(true)
    setMessage(null)
    setError(null)

    const response = await fetch("/api/executive/planning-cycles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cycleType: "weekly" }),
    })
    const result = await response.json()

    setGenerating(false)

    if (!result.ok) {
      setError(result.error || "Failed to generate planning cycle")
      return
    }

    setMessage("Planning cycle generated and saved as draft.")
    await loadCycles()
  }

  async function runAction(cycleId: string, action: PlanningCycleAction) {
    const actionType = resolveActionType(action)

    if (!actionType) {
      setError("This action cannot be run automatically.")
      return
    }

    const actionKey = `${cycleId}-${action.title}`
    setActionLoadingKey(actionKey)
    setError(null)
    setMessage(null)

    const response = await fetch("/api/executive/planning-cycles/run-action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        actionType,
        payload: {},
      }),
    })
    const result = await response.json()

    setActionLoadingKey(null)

    if (!result.ok) {
      setError(result.error || "Action failed")
      return
    }

    setExecutedActionsCount((count) => count + 1)
    setMessage(result.message || "Action completed.")

    if (result.redirectTo) {
      router.push(result.redirectTo)
      return
    }

    await loadCycles()
  }

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id)
    setError(null)

    const response = await fetch("/api/executive/planning-cycles", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, status }),
    })
    const result = await response.json()

    setUpdatingId(null)

    if (!result.ok) {
      setError(result.error || "Failed to update planning cycle")
      return
    }

    await loadCycles()
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString("en-AU", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function healthColor(score: number | null) {
    if (score === null) {
      return "var(--foreground)"
    }

    if (score >= 80) {
      return "#15803d"
    }

    if (score >= 60) {
      return "var(--foreground)"
    }

    return "#b91c1c"
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Planning Cycles</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Autonomous planning cycles that review goals, initiatives, risks, and
          performance, then recommend safe plan adjustments.
        </p>
        <div style={actionRowStyle}>
          <button
            type="button"
            disabled={generating}
            onClick={generateCycle}
            style={primaryButtonStyle}
          >
            {generating ? "Generating..." : "Generate Planning Cycle"}
          </button>
          <Link href="/admin/strategic-plan" style={secondaryLinkStyle}>
            Strategic Plan
          </Link>
          <Link href="/admin/goals" style={secondaryLinkStyle}>
            Quarterly Goals
          </Link>
          <Link href="/admin/initiative-performance" style={secondaryLinkStyle}>
            Initiative Performance
          </Link>
          <Link href="/admin/operations" style={secondaryLinkStyle}>
            Operations Center
          </Link>
        </div>
      </section>

      {message && <p style={successMessageStyle}>{message}</p>}
      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}

      {loading && <p style={{ marginTop: 28 }}>Loading planning cycles...</p>}

      {!loading && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Total Cycles</p>
              <h2>{summary.total}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Draft</p>
              <h2>{summary.draft}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Reviewed</p>
              <h2>{summary.reviewed}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Approved</p>
              <h2>{summary.approved}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Executed Actions</p>
              <h2>{executedActionsCount}</h2>
            </div>
          </section>

          <section style={{ marginTop: 28 }}>
            <h2>Cycle History</h2>

            {cycles.length === 0 ? (
              <p style={mutedText}>
                No planning cycles yet. Generate a cycle to review goals,
                initiatives, and performance.
              </p>
            ) : (
              <div style={cycleListStyle}>
                {cycles.map((cycle) => (
                  <article key={cycle.id} style={cycleCardStyle}>
                    <div style={cycleHeaderStyle}>
                      <div>
                        <strong style={{ textTransform: "capitalize" }}>
                          {cycle.cycleType} cycle
                        </strong>
                        <p style={metaLineStyle}>
                          {formatDate(cycle.createdAt)} · Status: {cycle.status}
                        </p>
                      </div>
                      <p style={{ margin: 0 }}>
                        <strong>Health:</strong>{" "}
                        <span style={{ color: healthColor(cycle.healthScore) }}>
                          {cycle.healthScore ?? "—"}
                        </span>
                      </p>
                    </div>

                    {cycle.summary && (
                      <p style={summaryStyle}>{cycle.summary}</p>
                    )}

                    {cycle.recommendations.length > 0 && (
                      <div style={sectionBlockStyle}>
                        <h3 style={sectionHeadingStyle}>Recommendations</h3>
                        <ul style={listStyle}>
                          {cycle.recommendations.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {cycle.risks.length > 0 && (
                      <div style={sectionBlockStyle}>
                        <h3 style={sectionHeadingStyle}>Risks</h3>
                        <ul style={listStyle}>
                          {cycle.risks.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {cycle.opportunities.length > 0 && (
                      <div style={sectionBlockStyle}>
                        <h3 style={sectionHeadingStyle}>Opportunities</h3>
                        <ul style={listStyle}>
                          {cycle.opportunities.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {cycle.actions.length > 0 && (
                      <div style={sectionBlockStyle}>
                        <h3 style={sectionHeadingStyle}>Actions</h3>
                        <ul style={actionListStyle}>
                          {cycle.actions.map((action) => {
                            const actionType = resolveActionType(action)
                            const actionKey = `${cycle.id}-${action.title}`

                            return (
                              <li key={action.title} style={actionItemStyle}>
                                <div>
                                  <strong>{action.title}</strong>
                                  <p style={actionDescriptionStyle}>
                                    {action.description}
                                  </p>
                                </div>
                                <div style={actionControlsStyle}>
                                  {actionType ? (
                                    <button
                                      type="button"
                                      style={runActionButtonStyle}
                                      disabled={actionLoadingKey === actionKey}
                                      onClick={() => runAction(cycle.id, action)}
                                    >
                                      {actionLoadingKey === actionKey
                                        ? "Running..."
                                        : "Run Action"}
                                    </button>
                                  ) : null}
                                  {action.link && (
                                    <Link href={action.link} style={openLinkStyle}>
                                      Open
                                    </Link>
                                  )}
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}

                    <div style={controlRowStyle}>
                      <button
                        type="button"
                        style={controlButtonStyle}
                        disabled={
                          updatingId === cycle.id || cycle.status === "reviewed"
                        }
                        onClick={() => updateStatus(cycle.id, "reviewed")}
                      >
                        Mark Reviewed
                      </button>
                      <button
                        type="button"
                        style={controlButtonStyle}
                        disabled={
                          updatingId === cycle.id || cycle.status === "approved"
                        }
                        onClick={() => updateStatus(cycle.id, "approved")}
                      >
                        Mark Approved
                      </button>
                      <button
                        type="button"
                        style={controlButtonStyle}
                        disabled={
                          updatingId === cycle.id || cycle.status === "archived"
                        }
                        onClick={() => updateStatus(cycle.id, "archived")}
                      >
                        Archive
                      </button>
                    </div>
                  </article>
                ))}
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

const mutedText: React.CSSProperties = {
  color: "var(--muted)",
}

const cycleListStyle: React.CSSProperties = {
  display: "grid",
  gap: 20,
  marginTop: 16,
}

const cycleCardStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const cycleHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 12,
}

const metaLineStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "var(--muted)",
  fontSize: 14,
}

const summaryStyle: React.CSSProperties = {
  margin: "0 0 16px",
  lineHeight: 1.7,
}

const sectionBlockStyle: React.CSSProperties = {
  marginTop: 16,
}

const sectionHeadingStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 16,
}

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  lineHeight: 1.7,
}

const actionListStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 0,
  listStyle: "none",
  display: "grid",
  gap: 12,
}

const actionItemStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  alignItems: "flex-start",
  padding: "12px 0",
  borderBottom: "1px solid var(--border)",
}

const actionDescriptionStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "var(--muted)",
  lineHeight: 1.5,
}

const actionControlsStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  flexWrap: "wrap",
}

const runActionButtonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--button-background)",
  color: "var(--button-foreground)",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
}

const openLinkStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
}

const controlRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 20,
}

const controlButtonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--card-background)",
  cursor: "pointer",
  fontSize: 13,
}
