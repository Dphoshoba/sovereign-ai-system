"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { ExecutiveMonthlyReview } from "@/lib/executive/monthly-review"

export default function MonthlyReviewPage() {
  const [review, setReview] = useState<ExecutiveMonthlyReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadReview() {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/executive/monthly-review", {
        cache: "no-store",
      })
      const result = await response.json()

      setLoading(false)

      if (!result.ok) {
        setError(result.error || "Failed to load monthly review")
        return
      }

      setReview(result.review)
    }

    loadReview()
  }, [])

  function trendColor(trend: ExecutiveMonthlyReview["healthTrend"]) {
    if (trend === "Improving") {
      return "#15803d"
    }

    if (trend === "Declining") {
      return "#b91c1c"
    }

    return "var(--foreground)"
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Monthly Executive Review</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Board-level monthly review synthesized from archived daily executive
          briefings over the last 30 days.
        </p>
        <div style={actionRowStyle}>
          <a href="/api/executive/monthly-review/pdf" style={primaryButtonStyle}>
            Download PDF
          </a>
          <Link href="/admin/weekly-review" style={secondaryLinkStyle}>
            Back to Weekly Review
          </Link>
          <Link href="/admin/executive-forecast" style={secondaryLinkStyle}>
            Forecast
          </Link>
          <Link href="/admin/strategic-plan" style={secondaryLinkStyle}>
            Strategic Plan
          </Link>
        </div>
      </section>

      {loading && <p style={{ marginTop: 28 }}>Loading monthly review...</p>}

      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}

      {review && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Date Range</p>
              <h2 style={compactHeading}>
                {review.briefingCount > 0
                  ? `${review.startDate} → ${review.endDate}`
                  : "No archived briefings"}
              </h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Briefing Count</p>
              <h2>{review.briefingCount}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Average Health Score</p>
              <h2>{review.averageHealthScore}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Best Health Score</p>
              <h2>{review.bestHealthScore}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Worst Health Score</p>
              <h2>{review.worstHealthScore}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Health Trend</p>
              <h2 style={{ color: trendColor(review.healthTrend) }}>
                {review.healthTrend}
              </h2>
              <p style={subMetaStyle}>
                {review.healthScoreChange > 0 ? "+" : ""}
                {review.healthScoreChange} points (oldest → newest)
              </p>
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Monthly Summary</h2>
            <p style={{ margin: 0, lineHeight: 1.7 }}>{review.monthlySummary}</p>
          </section>

          <section style={twoColumnGrid}>
            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Wins</h2>
              {review.wins.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No wins recorded in archived briefings.
                </p>
              ) : (
                <ul style={listStyle}>
                  {review.wins.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Risks</h2>
              {review.risks.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No risks recorded in archived briefings.
                </p>
              ) : (
                <ul style={listStyle}>
                  {review.risks.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Recurring Issues</h2>
            {review.recurringIssues.length === 0 ? (
              <p style={{ color: "var(--muted)", margin: 0 }}>
                No recurring risks detected across archived briefings.
              </p>
            ) : (
              <ul style={listStyle}>
                {review.recurringIssues.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>

          <section style={movementGrid}>
            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Revenue Movement</h2>
              <p style={{ margin: 0, lineHeight: 1.7 }}>
                {review.revenueMovement}
              </p>
            </div>
            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Growth Movement</h2>
              <p style={{ margin: 0, lineHeight: 1.7 }}>
                {review.growthMovement}
              </p>
            </div>
            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Delivery Movement</h2>
              <p style={{ margin: 0, lineHeight: 1.7 }}>
                {review.deliveryMovement}
              </p>
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Next Month Priorities</h2>
            {review.nextMonthPriorities.length === 0 ? (
              <p style={{ color: "var(--muted)", margin: 0 }}>
                No priorities available from archived briefings.
              </p>
            ) : (
              <ul style={listStyle}>
                {review.nextMonthPriorities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
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
  display: "inline-block",
  padding: "12px 18px",
  borderRadius: 10,
  background: "var(--button-background)",
  color: "var(--button-foreground)",
  fontWeight: 700,
  textDecoration: "none",
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
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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

const subMetaStyle: React.CSSProperties = {
  color: "var(--muted)",
  margin: "8px 0 0",
  fontSize: 14,
}

const compactHeading: React.CSSProperties = {
  fontSize: 22,
  margin: "8px 0 0",
  lineHeight: 1.3,
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
  marginTop: 28,
}

const movementGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 16,
  marginTop: 28,
}

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  lineHeight: 1.7,
}
