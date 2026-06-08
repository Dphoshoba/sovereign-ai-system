"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"

type DecisionOutcomeLesson = {
  id: string
  title: string
  lessonLearned: string
  impactArea: string | null
  effectiveness: number | null
}

type DecisionOutcomeFollowUp = {
  id: string
  title: string
  actionTaken: string | null
  reviewDate: string | null
  impactArea: string | null
  status: string
}

type DecisionOutcomeSummary = {
  totalDecisions: number
  completedDecisions: number
  decisionsNeedingFollowUp: number
  averageEffectiveness: number
  strongestImpactArea: string | null
  weakestImpactArea: string | null
  lessons: DecisionOutcomeLesson[]
  followUps: DecisionOutcomeFollowUp[]
}

export default function DecisionOutcomesPage() {
  const [summary, setSummary] = useState<DecisionOutcomeSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSummary = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await fetch("/api/executive/decision-outcomes", {
      cache: "no-store",
    })
    const result = await response.json()

    setLoading(false)

    if (!result.ok) {
      setError(result.error || "Failed to load decision outcomes")
      return
    }

    setSummary(result.summary)
  }, [])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  function formatDate(value: string | null) {
    if (!value) {
      return "Not set"
    }

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
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Decision Outcomes</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Track outcomes, lessons learned, and follow-up actions from executive
          decisions over time.
        </p>
        <div style={actionRowStyle}>
          <Link href="/admin/decision-memory" style={secondaryLinkStyle}>
            Decision Memory
          </Link>
          <Link href="/admin/executive-learning" style={secondaryLinkStyle}>
            Executive Learning
          </Link>
          <Link href="/admin/boardroom" style={secondaryLinkStyle}>
            Executive Boardroom
          </Link>
          <Link href="/admin/operations" style={secondaryLinkStyle}>
            Operations Center
          </Link>
        </div>
      </section>

      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}

      {loading && <p style={{ marginTop: 28 }}>Loading decision outcomes...</p>}

      {!loading && summary && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Total Decisions</p>
              <h2>{summary.totalDecisions}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Completed Decisions</p>
              <h2>{summary.completedDecisions}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Needs Follow Up</p>
              <h2>{summary.decisionsNeedingFollowUp}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Average Effectiveness</p>
              <h2>{summary.averageEffectiveness}%</h2>
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>Impact</h2>
            <p style={{ margin: "0 0 8px" }}>
              <strong>Strongest Impact Area:</strong>{" "}
              {summary.strongestImpactArea ?? "Not enough scored impact areas"}
            </p>
            <p style={{ margin: 0 }}>
              <strong>Weakest Impact Area:</strong>{" "}
              {summary.weakestImpactArea ?? "Not enough scored impact areas"}
            </p>
          </section>

          <section style={{ marginTop: 28 }}>
            <h2>Lessons Learned</h2>
            {summary.lessons.length === 0 ? (
              <p style={mutedText}>
                No completed decisions with lessons recorded yet.
              </p>
            ) : (
              <ul style={listStyle}>
                {summary.lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <strong>{lesson.title}</strong>
                    {lesson.impactArea && ` (${lesson.impactArea})`}
                    {lesson.effectiveness !== null &&
                      ` — ${lesson.effectiveness}% effectiveness`}
                    <p style={itemDetailStyle}>{lesson.lessonLearned}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={{ marginTop: 28 }}>
            <h2>Follow Ups Required</h2>
            {summary.followUps.length === 0 ? (
              <p style={mutedText}>No decisions currently flagged for follow-up.</p>
            ) : (
              <ul style={listStyle}>
                {summary.followUps.map((item) => (
                  <li key={item.id}>
                    <strong>{item.title}</strong> — {item.status}
                    {item.impactArea && ` (${item.impactArea})`}
                    {item.actionTaken && (
                      <p style={itemDetailStyle}>
                        Action taken: {item.actionTaken}
                      </p>
                    )}
                    <p style={itemDetailStyle}>
                      Review date: {formatDate(item.reviewDate)}
                    </p>
                  </li>
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

const panelStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
  marginTop: 28,
}

const sectionHeadingStyle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 18,
}

const mutedText: React.CSSProperties = {
  color: "var(--muted)",
}

const listStyle: React.CSSProperties = {
  margin: "12px 0 0",
  paddingLeft: 20,
  lineHeight: 1.7,
}

const itemDetailStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "var(--muted)",
}
