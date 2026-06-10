"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type {
  ExecutiveTimelineItem,
  ExecutiveTimelineType,
} from "@/lib/executive/timeline"

const TYPE_LABELS: Record<ExecutiveTimelineType, string> = {
  boardroom_session: "Boardroom Session",
  quarterly_review: "Quarterly Review",
  planning_cycle: "Planning Cycle",
  decision: "Decision",
  lesson: "Lesson",
  strategy_adjustment: "Strategy Adjustment",
  strategic_scenario: "Strategic Scenario",
}

const TYPE_COLORS: Record<ExecutiveTimelineType, string> = {
  boardroom_session: "#1d4ed8",
  quarterly_review: "#7c3aed",
  planning_cycle: "#0f766e",
  decision: "#b45309",
  lesson: "#15803d",
  strategy_adjustment: "#be185d",
  strategic_scenario: "#4338ca",
}

const TYPE_ORDER = Object.keys(TYPE_LABELS) as ExecutiveTimelineType[]

export default function ExecutiveTimelinePage() {
  const [items, setItems] = useState<ExecutiveTimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>("all")

  useEffect(() => {
    async function loadTimeline() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/executive/timeline", {
          cache: "no-store",
        })
        const result = await response.json()

        setLoading(false)

        if (!result.ok) {
          setError(result.error || "Failed to load executive timeline")
          return
        }

        setItems(result.items)
      } catch {
        setLoading(false)
        setError("Failed to load executive timeline")
      }
    }

    loadTimeline()
  }, [])

  const countsByType = TYPE_ORDER.map((type) => ({
    type,
    count: items.filter((item) => item.type === type).length,
  }))

  const visibleItems =
    typeFilter === "all"
      ? items
      : items.filter((item) => item.type === typeFilter)

  function formatDate(value: string) {
    return new Date(value).toLocaleString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Memory · Phase 21.2</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Executive Timeline</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Single chronological memory stream — boardroom sessions, quarterly
          reviews, planning cycles, decisions, lessons, strategy adjustments,
          and strategic scenarios, newest first.
        </p>
        <div style={actionRowStyle}>
          <Link href="/admin/command-center" style={primaryLinkStyle}>
            Command Center
          </Link>
          <Link href="/admin/runtime" style={secondaryLinkStyle}>
            V1 Runtime
          </Link>
          <Link href="/admin/operations" style={secondaryLinkStyle}>
            Operations Center
          </Link>
          <Link href="/admin/executive-memory" style={secondaryLinkStyle}>
            Executive Memory
          </Link>
        </div>
      </section>

      {loading && <p style={{ marginTop: 28 }}>Loading executive timeline...</p>}
      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}

      {!loading && !error && (
        <>
          <section style={metricsGrid}>
            {countsByType.map(({ type, count }) => (
              <button
                key={type}
                type="button"
                onClick={() =>
                  setTypeFilter(typeFilter === type ? "all" : type)
                }
                style={{
                  ...summaryCardStyle,
                  outline:
                    typeFilter === type
                      ? `2px solid ${TYPE_COLORS[type]}`
                      : "none",
                }}
              >
                <p style={{ ...metaStyle, color: TYPE_COLORS[type] }}>
                  {TYPE_LABELS[type]}
                </p>
                <h2 style={{ fontSize: 32, margin: "6px 0 0" }}>{count}</h2>
              </button>
            ))}
          </section>

          {typeFilter !== "all" && (
            <p style={{ marginTop: 16, color: "var(--muted)" }}>
              Filtering by {TYPE_LABELS[typeFilter as ExecutiveTimelineType]} —{" "}
              <button
                type="button"
                onClick={() => setTypeFilter("all")}
                style={clearFilterStyle}
              >
                show all
              </button>
            </p>
          )}

          <section style={{ marginTop: 20 }}>
            {visibleItems.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>
                No timeline events recorded yet.
              </p>
            ) : (
              visibleItems.map((item) => (
                <div key={`${item.type}-${item.id}`} style={eventCardStyle}>
                  <div style={eventHeaderStyle}>
                    <span
                      style={{
                        ...typeBadgeStyle,
                        background: TYPE_COLORS[item.type],
                      }}
                    >
                      {TYPE_LABELS[item.type]}
                    </span>
                    {item.status && (
                      <span style={statusBadgeStyle}>{item.status}</span>
                    )}
                    <span
                      style={{
                        color: "var(--muted)",
                        fontSize: 14,
                        marginLeft: "auto",
                      }}
                    >
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <h2 style={{ margin: "10px 0 0", fontSize: 20 }}>
                    {item.title}
                  </h2>
                  {item.summary && (
                    <p style={{ margin: "8px 0 0", lineHeight: 1.6 }}>
                      {item.summary}
                    </p>
                  )}
                  <div style={eventFooterStyle}>
                    {item.impact && (
                      <span style={{ color: "var(--muted)", fontSize: 14 }}>
                        Impact: {item.impact}
                      </span>
                    )}
                    <Link href={item.link} style={detailLinkStyle}>
                      Open {TYPE_LABELS[item.type]} →
                    </Link>
                  </div>
                </div>
              ))
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

const metricsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: 12,
  marginTop: 28,
}

const summaryCardStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 18,
  textAlign: "left",
  cursor: "pointer",
}

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  fontSize: 12,
  fontWeight: 700,
  margin: 0,
}

const clearFilterStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--link, #1d4ed8)",
  cursor: "pointer",
  padding: 0,
  fontSize: "inherit",
  textDecoration: "underline",
}

const eventCardStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 22,
  marginTop: 14,
}

const eventHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
}

const typeBadgeStyle: React.CSSProperties = {
  color: "#fff",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1,
  padding: "4px 10px",
  borderRadius: 999,
}

const statusBadgeStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 1,
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid var(--border)",
  color: "var(--muted)",
}

const eventFooterStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 12,
}

const detailLinkStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  textDecoration: "none",
  color: "var(--link, #1d4ed8)",
}
