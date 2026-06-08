"use client"

import { Fragment, useCallback, useEffect, useState } from "react"
import Link from "next/link"

type ExecutiveDecision = {
  id: string
  boardroomId: string | null
  title: string
  description: string | null
  category: string | null
  status: string
  outcome: string | null
  effectiveness: number | null
  actionTaken: string | null
  lessonLearned: string | null
  reviewDate: string | null
  impactArea: string | null
  followUpRequired: boolean
  createdAt: string
  updatedAt: string
}

type DecisionMemory = {
  totalDecisions: number
  proposed: number
  approved: number
  completed: number
  averageEffectiveness: number
}

export default function DecisionMemoryPage() {
  const [decisions, setDecisions] = useState<ExecutiveDecision[]>([])
  const [memory, setMemory] = useState<DecisionMemory | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadDecisions = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await fetch("/api/executive/decisions", {
      cache: "no-store",
    })
    const result = await response.json()

    setLoading(false)

    if (!result.ok) {
      setError(result.error || "Failed to load decision memory")
      return
    }

    setDecisions(result.decisions)
    setMemory(result.memory)
  }, [])

  useEffect(() => {
    loadDecisions()
  }, [loadDecisions])

  async function updateDecision(
    id: string,
    patch: {
      status?: string
      outcome?: string | null
      effectiveness?: number | null
      actionTaken?: string | null
      lessonLearned?: string | null
      reviewDate?: string | null
      impactArea?: string | null
      followUpRequired?: boolean
    }
  ) {
    setUpdatingId(id)
    setError(null)

    const response = await fetch("/api/executive/decisions", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, ...patch }),
    })
    const result = await response.json()

    setUpdatingId(null)

    if (!result.ok) {
      setError(result.error || "Failed to update decision")
      return
    }

    await loadDecisions()
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString("en-AU", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  function toDateInputValue(value: string | null) {
    if (!value) {
      return ""
    }

    return value.slice(0, 10)
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Decision Memory</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Institutional memory for boardroom decisions — track proposals,
          approvals, outcomes, and effectiveness over time.
        </p>
        <div style={actionRowStyle}>
          <Link href="/admin/boardroom" style={secondaryLinkStyle}>
            Executive Boardroom
          </Link>
          <Link href="/admin/decision-outcomes" style={secondaryLinkStyle}>
            Decision Outcomes
          </Link>
          <Link href="/admin/executive-learning" style={secondaryLinkStyle}>
            Executive Learning
          </Link>
          <Link href="/admin/planning-cycles" style={secondaryLinkStyle}>
            Planning Cycles
          </Link>
          <Link href="/admin/operations" style={secondaryLinkStyle}>
            Operations Center
          </Link>
        </div>
      </section>

      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}

      {loading && <p style={{ marginTop: 28 }}>Loading decision memory...</p>}

      {!loading && memory && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Total Decisions</p>
              <h2>{memory.totalDecisions}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Proposed</p>
              <h2>{memory.proposed}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Approved</p>
              <h2>{memory.approved}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Completed</p>
              <h2>{memory.completed}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Average Effectiveness</p>
              <h2>{memory.averageEffectiveness}%</h2>
            </div>
          </section>

          <section style={{ marginTop: 28 }}>
            <h2>Decision Table</h2>

            {decisions.length === 0 ? (
              <p style={mutedText}>
                No decisions recorded yet. Run a boardroom session to capture
                key decisions automatically.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Title</th>
                      <th style={thStyle}>Category</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Outcome</th>
                      <th style={thStyle}>Effectiveness</th>
                      <th style={thStyle}>Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {decisions.map((decision) => (
                      <Fragment key={decision.id}>
                        <tr>
                          <td style={tdStyle}>
                            <strong>{decision.title}</strong>
                            {decision.description &&
                              decision.description !== decision.title && (
                                <p style={descriptionStyle}>
                                  {decision.description}
                                </p>
                              )}
                            <p style={dateStyle}>
                              {formatDate(decision.createdAt)}
                            </p>
                          </td>
                          <td style={tdStyle}>{decision.category ?? "—"}</td>
                          <td style={tdStyle}>{decision.status}</td>
                          <td style={tdStyle}>
                            <input
                              key={`${decision.id}-${decision.updatedAt}-outcome`}
                              type="text"
                              defaultValue={decision.outcome ?? ""}
                              placeholder="Record outcome"
                              onBlur={(event) => {
                                const value = event.target.value.trim()
                                if (value !== (decision.outcome ?? "")) {
                                  updateDecision(decision.id, {
                                    outcome: value || null,
                                  })
                                }
                              }}
                              style={inputStyle}
                            />
                          </td>
                          <td style={tdStyle}>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={decision.effectiveness ?? 0}
                              onChange={(event) =>
                                updateDecision(decision.id, {
                                  effectiveness: Number(event.target.value),
                                })
                              }
                              style={{ width: "100%" }}
                            />
                            <span>{decision.effectiveness ?? 0}%</span>
                          </td>
                          <td style={tdStyle}>
                            <div style={controlRowStyle}>
                              <button
                                type="button"
                                style={controlButtonStyle}
                                disabled={updatingId === decision.id}
                                onClick={() =>
                                  updateDecision(decision.id, {
                                    status: "approved",
                                  })
                                }
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                style={controlButtonStyle}
                                disabled={updatingId === decision.id}
                                onClick={() =>
                                  updateDecision(decision.id, {
                                    status: "rejected",
                                  })
                                }
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                style={controlButtonStyle}
                                disabled={updatingId === decision.id}
                                onClick={() =>
                                  updateDecision(decision.id, {
                                    status: "completed",
                                  })
                                }
                              >
                                Complete
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={6} style={outcomeRowStyle}>
                            <div style={outcomeGridStyle}>
                              <label style={fieldLabelStyle}>
                                Action Taken
                                <input
                                  key={`${decision.id}-${decision.updatedAt}-action`}
                                  type="text"
                                  defaultValue={decision.actionTaken ?? ""}
                                  placeholder="What action was taken?"
                                  onBlur={(event) => {
                                    const value = event.target.value.trim()
                                    if (value !== (decision.actionTaken ?? "")) {
                                      updateDecision(decision.id, {
                                        actionTaken: value || null,
                                      })
                                    }
                                  }}
                                  style={inputStyle}
                                />
                              </label>
                              <label style={fieldLabelStyle}>
                                Lesson Learned
                                <input
                                  key={`${decision.id}-${decision.updatedAt}-lesson`}
                                  type="text"
                                  defaultValue={decision.lessonLearned ?? ""}
                                  placeholder="What was learned?"
                                  onBlur={(event) => {
                                    const value = event.target.value.trim()
                                    if (
                                      value !== (decision.lessonLearned ?? "")
                                    ) {
                                      updateDecision(decision.id, {
                                        lessonLearned: value || null,
                                      })
                                    }
                                  }}
                                  style={inputStyle}
                                />
                              </label>
                              <label style={fieldLabelStyle}>
                                Impact Area
                                <input
                                  key={`${decision.id}-${decision.updatedAt}-impact`}
                                  type="text"
                                  defaultValue={decision.impactArea ?? ""}
                                  placeholder="e.g. revenue, delivery"
                                  onBlur={(event) => {
                                    const value = event.target.value.trim()
                                    if (value !== (decision.impactArea ?? "")) {
                                      updateDecision(decision.id, {
                                        impactArea: value || null,
                                      })
                                    }
                                  }}
                                  style={inputStyle}
                                />
                              </label>
                              <label style={fieldLabelStyle}>
                                Review Date
                                <input
                                  key={`${decision.id}-${decision.updatedAt}-review`}
                                  type="date"
                                  defaultValue={toDateInputValue(
                                    decision.reviewDate
                                  )}
                                  onBlur={(event) => {
                                    const value = event.target.value
                                    const current = toDateInputValue(
                                      decision.reviewDate
                                    )
                                    if (value !== current) {
                                      updateDecision(decision.id, {
                                        reviewDate: value || null,
                                      })
                                    }
                                  }}
                                  style={inputStyle}
                                />
                              </label>
                              <label style={checkboxLabelStyle}>
                                <input
                                  type="checkbox"
                                  checked={decision.followUpRequired}
                                  onChange={(event) =>
                                    updateDecision(decision.id, {
                                      followUpRequired: event.target.checked,
                                    })
                                  }
                                />
                                Follow Up Required
                              </label>
                              {decision.status === "completed" &&
                                Boolean(decision.lessonLearned?.trim()) && (
                                  <Link
                                    href="/admin/executive-learning"
                                    style={learningLinkStyle}
                                  >
                                    Executive Learning
                                  </Link>
                                )}
                            </div>
                          </td>
                        </tr>
                      </Fragment>
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

const dateStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "var(--muted)",
  fontSize: 12,
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--card-background)",
  fontSize: 13,
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

const outcomeRowStyle: React.CSSProperties = {
  padding: "12px 10px 18px",
  background: "var(--card-background)",
  borderBottom: "1px solid var(--border)",
}

const outcomeGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
}

const fieldLabelStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 13,
  fontWeight: 600,
}

const checkboxLabelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  fontWeight: 600,
  marginTop: 24,
}

const learningLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  color: "var(--button-foreground)",
  fontWeight: 600,
  textDecoration: "none",
  fontSize: 13,
  marginTop: 8,
}
