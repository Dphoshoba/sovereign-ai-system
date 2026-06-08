"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { DailyBriefing } from "@/lib/executive/daily-briefing"

type ArchivedBriefing = {
  id: string
  briefingDate: string
  healthScore: number
  openingSummary: string
  urgentCount: number
  todayCount: number
  briefingJson: DailyBriefing
  createdAt: string
}

function formatBriefingDate(value: string) {
  return new Date(value).toLocaleDateString("en-AU", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function computeTrendLabel(
  briefings: ArchivedBriefing[]
): {
  label: "Improving" | "Stable" | "Declining"
  change: number
  sevenDayAverage: number | null
} {
  if (briefings.length === 0) {
    return { label: "Stable", change: 0, sevenDayAverage: null }
  }

  const sorted = [...briefings].sort(
    (a, b) =>
      new Date(a.briefingDate).getTime() - new Date(b.briefingDate).getTime()
  )

  const oldest = sorted[0]
  const newest = sorted[sorted.length - 1]
  const change = newest.healthScore - oldest.healthScore

  const recent = sorted.slice(-7)
  const sevenDayAverage =
    recent.length > 0
      ? Math.round(
          recent.reduce((sum, item) => sum + item.healthScore, 0) /
            recent.length
        )
      : null

  let label: "Improving" | "Stable" | "Declining" = "Stable"

  if (change >= 5) {
    label = "Improving"
  } else if (change <= -5) {
    label = "Declining"
  }

  return { label, change, sevenDayAverage }
}

export default function DailyBriefingHistoryPage() {
  const [briefings, setBriefings] = useState<ArchivedBriefing[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadArchive() {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/executive/daily-briefing/archive", {
        cache: "no-store",
      })
      const result = await response.json()

      setLoading(false)

      if (!result.ok) {
        setError(result.error || "Failed to load briefing history")
        return
      }

      setBriefings(result.briefings)
    }

    loadArchive()
  }, [])

  const summary = useMemo(() => {
    if (briefings.length === 0) {
      return {
        latest: 0,
        average: 0,
        best: 0,
        worst: 0,
      }
    }

    const scores = briefings.map((item) => item.healthScore)

    return {
      latest: briefings[0].healthScore,
      average: Math.round(
        scores.reduce((sum, score) => sum + score, 0) / scores.length
      ),
      best: Math.max(...scores),
      worst: Math.min(...scores),
    }
  }, [briefings])

  const trend = useMemo(() => computeTrendLabel(briefings), [briefings])

  const selectedBriefing = briefings.find((item) => item.id === selectedId)

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Briefing History</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Review archived daily briefings and track business health over time.
        </p>
        <div style={linkRowStyle}>
          <Link href="/admin/daily-briefing" style={linkStyle}>
            ← Back to Daily Briefing
          </Link>
          <Link href="/admin/weekly-review" style={linkStyle}>
            Weekly Review
          </Link>
          <Link href="/admin/monthly-review" style={linkStyle}>
            Monthly Review
          </Link>
        </div>
      </section>

      {loading && <p style={{ marginTop: 28 }}>Loading history...</p>}

      {error && (
        <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>
      )}

      {!loading && !error && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Latest Health Score</p>
              <h2>{summary.latest}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Average Health Score</p>
              <h2>{summary.average}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Best Health Score</p>
              <h2>{summary.best}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Worst Health Score</p>
              <h2>{summary.worst}</h2>
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Health Score Trend</h2>
            <p style={{ margin: "0 0 8px" }}>
              <strong>Trend:</strong> {trend.label}
            </p>
            <p style={{ margin: "0 0 8px" }}>
              <strong>Change (oldest → newest):</strong>{" "}
              {trend.change > 0 ? "+" : ""}
              {trend.change}
            </p>
            <p style={{ margin: 0 }}>
              <strong>7-day average:</strong>{" "}
              {trend.sevenDayAverage ?? "Not enough data"}
            </p>
          </section>

          <section style={{ marginTop: 32 }}>
            <h2>Archived Briefings</h2>

            {briefings.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>
                No archived briefings yet. Archive today&apos;s briefing from the
                daily briefing page.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Health Score</th>
                      <th style={thStyle}>Urgent Count</th>
                      <th style={thStyle}>Today Count</th>
                      <th style={thStyle}>Opening Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {briefings.map((item) => (
                      <tr
                        key={item.id}
                        style={{
                          ...rowStyle,
                          background:
                            selectedId === item.id
                              ? "var(--border)"
                              : "transparent",
                        }}
                        onClick={() => setSelectedId(item.id)}
                      >
                        <td style={tdStyle}>
                          {formatBriefingDate(item.briefingDate)}
                        </td>
                        <td style={tdStyle}>{item.healthScore}</td>
                        <td style={tdStyle}>{item.urgentCount}</td>
                        <td style={tdStyle}>{item.todayCount}</td>
                        <td style={tdStyle}>{item.openingSummary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {selectedBriefing && (
            <section style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>
                Archived Briefing —{" "}
                {formatBriefingDate(selectedBriefing.briefingDate)}
              </h2>

              <p>{selectedBriefing.briefingJson.openingSummary}</p>

              <h3>Top Priorities</h3>
              <ul style={listStyle}>
                {selectedBriefing.briefingJson.topPriorities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <h3>Risks</h3>
              <ul style={listStyle}>
                {selectedBriefing.briefingJson.risks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <h3>Wins</h3>
              <ul style={listStyle}>
                {selectedBriefing.briefingJson.wins.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <h3>Recommended Actions</h3>
              <ul style={listStyle}>
                {selectedBriefing.briefingJson.recommendedActions.map(
                  (item) => (
                    <li key={item}>{item}</li>
                  )
                )}
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

const linkRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 20,
  flexWrap: "wrap",
  marginTop: 16,
}

const linkStyle: React.CSSProperties = {
  color: "var(--button-foreground)",
  fontWeight: 600,
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

const panelStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
  marginTop: 28,
}

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: 16,
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 10px",
  borderBottom: "2px solid var(--border)",
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "var(--muted)",
}

const tdStyle: React.CSSProperties = {
  padding: "14px 10px",
  borderBottom: "1px solid var(--border)",
  verticalAlign: "top",
}

const rowStyle: React.CSSProperties = {
  cursor: "pointer",
}

const listStyle: React.CSSProperties = {
  margin: "0 0 16px",
  paddingLeft: 20,
  lineHeight: 1.7,
}
