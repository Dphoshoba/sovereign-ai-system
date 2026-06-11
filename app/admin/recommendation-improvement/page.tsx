"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type PatternAdjustment = {
  pattern: string
  reason: string
  source: string
}

type CategoryWeight = {
  category: string
  weight: number
  averageEffectiveness: number
  decisionCount: number
}

type DecisionLessonLink = {
  decisionTitle: string
  lesson: string
  effect: "boost" | "suppress"
  effectiveness: number
}

type RecommendationImprovement = {
  improvementScore: number
  confidence: number
  improvedRecommendationRules: string[]
  suppressedRecommendationPatterns: PatternAdjustment[]
  boostedRecommendationPatterns: PatternAdjustment[]
  categoryWeights: CategoryWeight[]
  decisionLessons: DecisionLessonLink[]
  nextRecommendationGuidance: string[]
}

export default function RecommendationImprovementPage() {
  const [improvement, setImprovement] =
    useState<RecommendationImprovement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/executive/recommendation-improvement", {
        cache: "no-store",
      })
      const result = await response.json()

      setLoading(false)

      if (!result.ok) {
        setError(result.error || "Failed to load recommendation improvements")
        return
      }

      setImprovement(result.improvement)
    }

    load()
  }, [])

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Recommendation Improvement
        </h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Executive learning outcomes feed back into the recommendation layer —
          boosting proven patterns, suppressing weak ones, and reweighting
          categories by execution results.
        </p>
        <div style={actionRowStyle}>
          <Link href="/admin/executive-learning" style={secondaryLinkStyle}>
            Executive Learning
          </Link>
          <Link href="/admin/decision-execution" style={secondaryLinkStyle}>
            Decision Execution
          </Link>
          <Link href="/admin/command-center" style={secondaryLinkStyle}>
            Command Center
          </Link>
          <Link href="/admin/operations" style={secondaryLinkStyle}>
            Operations Center
          </Link>
          <Link href="/admin/revenue-intelligence" style={secondaryLinkStyle}>
            Revenue Intelligence
          </Link>
        </div>
      </section>

      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}

      {loading && (
        <p style={{ marginTop: 28 }}>Loading recommendation improvements...</p>
      )}

      {!loading && improvement && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Improvement Score</p>
              <h2>{improvement.improvementScore}/100</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Confidence</p>
              <h2>{Math.round(improvement.confidence * 100)}%</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Boosted Patterns</p>
              <h2>{improvement.boostedRecommendationPatterns.length}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Suppressed Patterns</p>
              <h2>{improvement.suppressedRecommendationPatterns.length}</h2>
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>Boosted Recommendation Patterns</h2>
            {improvement.boostedRecommendationPatterns.length === 0 ? (
              <p style={mutedText}>
                No proven patterns to boost yet — implement decisions and record
                effectiveness.
              </p>
            ) : (
              <ul style={listStyle}>
                {improvement.boostedRecommendationPatterns.map((item) => (
                  <li key={item.pattern}>
                    <strong>{item.pattern}</strong>{" "}
                    <span style={boostBadge}>boost</span>
                    <p style={itemDetailStyle}>
                      {item.reason} ({item.source})
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>
              Suppressed Recommendation Patterns
            </h2>
            {improvement.suppressedRecommendationPatterns.length === 0 ? (
              <p style={mutedText}>No underperforming patterns to suppress.</p>
            ) : (
              <ul style={listStyle}>
                {improvement.suppressedRecommendationPatterns.map((item) => (
                  <li key={item.pattern}>
                    <strong>{item.pattern}</strong>{" "}
                    <span style={suppressBadge}>suppress</span>
                    <p style={itemDetailStyle}>
                      {item.reason} ({item.source})
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>Category Weights</h2>
            {improvement.categoryWeights.length === 0 ? (
              <p style={mutedText}>
                No scored categories yet — record decision effectiveness to
                build weights.
              </p>
            ) : (
              <ul style={listStyle}>
                {improvement.categoryWeights.map((item) => (
                  <li key={item.category}>
                    <strong>{item.category}</strong> — weight x{item.weight}
                    <p style={itemDetailStyle}>
                      {item.averageEffectiveness}/100 average effectiveness
                      across {item.decisionCount} decision
                      {item.decisionCount === 1 ? "" : "s"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>Improved Recommendation Rules</h2>
            {improvement.improvedRecommendationRules.length === 0 ? (
              <p style={mutedText}>No rule adjustments generated yet.</p>
            ) : (
              <ul style={listStyle}>
                {improvement.improvedRecommendationRules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            )}
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>Decision Lessons</h2>
            {improvement.decisionLessons.length === 0 ? (
              <p style={mutedText}>No scored lessons linked to decisions yet.</p>
            ) : (
              <ul style={listStyle}>
                {improvement.decisionLessons.map((item) => (
                  <li key={`${item.decisionTitle}-${item.lesson}`}>
                    <strong>{item.decisionTitle}</strong> —{" "}
                    {item.effectiveness}/100{" "}
                    <span
                      style={item.effect === "boost" ? boostBadge : suppressBadge}
                    >
                      {item.effect}
                    </span>
                    <p style={itemDetailStyle}>{item.lesson}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>Future Recommendation Guidance</h2>
            {improvement.nextRecommendationGuidance.length === 0 ? (
              <p style={mutedText}>No guidance generated yet.</p>
            ) : (
              <ul style={listStyle}>
                {improvement.nextRecommendationGuidance.map((guidance) => (
                  <li key={guidance}>{guidance}</li>
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

const badgeBase: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 0.5,
}

const boostBadge: React.CSSProperties = {
  ...badgeBase,
  background: "#dcfce7",
  color: "#15803d",
}

const suppressBadge: React.CSSProperties = {
  ...badgeBase,
  background: "#fee2e2",
  color: "#b91c1c",
}
