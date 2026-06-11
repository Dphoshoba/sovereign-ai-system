"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type DecisionExecutionRecord = {
  decisionId: string
  title: string
  status: string
  implementationProgress: number
  executionHealth: number
  expectedImpact: string
  actualImpact: string
  effectivenessScore: number
  confidence: number
  outcomeSummary: string
}

type DecisionExecutionSummary = {
  total: number
  approved: number
  implemented: number
  deferred: number
  averageEffectiveness: number
  highestImpactDecision: string | null
  lowestImpactDecision: string | null
}

const EMPTY_SUMMARY: DecisionExecutionSummary = {
  total: 0,
  approved: 0,
  implemented: 0,
  deferred: 0,
  averageEffectiveness: 0,
  highestImpactDecision: null,
  lowestImpactDecision: null,
}

export default function DecisionExecutionPage() {
  const [decisions, setDecisions] = useState<DecisionExecutionRecord[]>([])
  const [summary, setSummary] = useState<DecisionExecutionSummary>(EMPTY_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/executive/decision-execution", {
          cache: "no-store",
        })
        const result = await response.json()

        if (!result.ok) {
          setError(result.error || "Failed to load decision execution tracker")
          return
        }

        setDecisions(result.decisions ?? [])
        setSummary(result.summary ?? EMPTY_SUMMARY)
      } catch {
        setError("Failed to load decision execution tracker")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Decision Execution</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Boardroom execution and outcome tracking — every decision followed
          through implementation with measured effectiveness across revenue,
          goals, initiatives, risks, and opportunities.
        </p>
        <div style={actionRowStyle}>
          <Link href="/admin/decision-packages" style={secondaryLinkStyle}>
            Decision Packages
          </Link>
          <Link href="/admin/boardroom" style={secondaryLinkStyle}>
            Boardroom
          </Link>
          <Link href="/admin/executive-memory" style={secondaryLinkStyle}>
            Executive Memory
          </Link>
          <Link href="/admin/strategy-adjustments" style={secondaryLinkStyle}>
            Strategy Adjustments
          </Link>
          <Link href="/admin/command-center" style={secondaryLinkStyle}>
            Command Center
          </Link>
        </div>
      </section>

      <section style={metricsGrid}>
        <div style={metricCard}>
          <p style={metaStyle}>Tracked Decisions</p>
          <h2>{summary.total}</h2>
        </div>
        <div style={metricCard}>
          <p style={metaStyle}>Approved / In Progress</p>
          <h2>{summary.approved}</h2>
        </div>
        <div style={metricCard}>
          <p style={metaStyle}>Implemented</p>
          <h2>{summary.implemented}</h2>
        </div>
        <div style={metricCard}>
          <p style={metaStyle}>Deferred</p>
          <h2>{summary.deferred}</h2>
        </div>
        <div style={metricCard}>
          <p style={metaStyle}>Avg Effectiveness</p>
          <h2>{summary.averageEffectiveness}/100</h2>
        </div>
      </section>

      {!loading && summary.highestImpactDecision && (
        <section style={panelGridStyle}>
          <div style={panelStyle}>
            <h3 style={sectionHeadingStyle}>Highest Impact Decision</h3>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              {summary.highestImpactDecision}
            </p>
          </div>
          <div style={panelStyle}>
            <h3 style={sectionHeadingStyle}>Lowest Impact Decision</h3>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              {summary.lowestImpactDecision}
            </p>
          </div>
        </section>
      )}

      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}
      {loading && <p style={{ marginTop: 28 }}>Loading decision execution tracker...</p>}

      {!loading && decisions.length === 0 && !error && (
        <p style={{ marginTop: 28, color: "var(--muted)" }}>
          No executive decisions tracked yet.
        </p>
      )}

      {!loading &&
        decisions.map((item) => (
          <section key={item.decisionId} style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div>
                <h3 style={{ margin: "0 0 8px", fontSize: 22 }}>{item.title}</h3>
                <p style={{ color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
                  {item.outcomeSummary}
                </p>
              </div>
              <div style={badgeColumnStyle}>
                <span style={statusBadgeStyle(item.status)}>{item.status}</span>
                <span style={pillBadgeStyle}>
                  {Math.round(item.confidence * 100)}% confidence
                </span>
              </div>
            </div>

            <div style={progressRowStyle}>
              <div style={{ flex: 1 }}>
                <p style={metaStyle}>
                  Implementation Progress: {item.implementationProgress}%
                </p>
                <div style={progressTrackStyle}>
                  <div
                    style={{
                      ...progressFillStyle,
                      width: `${item.implementationProgress}%`,
                    }}
                  />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <p style={metaStyle}>
                  Effectiveness Score: {item.effectivenessScore}/100
                </p>
                <div style={progressTrackStyle}>
                  <div
                    style={{
                      ...progressFillStyle,
                      width: `${item.effectivenessScore}%`,
                      background:
                        item.effectivenessScore >= 60
                          ? "#16a34a"
                          : item.effectivenessScore >= 40
                            ? "#d97706"
                            : "#dc2626",
                    }}
                  />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <p style={metaStyle}>
                  Execution Health: {item.executionHealth}/100
                </p>
                <div style={progressTrackStyle}>
                  <div
                    style={{
                      ...progressFillStyle,
                      width: `${item.executionHealth}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={panelGridStyle}>
              <div style={panelStyle}>
                <h4 style={sectionHeadingStyle}>Expected Impact</h4>
                <p style={{ margin: 0, lineHeight: 1.6 }}>{item.expectedImpact}</p>
              </div>
              <div style={panelStyle}>
                <h4 style={sectionHeadingStyle}>Actual Impact</h4>
                <p style={{ margin: 0, lineHeight: 1.6 }}>{item.actualImpact}</p>
              </div>
            </div>
          </section>
        ))}
    </main>
  )
}

function statusBadgeStyle(status: string): React.CSSProperties {
  const colors: Record<string, { background: string; color: string }> = {
    Draft: { background: "#f3f4f6", color: "#374151" },
    "Ready For Boardroom": { background: "#fef3c7", color: "#92400e" },
    Approved: { background: "#dbeafe", color: "#1d4ed8" },
    Rejected: { background: "#fee2e2", color: "#b91c1c" },
    Deferred: { background: "#fce7f3", color: "#9d174d" },
    "In Progress": { background: "#e0f2fe", color: "#0369a1" },
    Implemented: { background: "#dcfce7", color: "#166534" },
  }

  const palette = colors[status] ?? colors.Draft

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

const pillBadgeStyle: React.CSSProperties = {
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
  margin: "0 0 8px",
}

const cardStyle: React.CSSProperties = {
  marginTop: 24,
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const cardHeaderStyle: React.CSSProperties = {
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

const progressRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 20,
  flexWrap: "wrap",
  marginTop: 20,
}

const progressTrackStyle: React.CSSProperties = {
  height: 10,
  borderRadius: 999,
  background: "var(--border)",
  overflow: "hidden",
}

const progressFillStyle: React.CSSProperties = {
  height: "100%",
  borderRadius: 999,
  background: "var(--button-background)",
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
  fontSize: 15,
}
