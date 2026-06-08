"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import type { ExecutiveQuarterlyReview } from "@/lib/executive/quarterly-review"

type StoredQuarterlyReview = {
  id: string
  quarter: string
  year: number
  healthScore: number | null
  executiveSummary: string | null
  review: ExecutiveQuarterlyReview | null
  createdAt: string
}

export default function QuarterlyReviewPage() {
  const [reviews, setReviews] = useState<StoredQuarterlyReview[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadReviews = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await fetch("/api/executive/quarterly-review", {
      cache: "no-store",
    })
    const result = await response.json()

    setLoading(false)

    if (!result.ok) {
      setError(result.error || "Failed to load quarterly reviews")
      return
    }

    setReviews(result.reviews ?? [])
    setSelectedId((current) => current ?? result.reviews?.[0]?.id ?? null)
  }, [])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  const activeReview =
    reviews.find((item) => item.id === selectedId) ?? reviews[0] ?? null
  const review = activeReview?.review

  async function generateReview() {
    setGenerating(true)
    setError(null)
    setMessage(null)

    const response = await fetch("/api/executive/quarterly-review", {
      method: "POST",
    })
    const result = await response.json()

    setGenerating(false)

    if (!result.ok) {
      setError(result.error || "Failed to generate quarterly review")
      return
    }

    setMessage(`Generated ${result.review.quarter} ${result.review.year} quarterly review.`)
    setSelectedId(result.review.id)
    await loadReviews()
  }

  function healthColor(score: number | null) {
    if (score === null) {
      return "var(--foreground)"
    }

    if (score >= 75) {
      return "#15803d"
    }

    if (score < 50) {
      return "#b91c1c"
    }

    return "var(--foreground)"
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Quarterly Executive Review</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Autonomous quarterly review synthesized from goals, initiatives,
          decision outcomes, executive learning, forecasts, and boardroom sessions.
        </p>
        <div style={actionRowStyle}>
          <button
            type="button"
            style={primaryButtonStyle}
            disabled={generating}
            onClick={generateReview}
          >
            {generating ? "Generating..." : "Generate Quarterly Review"}
          </button>
          <Link href="/admin/monthly-review" style={secondaryLinkStyle}>
            Monthly Review
          </Link>
          <Link href="/admin/boardroom" style={secondaryLinkStyle}>
            Executive Boardroom
          </Link>
          <Link href="/admin/goals" style={secondaryLinkStyle}>
            Quarterly Goals
          </Link>
          <Link href="/admin/operations" style={secondaryLinkStyle}>
            Operations Center
          </Link>
        </div>
      </section>

      {message && <p style={{ marginTop: 28, color: "#166534" }}>{message}</p>}
      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}

      {loading && <p style={{ marginTop: 28 }}>Loading quarterly reviews...</p>}

      {!loading && reviews.length > 1 && (
        <section style={{ marginTop: 28 }}>
          <label style={labelStyle}>
            Review Period
            <select
              value={selectedId ?? ""}
              onChange={(event) => setSelectedId(event.target.value)}
              style={selectStyle}
            >
              {reviews.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.quarter} {item.year}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}

      {!loading && !review && (
        <p style={{ marginTop: 28 }}>
          No quarterly review generated yet. Click Generate Quarterly Review to
          create one for the current quarter.
        </p>
      )}

      {review && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Quarter</p>
              <h2>{review.quarter}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Year</p>
              <h2>{review.year}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Health Score</p>
              <h2 style={{ color: healthColor(review.healthScore) }}>
                {review.healthScore}
              </h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Goals Completed</p>
              <h2>
                {review.goalPerformance.completedGoals}/
                {review.goalPerformance.totalGoals}
              </h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Initiatives Completed</p>
              <h2>
                {review.initiativePerformance.completedInitiatives}/
                {review.initiativePerformance.totalInitiatives}
              </h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Boardroom Sessions</p>
              <h2>{review.boardroomSummary.sessionCount}</h2>
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Executive Summary</h2>
            <p style={{ margin: 0, lineHeight: 1.7 }}>{review.executiveSummary}</p>
          </section>

          <section style={twoColumnGrid}>
            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Goal Performance</h2>
              <p style={subMetaStyle}>
                {review.goalPerformance.completionRate}% completion rate —{" "}
                {review.goalPerformance.rating}
              </p>
              {review.goalPerformance.goals.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No quarterly goals recorded for this period.
                </p>
              ) : (
                <ul style={listStyle}>
                  {review.goalPerformance.goals.map((goal) => (
                    <li key={goal.id}>
                      <strong>{goal.title}</strong> — {goal.status} ({goal.progress}
                      %)
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Initiative Performance</h2>
              <p style={subMetaStyle}>
                {review.initiativePerformance.completionRate}% completion rate —{" "}
                {review.initiativePerformance.initiativeHealth}
              </p>
              <ul style={listStyle}>
                <li>Active: {review.initiativePerformance.activeInitiatives}</li>
                <li>Blocked: {review.initiativePerformance.blockedInitiatives}</li>
                <li>
                  Completed: {review.initiativePerformance.completedInitiatives}
                </li>
              </ul>
            </div>
          </section>

          <section style={twoColumnGrid}>
            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Decision Performance</h2>
              <p style={subMetaStyle}>
                Average effectiveness:{" "}
                {review.decisionPerformance.averageEffectiveness}/100
              </p>
              <ul style={listStyle}>
                <li>Total decisions: {review.decisionPerformance.totalDecisions}</li>
                <li>
                  Completed: {review.decisionPerformance.completedDecisions}
                </li>
                <li>
                  Follow-ups needed:{" "}
                  {review.decisionPerformance.decisionsNeedingFollowUp}
                </li>
                {review.decisionPerformance.strongestImpactArea && (
                  <li>
                    Strongest area: {review.decisionPerformance.strongestImpactArea}
                  </li>
                )}
                {review.decisionPerformance.weakestImpactArea && (
                  <li>
                    Weakest area: {review.decisionPerformance.weakestImpactArea}
                  </li>
                )}
              </ul>
            </div>

            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Learning Summary</h2>
              <p style={subMetaStyle}>
                {review.learningSummary.totalLessons} stored lesson
                {review.learningSummary.totalLessons === 1 ? "" : "s"}
              </p>
              {review.learningSummary.recommendedPractices.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No recommended practices from decision outcomes this quarter.
                </p>
              ) : (
                <ul style={listStyle}>
                  {review.learningSummary.recommendedPractices.map((item) => (
                    <li key={item.id}>
                      {item.title} ({item.effectiveness}/100)
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section style={twoColumnGrid}>
            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Wins</h2>
              {review.wins.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>No wins recorded.</p>
              ) : (
                <ul style={listStyle}>
                  {review.wins.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Losses</h2>
              {review.losses.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No losses recorded.
                </p>
              ) : (
                <ul style={listStyle}>
                  {review.losses.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Opportunities</h2>
            {review.opportunities.length === 0 ? (
              <p style={{ color: "var(--muted)", margin: 0 }}>
                No opportunities identified.
              </p>
            ) : (
              <ul style={listStyle}>
                {review.opportunities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Recommendations</h2>
            {review.recommendations.length === 0 ? (
              <p style={{ color: "var(--muted)", margin: 0 }}>
                No recommendations generated.
              </p>
            ) : (
              <ul style={listStyle}>
                {review.recommendations.map((item) => (
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
  display: "inline-flex",
  alignItems: "center",
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

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  fontWeight: 600,
  fontSize: 14,
}

const selectStyle: React.CSSProperties = {
  minWidth: 220,
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--card-background)",
  fontSize: 14,
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

const subMetaStyle: React.CSSProperties = {
  color: "var(--muted)",
  margin: "0 0 12px",
  lineHeight: 1.6,
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

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  lineHeight: 1.7,
}
