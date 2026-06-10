"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"

type StrategyAdjustmentGoal = {
  title: string
  description: string | null
  category: string | null
  targetValue: number | null
}

type StrategyAdjustmentInitiative = {
  title: string
  description: string
  priority: string
  actions: string[]
}

type StrategyAdjustmentRecord = {
  id: string
  title: string
  description: string | null
  category: string | null
  priority: string
  recommendation: string | null
  status: string
  sourceReviewId: string | null
  sourceReasoning: string | null
  goals: StrategyAdjustmentGoal[]
  initiatives: StrategyAdjustmentInitiative[]
  createdAt: string
  updatedAt: string
}

type AdjustmentSummary = {
  proposed: number
  approved: number
  implemented: number
  rejected: number
}

type StrategicAdjustment = {
  id: string
  title: string
  category: string
  priority: string
  rationale: string
  evidence: string[]
  proposedAction: string
  expectedImpact: string
  confidence: number
  status: string
}

type StrategicAdjustmentSummary = {
  total: number
  byPriority: Record<string, number>
  byCategory: Record<string, number>
  byStatus: Record<string, number>
  averageConfidence: number
}

const EMPTY_ENGINE_SUMMARY: StrategicAdjustmentSummary = {
  total: 0,
  byPriority: {},
  byCategory: {},
  byStatus: {},
  averageConfidence: 0,
}

