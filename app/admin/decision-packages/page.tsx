"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type DecisionPackage = {
  id: string
  title: string
  category: string
  priority: string
  decisionRequired: string
  rationale: string
  evidence: string[]
  expectedImpact: string
  confidence: number
  recommendation: string
  status: string
}

type DecisionPackageSummary = {
  total: number
  byStatus: Record<string, number>
  byCategory: Record<string, number>
  readyForBoardroom: number
  averageConfidence: number
}

const STATUS_ORDER = [
  "Ready For Boardroom",
  "Draft",
  "Approved",
  "Rejected",
  "Implemented",
]

const EMPTY_SUMMARY: DecisionPackageSummary = {
  total: 0,
  byStatus: {},
  byCategory: {},
  readyForBoardroom: 0,
  averageConfidence: 0,
}

export default function DecisionPackagesPage() {
  const [packages, setPackages] = useState<DecisionPackage[]>([])
  const [summary, setSummary] = useState<DecisionPackageSummary>(EMPTY_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/executive/decision-packages", {
          cache: "no-store",
        })
        const result = await response.json()

        if (!result.ok) {
          setError(result.error || "Failed to load decision packages")
          return
        }

        setPackages(result.packages ?? [])
        setSummary(result.summary ?? EMPTY_SUMMARY)
      } catch {
        setError("Failed to load decision packages")
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
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Decision Packages</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Boardroom decision automation — strategic adjustments, critical
          risks, and high-scoring opportunities converted into boardroom-ready
          decision packages. Deterministic and rule-based.
        </p>
        <div style={actionRowStyle}>
          <Link href="/admin/boardroom" style={secondaryLinkStyle}>
            Boardroom
          </Link>
          <Link href="/admin/strategy-adjustments" style={secondaryLinkStyle}>
            Strategy Adjustments
          </Link>
          <Link href="/admin/autonomous-review" style={secondaryLinkStyle}>
            Autonomous Review
          </Link>
          <Link href="/admin/executive-memory" style={secondaryLinkStyle}>
            Executive Memory
          </Link>
          <Link href="/admin/command-center" style={secondaryLinkStyle}>
            Command Center
          </Link>
        </div>
      </section>

      <section style={metricsGrid}>
        <div style={metricCard}>
          <p style={metaStyle}>Total Packages</p>
          <h2>{summary.total}</h2>
        </div>
        <div style={metricCard}>
          <p style={metaStyle}>Ready For Boardroom</p>
          <h2>{summary.readyForBoardroom}</h2>
        </div>
        <div style={metricCard}>
          <p style={metaStyle}>Drafts</p>
          <h2>{summary.byStatus["Draft"] ?? 0}</h2>
        </div>
        <div style={metricCard}>
          <p style={metaStyle}>Avg Confidence</p>
          <h2>{Math.round(summary.averageConfidence * 100)}%</h2>
        </div>
      </section>

      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}
      {loading && <p style={{ marginTop: 28 }}>Loading decision packages...</p>}

      {!loading && packages.length === 0 && !error && (
        <p style={{ marginTop: 28, color: "var(--muted)" }}>
          No decision packages generated — all engine rules passed.
        </p>
      )}

      {!loading &&
        STATUS_ORDER.map((status) => {
          const items = packages.filter((item) => item.status === status)

          if (items.length === 0) {
            return null
          }

          return (
            <section key={status}>
              <h2 style={{ marginTop: 44 }}>
                {status} ({items.length})
              </h2>

              {items.map((item) => (
                <section key={item.id} style={cardStyle}>
                  <div style={cardHeaderStyle}>
                    <div>
                      <p style={metaStyle}>{item.category}</p>
                      <h3 style={{ margin: "8px 0", fontSize: 22 }}>
                        {item.title}
                      </h3>
                      <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
                        {item.rationale}
                      </p>
                    </div>
                    <div style={badgeColumnStyle}>
                      <span style={statusBadgeStyle(item.status)}>
                        {item.status}
                      </span>
                      <span style={pillBadgeStyle}>
                        {item.priority} priority
                      </span>
                      <span style={pillBadgeStyle}>
                        {Math.round(item.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>

                  <div style={{ ...panelStyle, marginTop: 16 }}>
                    <h4 style={sectionHeadingStyle}>Decision Required</h4>
                    <p style={{ margin: 0, lineHeight: 1.6 }}>
                      {item.decisionRequired}
                    </p>
                  </div>

                  <div style={{ ...panelStyle, marginTop: 16 }}>
                    <h4 style={sectionHeadingStyle}>Evidence</h4>
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
                    <strong>Recommendation:</strong> {item.recommendation}
                  </p>
                  <p style={{ marginTop: 8, lineHeight: 1.6 }}>
                    <strong>Expected impact:</strong> {item.expectedImpact}
                  </p>
                </section>
              ))}
            </section>
          )
        })}
    </main>
  )
}

function statusBadgeStyle(status: string): React.CSSProperties {
  const colors: Record<string, { background: string; color: string }> = {
    "Ready For Boardroom": { background: "#fef3c7", color: "#92400e" },
    Draft: { background: "#dbeafe", color: "#1d4ed8" },
    Approved: { background: "#dcfce7", color: "#166534" },
    Rejected: { background: "#fee2e2", color: "#b91c1c" },
    Implemented: { background: "#f3e8ff", color: "#7e22ce" },
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
  textTransform: "capitalize",
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

const cardStyle: React.CSSProperties = {
  marginTop: 20,
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

const panelStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: 18,
}

const sectionHeadingStyle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 15,
}

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  lineHeight: 1.7,
}
