"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import type {
  AutonomousExecutiveReview,
  ExecutiveReviewPeriod,
  RecurringPattern,
} from "@/lib/executive/autonomous-review"

const PERIODS: { id: ExecutiveReviewPeriod; label: string }[] = [
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
]

const PATTERN_COLORS: Record<RecurringPattern["type"], string> = {
  risk: "#b91c1c",
  opportunity: "#15803d",
  decision_failure: "#c2410c",
  lesson: "#1d4ed8",
  decision: "#7c3aed",
}

const PATTERN_LABELS: Record<RecurringPattern["type"], string> = {
  risk: "Risk",
  opportunity: "Opportunity",
  decision_failure: "Decision Failure",
  lesson: "Lesson",
  decision: "Decision",
}

export default function AutonomousReviewPage() {
  const [period, setPeriod] = useState<ExecutiveReviewPeriod>("weekly")
  const [review, setReview] = useState<AutonomousExecutiveReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadReview = useCallback(async (selected: ExecutiveReviewPeriod) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/executive/autonomous-review?period=${selected}`,
        { cache: "no-store" }
      )
      const result = await response.json()

      setLoading(false)

      if (!result.ok) {
        setError(result.error || "Failed to generate executive review")
        return
      }

      setReview(result.review)
    } catch {
      setLoading(false)
      setError("Failed to generate executive review")
    }
  }, [])

  useEffect(() => {
    loadReview(period)
  }, [period, loadReview])

  function healthColor(score: number) {
    if (score >= 75) return "#15803d"
    if (score >= 55) return "#b45309"
    return "#b91c1c"
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Autonomous Intelligence · Phase 22</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Autonomous Executive Review
        </h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Recurring executive reviews generated automatically from accumulated
          memory — timeline, knowledge graph, boardroom history, decisions,
          lessons, and live revenue, growth, and delivery metrics.
        </p>
        <div style={actionRowStyle}>
          <Link href="/admin/command-center" style={primaryLinkStyle}>
            Command Center
          </Link>
          <Link href="/admin/executive-timeline" style={secondaryLinkStyle}>
            Executive Timeline
          </Link>
          <Link href="/admin/executive-memory" style={secondaryLinkStyle}>
            Executive Memory
          </Link>
        </div>
      </section>

      <section style={{ display: "flex", gap: 8, marginTop: 28 }}>
        {PERIODS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setPeriod(option.id)}
            style={period === option.id ? periodActiveStyle : periodStyle}
          >
            {option.label}
          </button>
        ))}
      </section>

      {loading && (
        <p style={{ marginTop: 24 }}>Generating {period} executive review...</p>
      )}
      {error && <p style={{ marginTop: 24, color: "#b91c1c" }}>{error}</p>}

      {review && !loading && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Health Score</p>
              <h2
                style={{
                  fontSize: 40,
                  margin: "6px 0 0",
                  color: healthColor(review.healthScore),
                }}
              >
                {review.healthScore}
              </h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Confidence</p>
              <h2 style={{ fontSize: 40, margin: "6px 0 0" }}>
                {Math.round(review.confidence * 100)}%
              </h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Review Window</p>
              <h2 style={{ fontSize: 40, margin: "6px 0 0" }}>
                {review.windowDays}d
              </h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Generated</p>
              <h2 style={{ fontSize: 20, margin: "12px 0 0" }}>
                {new Date(review.generatedAt).toLocaleString("en-AU")}
              </h2>
            </div>
          </section>

          <section style={twoColumnGrid}>
            <div style={panelStyle}>
              <h2 style={{ marginTop: 0, color: "#15803d" }}>Major Wins</h2>
              {review.majorWins.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No wins recorded in this window.
                </p>
              ) : (
                <ul style={listStyle}>
                  {review.majorWins.map((win) => (
                    <li key={win}>{win}</li>
                  ))}
                </ul>
              )}
            </div>

            <div style={panelStyle}>
              <h2 style={{ marginTop: 0, color: "#b91c1c" }}>Major Risks</h2>
              {review.majorRisks.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No active risks detected.
                </p>
              ) : (
                <ul style={listStyle}>
                  {review.majorRisks.map((risk) => (
                    <li key={risk}>{risk}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Major Opportunities</h2>
            {review.majorOpportunities.length === 0 ? (
              <p style={{ color: "var(--muted)", margin: 0 }}>
                No opportunities identified.
              </p>
            ) : (
              <ul style={listStyle}>
                {review.majorOpportunities.map((opportunity) => (
                  <li key={opportunity}>{opportunity}</li>
                ))}
              </ul>
            )}
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Recurring Patterns</h2>
            {review.recurringPatterns.length === 0 ? (
              <p style={{ color: "var(--muted)", margin: 0 }}>
                No recurring patterns detected yet — patterns emerge as memory
                accumulates.
              </p>
            ) : (
              <ul style={{ ...listStyle, listStyle: "none", paddingLeft: 0 }}>
                {review.recurringPatterns.map((pattern) => (
                  <li key={pattern.pattern} style={{ marginBottom: 10 }}>
                    <span
                      style={{
                        ...patternBadgeStyle,
                        background: PATTERN_COLORS[pattern.type],
                      }}
                    >
                      {PATTERN_LABELS[pattern.type]}
                      {pattern.occurrences > 1
                        ? ` ×${pattern.occurrences}`
                        : ""}
                    </span>{" "}
                    {pattern.pattern}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Recommended Actions</h2>
            {review.recommendedActions.length === 0 ? (
              <p style={{ color: "var(--muted)", margin: 0 }}>
                No actions recommended — systems are on track.
              </p>
            ) : (
              <ol style={listStyle}>
                {review.recommendedActions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ol>
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

const primaryLinkStyle: React.CSSProperties = {
  ...secondaryLinkStyle,
  background: "var(--button-background)",
  border: "none",
  fontWeight: 700,
}

const periodStyle: React.CSSProperties = {
  padding: "10px 22px",
  borderRadius: 999,
  border: "1px solid var(--border)",
  background: "var(--card-background)",
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 600,
}

const periodActiveStyle: React.CSSProperties = {
  ...periodStyle,
  background: "var(--button-background)",
  color: "var(--button-foreground)",
  border: "none",
  fontWeight: 700,
}

const metricsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 16,
  marginTop: 24,
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

const twoColumnGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 16,
}

const listStyle: React.CSSProperties = {
  margin: "12px 0 0",
  paddingLeft: 20,
  lineHeight: 1.7,
}

const patternBadgeStyle: React.CSSProperties = {
  color: "#fff",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1,
  padding: "3px 8px",
  borderRadius: 999,
}