export default function StrategyAdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<StrategyAdjustmentRecord[]>([])
  const [summary, setSummary] = useState<AdjustmentSummary>({
    proposed: 0,
    approved: 0,
    implemented: 0,
    rejected: 0,
  })
  const [engineAdjustments, setEngineAdjustments] = useState<
    StrategicAdjustment[]
  >([])
  const [engineSummary, setEngineSummary] =
    useState<StrategicAdjustmentSummary>(EMPTY_ENGINE_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadAdjustments = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await fetch("/api/executive/strategy-adjustments", {
      cache: "no-store",
    })
    const result = await response.json()

    setLoading(false)

    if (!result.ok) {
      setError(result.error || "Failed to load strategy adjustments")
      return
    }

    setEngineAdjustments(result.adjustments ?? [])
    setEngineSummary(result.summary ?? EMPTY_ENGINE_SUMMARY)
    setAdjustments(result.stored?.adjustments ?? [])
    setSummary(
      result.stored?.summary ?? {
        proposed: 0,
        approved: 0,
        implemented: 0,
        rejected: 0,
      }
    )
  }, [])

  useEffect(() => {
    loadAdjustments()
  }, [loadAdjustments])

  async function generateAdjustments() {
    setGenerating(true)
    setError(null)
    setMessage(null)

    const response = await fetch("/api/executive/strategy-adjustments", {
      method: "POST",
    })
    const result = await response.json()

    setGenerating(false)

    if (!result.ok) {
      setError(result.error || "Failed to generate strategy adjustments")
      return
    }

    setMessage(
      `Generated ${result.createdCount} adjustment proposal${result.createdCount === 1 ? "" : "s"}${result.skippedCount > 0 ? ` (${result.skippedCount} duplicates skipped)` : ""}.`
    )
    await loadAdjustments()
  }

  async function updateStatus(id: string, status: string) {
    setActingId(id)
    setError(null)
    setMessage(null)

    const response = await fetch("/api/executive/strategy-adjustments", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, status }),
    })
    const result = await response.json()

    setActingId(null)

    if (!result.ok) {
      setError(result.error || `Failed to mark adjustment as ${status}`)
      return
    }

    setMessage(`Adjustment marked as ${status}.`)
    await loadAdjustments()
  }

  async function applyAdjustment(id: string) {
    setActingId(id)
    setError(null)
    setMessage(null)

    const response = await fetch("/api/executive/strategy-adjustments/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ adjustmentId: id }),
    })
    const result = await response.json()

    setActingId(null)

    if (!result.ok) {
      setError(result.error || "Failed to apply strategy adjustment")
      return
    }

    setMessage(
      `Applied adjustment: ${result.initiativesCreated} initiative(s) and ${result.goalsCreated} goal(s) created.`
    )
    await loadAdjustments()
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Strategy Adjustments</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Deterministic strategy adjustment proposals generated from executive
          memory, autonomous reviews, risks, opportunities, decisions, and
          lessons — all changes require approval before application.
        </p>
        <div style={actionRowStyle}>
          <button
            type="button"
            style={primaryButtonStyle}
            disabled={generating}
            onClick={generateAdjustments}
          >
            {generating ? "Generating..." : "Generate Adjustments"}
          </button>
          <Link href="/admin/command-center" style={secondaryLinkStyle}>
            Command Center
          </Link>
          <Link href="/admin/executive-memory" style={secondaryLinkStyle}>
            Executive Memory
          </Link>
          <Link href="/admin/executive-timeline" style={secondaryLinkStyle}>
            Executive Timeline
          </Link>
          <Link href="/admin/autonomous-review" style={secondaryLinkStyle}>
            Autonomous Review
          </Link>
          <Link href="/admin/quarterly-review" style={secondaryLinkStyle}>
            Quarterly Review
          </Link>
          <Link href="/admin/strategic-plan" style={secondaryLinkStyle}>
            Strategic Plan
          </Link>
        </div>
      </section>

      <section style={metricsGrid}>
        <div style={metricCard}>
          <p style={metaStyle}>Engine Adjustments</p>
          <h2>{engineSummary.total}</h2>
        </div>
        <div style={metricCard}>
          <p style={metaStyle}>Avg Confidence</p>
          <h2>{Math.round(engineSummary.averageConfidence * 100)}%</h2>
        </div>
        <div style={metricCard}>
          <p style={metaStyle}>Proposed (Stored)</p>
          <h2>{summary.proposed}</h2>
        </div>
        <div style={metricCard}>
          <p style={metaStyle}>Approved</p>
          <h2>{summary.approved}</h2>
        </div>
        <div style={metricCard}>
          <p style={metaStyle}>Implemented</p>
          <h2>{summary.implemented}</h2>
        </div>
      </section>

      {!loading && (
        <section style={panelGridStyle}>
          <div style={panelStyle}>
            <h3 style={sectionHeadingStyle}>Priority Breakdown</h3>
            {Object.entries(engineSummary.byPriority).filter(
              ([, count]) => count > 0
            ).length === 0 ? (
              <p style={{ color: "var(--muted)", margin: 0 }}>
                No adjustments generated.
              </p>
            ) : (
              <ul style={listStyle}>
                {Object.entries(engineSummary.byPriority)
                  .filter(([, count]) => count > 0)
                  .map(([priority, count]) => (
                    <li key={priority}>
                      <strong style={{ textTransform: "capitalize" }}>
                        {priority}
                      </strong>
                      : {count}
                    </li>
                  ))}
              </ul>
            )}
          </div>
          <div style={panelStyle}>
            <h3 style={sectionHeadingStyle}>Category Breakdown</h3>
            {Object.entries(engineSummary.byCategory).filter(
              ([, count]) => count > 0
            ).length === 0 ? (
              <p style={{ color: "var(--muted)", margin: 0 }}>
                No adjustments generated.
              </p>
            ) : (
              <ul style={listStyle}>
                {Object.entries(engineSummary.byCategory)
                  .filter(([, count]) => count > 0)
                  .map(([category, count]) => (
                    <li key={category}>
                      <strong>{category}</strong>: {count}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}
      {message && <p style={{ marginTop: 28, color: "#166534" }}>{message}</p>}

      {loading && <p style={{ marginTop: 28 }}>Loading strategy adjustments...</p>}

      {!loading && (
        <>
          <h2 style={{ marginTop: 40 }}>Proposed Strategic Adjustments</h2>
          <p style={{ color: "var(--muted)", maxWidth: 820, lineHeight: 1.6 }}>
            Generated live by the rule-based strategy adjustment engine on every
            load — not persisted until approved through the workflow below.
          </p>
        </>
      )}

      {!loading && engineAdjustments.length === 0 && (
        <p style={{ marginTop: 16, color: "var(--muted)" }}>
          No strategic adjustments needed right now — all engine rules passed.
        </p>
      )}

      {!loading &&
        engineAdjustments.map((item) => (
          <section key={item.id} style={scenarioCardStyle}>
            <div style={scenarioHeaderStyle}>
              <div>
                <p style={metaStyle}>{item.category}</p>
                <h2 style={{ margin: "8px 0", fontSize: 24 }}>{item.title}</h2>
                <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
                  {item.rationale}
                </p>
              </div>
              <div style={badgeColumnStyle}>
                <span style={engineStatusBadgeStyle(item.status)}>
                  {item.status}
                </span>
                <span style={priorityBadgeStyle(item.priority)}>
                  {item.priority} priority
                </span>
                <span style={confidenceBadgeStyle}>
                  {Math.round(item.confidence * 100)}% confidence
                </span>
              </div>
            </div>

            <div style={{ ...panelStyle, marginTop: 16 }}>
              <h3 style={sectionHeadingStyle}>Evidence</h3>
              {item.evidence.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No supporting evidence recorded.
                </p>
              ) : (
                <ul style={listStyle}>
                  {item.evidence.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              )}
            </div>

            <p style={{ marginTop: 16, lineHeight: 1.6 }}>
              <strong>Proposed action:</strong> {item.proposedAction}
            </p>
            <p style={{ marginTop: 8, lineHeight: 1.6 }}>
              <strong>Expected impact:</strong> {item.expectedImpact}
            </p>
          </section>
        ))}

      {!loading && (
        <>
          <h2 style={{ marginTop: 48 }}>Stored Adjustment Workflow</h2>
          <p style={{ color: "var(--muted)", maxWidth: 820, lineHeight: 1.6 }}>
            Persisted proposals generated from quarterly reviews — approve,
            reject, or apply them to create goals and initiatives.
          </p>
        </>
      )}

      {!loading && adjustments.length === 0 && (
        <p style={{ marginTop: 28 }}>
          No strategy adjustments yet. Generate a quarterly review first, then
          click Generate Adjustments.
        </p>
      )}

      {!loading &&
        adjustments.map((item) => (
          <section key={item.id} style={scenarioCardStyle}>
            <div style={scenarioHeaderStyle}>
              <div>
                <p style={metaStyle}>{item.category ?? "strategy"}</p>
                <h2 style={{ margin: "8px 0", fontSize: 24 }}>{item.title}</h2>
                {item.description && (
                  <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
                    {item.description}
                  </p>
                )}
              </div>
              <div style={badgeColumnStyle}>
                <span style={statusBadgeStyle(item.status)}>{item.status}</span>
                <span style={priorityBadgeStyle(item.priority)}>
                  {item.priority} priority
                </span>
              </div>
            </div>

            {item.recommendation && (
              <p style={{ marginTop: 16, lineHeight: 1.6 }}>
                <strong>Recommendation:</strong> {item.recommendation}
              </p>
            )}

            {item.sourceReasoning && (
              <div style={{ ...panelStyle, marginTop: 16 }}>
                <h3 style={sectionHeadingStyle}>Source Reasoning</h3>
                <p style={{ margin: 0, lineHeight: 1.6 }}>{item.sourceReasoning}</p>
              </div>
            )}

            <div style={panelGridStyle}>
              <div style={panelStyle}>
                <h3 style={sectionHeadingStyle}>Generated Initiatives</h3>
                {item.initiatives.length === 0 ? (
                  <p style={{ color: "var(--muted)", margin: 0 }}>
                    No initiatives proposed.
                  </p>
                ) : (
                  <ul style={listStyle}>
                    {item.initiatives.map((initiative) => (
                      <li key={initiative.title}>
                        <strong>{initiative.title}</strong>
                        <p style={{ margin: "4px 0 0" }}>
                          {initiative.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div style={panelStyle}>
                <h3 style={sectionHeadingStyle}>Generated Goals</h3>
                {item.goals.length === 0 ? (
                  <p style={{ color: "var(--muted)", margin: 0 }}>
                    No goals proposed.
                  </p>
                ) : (
                  <ul style={listStyle}>
                    {item.goals.map((goal) => (
                      <li key={goal.title}>
                        <strong>{goal.title}</strong>
                        {goal.description && (
                          <p style={{ margin: "4px 0 0" }}>{goal.description}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div style={buttonRowStyle}>
              <button
                type="button"
                style={primaryButtonStyle}
                disabled={
                  actingId === item.id ||
                  item.status === "approved" ||
                  item.status === "implemented" ||
                  item.status === "rejected"
                }
                onClick={() => updateStatus(item.id, "approved")}
              >
                Approve
              </button>
              <button
                type="button"
                style={dangerButtonStyle}
                disabled={
                  actingId === item.id ||
                  item.status === "rejected" ||
                  item.status === "implemented"
                }
                onClick={() => updateStatus(item.id, "rejected")}
              >
                Reject
              </button>
              <button
                type="button"
                style={secondaryButtonStyle}
                disabled={
                  actingId === item.id ||
                  item.status !== "approved"
                }
                onClick={() => applyAdjustment(item.id)}
              >
                {actingId === item.id ? "Working..." : "Apply"}
              </button>
            </div>
          </section>
        ))}
    </main>
  )
}

function statusBadgeStyle(status: string): React.CSSProperties {
  const colors: Record<string, { background: string; color: string }> = {
    proposed: { background: "#dbeafe", color: "#1d4ed8" },
    approved: { background: "#dcfce7", color: "#166534" },
    rejected: { background: "#fee2e2", color: "#b91c1c" },
    implemented: { background: "#f3e8ff", color: "#7e22ce" },
  }

  const palette = colors[status] ?? colors.proposed

  return {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    background: palette.background,
    color: palette.color,
  }
}

function engineStatusBadgeStyle(status: string): React.CSSProperties {
  const colors: Record<string, { background: string; color: string }> = {
    Proposed: { background: "#dbeafe", color: "#1d4ed8" },
    "Under Review": { background: "#fef9c3", color: "#854d0e" },
    Approved: { background: "#dcfce7", color: "#166534" },
    Rejected: { background: "#fee2e2", color: "#b91c1c" },
    Implemented: { background: "#f3e8ff", color: "#7e22ce" },
  }

  const palette = colors[status] ?? colors.Proposed

  return {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    background: palette.background,
    color: palette.color,
  }
}

const confidenceBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "6px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  background: "var(--card-background)",
  border: "1px solid var(--border)",
}

const priorityBadgeStyle = (priority: string): React.CSSProperties => ({
  display: "inline-block",
  padding: "6px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  textTransform: "capitalize",
})

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

const scenarioCardStyle: React.CSSProperties = {
  marginTop: 28,
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const scenarioHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
}

const badgeColumnStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  alignItems: "flex-end",
}

const panelGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 16,
  marginTop: 20,
}

const panelStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: 18,
}

const sectionHeadingStyle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 16,
}

const listStyle: React.CSSProperties = {
  margin: "12px 0 0",
  paddingLeft: 20,
  lineHeight: 1.7,
}

const buttonRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 20,
}

const primaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  background: "var(--button-background)",
  color: "var(--button-foreground)",
  fontWeight: 600,
  cursor: "pointer",
}

const secondaryButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  background: "var(--card-background)",
  border: "1px solid var(--border)",
}

const dangerButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  background: "#fee2e2",
  color: "#b91c1c",
}
