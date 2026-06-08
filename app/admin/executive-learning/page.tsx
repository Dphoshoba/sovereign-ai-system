"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"

type ImpactPattern = {
  impactArea: string
  averageEffectiveness: number
  decisionCount: number
}

type RecommendedPractice = {
  id: string
  title: string
  lesson: string
  impactArea: string | null
  effectiveness: number
}

type DecisionLesson = {
  id: string
  title: string
  lessonLearned: string
  impactArea: string | null
  effectiveness: number | null
}

type ExecutiveLessonRecord = {
  id: string
  title: string
  category: string | null
  lesson: string
  impactArea: string | null
  effectiveness: number | null
  sourceDecisionId: string | null
  createdAt: string
}

type ExecutiveLearningSummary = {
  totalLessons: number
  strongestPatterns: ImpactPattern[]
  weakestPatterns: ImpactPattern[]
  recommendedPractices: RecommendedPractice[]
  lessons: DecisionLesson[]
}

export default function ExecutiveLearningPage() {
  const [learning, setLearning] = useState<ExecutiveLearningSummary | null>(
    null
  )
  const [storedLessons, setStoredLessons] = useState<ExecutiveLessonRecord[]>(
    []
  )
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadLearning = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await fetch("/api/executive/learning", {
      cache: "no-store",
    })
    const result = await response.json()

    setLoading(false)

    if (!result.ok) {
      setError(result.error || "Failed to load executive learning")
      return
    }

    setLearning(result.learning)
    setStoredLessons(result.storedLessons ?? [])
  }, [])

  useEffect(() => {
    loadLearning()
  }, [loadLearning])

  async function generateLessons() {
    setGenerating(true)
    setError(null)
    setMessage(null)

    const response = await fetch("/api/executive/learning", {
      method: "POST",
    })
    const result = await response.json()

    setGenerating(false)

    if (!result.ok) {
      setError(result.error || "Failed to generate lessons")
      return
    }

    setLearning(result.learning)
    setStoredLessons(result.storedLessons ?? [])
    setMessage(
      result.created > 0
        ? `Generated ${result.created} new executive lesson${result.created === 1 ? "" : "s"}.`
        : "No new lessons to generate — all eligible decisions already have records."
    )
  }

  const weakestAreas = new Set(
    learning?.weakestPatterns.map((pattern) => pattern.impactArea) ?? []
  )

  const areasRequiringImprovement =
    learning?.lessons.filter(
      (lesson) =>
        lesson.impactArea !== null && weakestAreas.has(lesson.impactArea)
    ) ?? []

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Executive Learning</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Extract lessons and patterns from executive decision history to build
          institutional learning over time.
        </p>
        <div style={actionRowStyle}>
          <button
            type="button"
            style={primaryButtonStyle}
            disabled={generating}
            onClick={generateLessons}
          >
            {generating ? "Generating..." : "Generate Lessons"}
          </button>
          <Link href="/admin/boardroom" style={secondaryLinkStyle}>
            Run Boardroom Session
          </Link>
          <Link href="/admin/decision-memory" style={secondaryLinkStyle}>
            Decision Memory
          </Link>
          <Link href="/admin/decision-outcomes" style={secondaryLinkStyle}>
            Decision Outcomes
          </Link>
          <Link href="/admin/boardroom" style={secondaryLinkStyle}>
            Executive Boardroom
          </Link>
          <Link href="/admin/operations" style={secondaryLinkStyle}>
            Operations Center
          </Link>
        </div>
      </section>

      {message && <p style={successMessageStyle}>{message}</p>}
      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}

      {loading && <p style={{ marginTop: 28 }}>Loading executive learning...</p>}

      {!loading && learning && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Total Lessons</p>
              <h2>{learning.totalLessons}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Decision Lessons</p>
              <h2>{learning.lessons.length}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Recommended Practices</p>
              <h2>{learning.recommendedPractices.length}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>High Performing Practices</p>
              <h2>{learning.recommendedPractices.length}</h2>
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>Strongest Patterns</h2>
            {learning.strongestPatterns.length === 0 ? (
              <p style={mutedText}>
                No scored impact areas yet. Complete decisions with impact areas
                and effectiveness scores.
              </p>
            ) : (
              <ul style={listStyle}>
                {learning.strongestPatterns.map((pattern) => (
                  <li key={pattern.impactArea}>
                    <strong>{pattern.impactArea}</strong> —{" "}
                    {pattern.averageEffectiveness}% average effectiveness (
                    {pattern.decisionCount} decision
                    {pattern.decisionCount === 1 ? "" : "s"})
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>Weakest Patterns</h2>
            {learning.weakestPatterns.length === 0 ? (
              <p style={mutedText}>Not enough impact area data to rank patterns.</p>
            ) : (
              <ul style={listStyle}>
                {learning.weakestPatterns.map((pattern) => (
                  <li key={pattern.impactArea}>
                    <strong>{pattern.impactArea}</strong> —{" "}
                    {pattern.averageEffectiveness}% average effectiveness (
                    {pattern.decisionCount} decision
                    {pattern.decisionCount === 1 ? "" : "s"})
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={{ marginTop: 28 }}>
            <h2>Recommended Practices</h2>
            {learning.recommendedPractices.length === 0 ? (
              <p style={mutedText}>
                No practices with effectiveness of 80% or higher recorded yet.
              </p>
            ) : (
              <ul style={listStyle}>
                {learning.recommendedPractices.map((practice) => (
                  <li key={practice.id}>
                    <strong>{practice.title}</strong>
                    {practice.impactArea && ` (${practice.impactArea})`}
                    {` — ${practice.effectiveness}% effectiveness`}
                    <p style={itemDetailStyle}>{practice.lesson}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={{ marginTop: 28 }}>
            <h2>Lessons Learned</h2>
            {learning.lessons.length === 0 ? (
              <p style={mutedText}>
                No completed decisions with lessons recorded yet.
              </p>
            ) : (
              <ul style={listStyle}>
                {learning.lessons.map((lesson) => (
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
            <h2>High Performing Practices</h2>
            {learning.recommendedPractices.length === 0 ? (
              <p style={mutedText}>
                No high-performing practices identified yet.
              </p>
            ) : (
              <ul style={listStyle}>
                {learning.recommendedPractices.map((practice) => (
                  <li key={`high-${practice.id}`}>
                    <strong>{practice.title}</strong>
                    {practice.impactArea && ` (${practice.impactArea})`}
                    {` — ${practice.effectiveness}% effectiveness`}
                    <p style={itemDetailStyle}>{practice.lesson}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={{ marginTop: 28 }}>
            <h2>Areas Requiring Improvement</h2>
            {areasRequiringImprovement.length === 0 ? (
              <p style={mutedText}>
                No lessons linked to weakest impact areas yet.
              </p>
            ) : (
              <ul style={listStyle}>
                {areasRequiringImprovement.map((lesson) => (
                  <li key={`improve-${lesson.id}`}>
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

          {storedLessons.length > 0 && (
            <section style={{ marginTop: 28 }}>
              <h2>Stored Executive Lessons</h2>
              <ul style={listStyle}>
                {storedLessons.map((lesson) => (
                  <li key={lesson.id}>
                    <strong>{lesson.title}</strong>
                    {lesson.category && ` [${lesson.category}]`}
                    {lesson.impactArea && ` (${lesson.impactArea})`}
                    {lesson.effectiveness !== null &&
                      ` — ${lesson.effectiveness}% effectiveness`}
                    <p style={itemDetailStyle}>{lesson.lesson}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
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
  fontWeight: 600,
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
