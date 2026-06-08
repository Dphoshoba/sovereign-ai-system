"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"

type SimulationStrategyInitiative = {
  title: string
  description: string
  priority: string
  actions: string[]
}

type SimulationStrategyGoal = {
  title: string
  description: string | null
  category: string | null
  targetValue: number | null
}

type SimulationStrategy = {
  title: string
  summary: string
  impactScore: number
  recommendation: string
  initiatives: SimulationStrategyInitiative[]
  goals: SimulationStrategyGoal[]
  actions: string[]
}

type StrategicScenarioRecord = {
  id: string
  scenario: string
  title: string
  summary: string | null
  impactScore: number | null
  recommendation: string | null
  status: string
  strategy: SimulationStrategy | null
  createdAt: string
  updatedAt: string
}

type ScenarioSummary = {
  generated: number
  approved: number
  implemented: number
  rejected: number
}

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<StrategicScenarioRecord[]>([])
  const [summary, setSummary] = useState<ScenarioSummary>({
    generated: 0,
    approved: 0,
    implemented: 0,
    rejected: 0,
  })
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadScenarios = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await fetch("/api/executive/scenarios", {
      cache: "no-store",
    })
    const result = await response.json()

    setLoading(false)

    if (!result.ok) {
      setError(result.error || "Failed to load strategy scenarios")
      return
    }

    setScenarios(result.scenarios ?? [])
    setSummary(
      result.summary ?? {
        generated: 0,
        approved: 0,
        implemented: 0,
        rejected: 0,
      }
    )
  }, [])

  useEffect(() => {
    loadScenarios()
  }, [loadScenarios])

  async function updateStatus(id: string, status: string) {
    setActingId(id)
    setError(null)
    setMessage(null)

    const response = await fetch("/api/executive/scenarios", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, status }),
    })
    const result = await response.json()

    setActingId(null)

    if (!result.ok) {
      setError(result.error || `Failed to mark scenario as ${status}`)
      return
    }

    setMessage(`Scenario marked as ${status}.`)
    await loadScenarios()
  }

  async function implementScenario(id: string) {
    setActingId(id)
    setError(null)
    setMessage(null)

    const response = await fetch("/api/executive/scenarios/implement", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scenarioId: id }),
    })
    const result = await response.json()

    setActingId(null)

    if (!result.ok) {
      setError(result.error || "Failed to implement scenario")
      return
    }

    setMessage(
      `Implemented scenario: ${result.initiativesCreated} initiative(s) and ${result.goalsCreated} goal(s) created.`
    )
    await loadScenarios()
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Strategy Scenarios</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Convert strategic simulation outcomes into actionable initiatives,
          quarterly goals, and execution paths — rule-based, no AI required.
        </p>
        <div style={actionRowStyle}>
          <Link href="/admin/simulations" style={secondaryLinkStyle}>
            Strategic Simulations
          </Link>
          <Link href="/admin/strategic-plan" style={secondaryLinkStyle}>
            Strategic Plan
          </Link>
          <Link href="/admin/goals" style={secondaryLinkStyle}>
            Quarterly Goals
          </Link>
          <Link href="/admin/execution" style={secondaryLinkStyle}>
            Execution Engine
          </Link>
          <Link href="/admin/operations" style={secondaryLinkStyle}>
            Operations Center
          </Link>
        </div>
      </section>

      <section style={metricsGrid}>
        <div style={metricCard}>
          <p style={metaStyle}>Generated</p>
          <h2>{summary.generated}</h2>
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

      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}
      {message && <p style={{ marginTop: 28, color: "#166534" }}>{message}</p>}

      {loading && <p style={{ marginTop: 28 }}>Loading strategy scenarios...</p>}

      {!loading && scenarios.length === 0 && (
        <p style={{ marginTop: 28 }}>
          No strategy scenarios yet. Run a simulation and convert it via{" "}
          <Link href="/admin/simulations">Strategic Simulations</Link> or POST to{" "}
          <code>/api/executive/scenarios</code>.
        </p>
      )}

      {!loading &&
        scenarios.map((item) => (
          <section key={item.id} style={scenarioCardStyle}>
            <div style={scenarioHeaderStyle}>
              <div>
                <p style={metaStyle}>{formatScenarioLabel(item.scenario)}</p>
                <h2 style={{ margin: "8px 0", fontSize: 24 }}>{item.title}</h2>
                {item.summary && (
                  <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
                    {item.summary}
                  </p>
                )}
              </div>
              <div style={badgeColumnStyle}>
                <span style={statusBadgeStyle(item.status)}>{item.status}</span>
                {typeof item.impactScore === "number" && (
                  <span style={impactBadgeStyle}>
                    Impact {item.impactScore}/100
                  </span>
                )}
              </div>
            </div>

            {item.recommendation && (
              <p style={{ marginTop: 16, lineHeight: 1.6 }}>
                <strong>Recommendation:</strong> {item.recommendation}
              </p>
            )}

            {item.strategy && (
              <div style={panelGridStyle}>
                <div style={panelStyle}>
                  <h3 style={sectionHeadingStyle}>Initiatives</h3>
                  <ul style={listStyle}>
                    {item.strategy.initiatives.map((initiative) => (
                      <li key={initiative.title}>
                        <strong>{initiative.title}</strong>
                        <p style={{ margin: "4px 0 0" }}>{initiative.description}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={panelStyle}>
                  <h3 style={sectionHeadingStyle}>Goals</h3>
                  <ul style={listStyle}>
                    {item.strategy.goals.map((goal) => (
                      <li key={goal.title}>
                        <strong>{goal.title}</strong>
                        {goal.description && (
                          <p style={{ margin: "4px 0 0" }}>{goal.description}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={panelStyle}>
                  <h3 style={sectionHeadingStyle}>Actions</h3>
                  <ul style={listStyle}>
                    {item.strategy.actions.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

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
                  item.status === "implemented" ||
                  item.status === "rejected"
                }
                onClick={() => implementScenario(item.id)}
              >
                {actingId === item.id ? "Working..." : "Implement"}
              </button>
            </div>
          </section>
        ))}
    </main>
  )
}

function formatScenarioLabel(scenario: string) {
  return scenario
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function statusBadgeStyle(status: string): React.CSSProperties {
  const colors: Record<string, { background: string; color: string }> = {
    generated: { background: "#dbeafe", color: "#1d4ed8" },
    approved: { background: "#dcfce7", color: "#166534" },
    rejected: { background: "#fee2e2", color: "#b91c1c" },
    implemented: { background: "#f3e8ff", color: "#7e22ce" },
  }

  const palette = colors[status] ?? colors.generated

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

const impactBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "6px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  background: "var(--card-background)",
  border: "1px solid var(--border)",
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
