"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type BusinessMemoryEvent = {
  id: string
  type: string
  title: string
  summary: string
  severity: "positive" | "info" | "warning"
  entityType: string
  entityId: string
  createdAt: string
}

type BusinessMemory = {
  totalEvents: number
  businessHealth: number
  eventCounts: Record<string, number>
  recentEvents: BusinessMemoryEvent[]
  generatedAt: string
}

function formatEventType(type: string) {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function BusinessMemoryPage() {
  const [memory, setMemory] = useState<BusinessMemory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/executive/business-memory", {
        cache: "no-store",
      })
      const result = await response.json()

      setLoading(false)

      if (!result.ok) {
        setError(result.error || "Failed to load business memory")
        return
      }

      setMemory(result.memory)
    }

    load()
  }, [])

  const positiveSignals =
    memory?.recentEvents.filter((event) => event.severity === "positive") ?? []
  const riskSignals =
    memory?.recentEvents.filter((event) => event.severity === "warning") ?? []

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Business Memory</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Real business activity — invoices, projects, tasks, leads, and
          proposals — converted into a chronological executive memory stream.
        </p>
        <div style={actionRowStyle}>
          <Link href="/admin/command-center" style={secondaryLinkStyle}>
            Command Center
          </Link>
          <Link href="/admin/operations" style={secondaryLinkStyle}>
            Operations Center
          </Link>
          <Link href="/admin/executive-memory" style={secondaryLinkStyle}>
            Executive Memory
          </Link>
          <Link href="/admin/knowledge-graph" style={secondaryLinkStyle}>
            Knowledge Graph
          </Link>
          <Link href="/admin/revenue" style={secondaryLinkStyle}>
            Revenue
          </Link>
          <Link href="/admin/clients" style={secondaryLinkStyle}>
            Clients
          </Link>
        </div>
      </section>

      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}

      {loading && <p style={{ marginTop: 28 }}>Loading business memory...</p>}

      {!loading && memory && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Business Health</p>
              <h2>{memory.businessHealth}/100</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Total Events</p>
              <h2>{memory.totalEvents}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Positive Signals</p>
              <h2>{positiveSignals.length}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Risk Signals</p>
              <h2>{riskSignals.length}</h2>
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>Event Type Breakdown</h2>
            <div style={breakdownGrid}>
              {Object.entries(memory.eventCounts)
                .filter(([, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => (
                  <div key={type} style={breakdownCard}>
                    <p style={metaStyle}>{formatEventType(type)}</p>
                    <h3 style={{ margin: "6px 0 0" }}>{count}</h3>
                  </div>
                ))}
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>Recent Activity Stream</h2>
            {memory.recentEvents.length === 0 ? (
              <p style={mutedText}>No business activity recorded yet.</p>
            ) : (
              <ul style={listStyle}>
                {memory.recentEvents.map((event) => (
                  <li key={event.id} style={{ marginBottom: 10 }}>
                    <strong>{event.title}</strong>{" "}
                    <span style={severityBadge(event.severity)}>
                      {event.severity}
                    </span>{" "}
                    <span style={mutedText}>{formatDate(event.createdAt)}</span>
                    <p style={itemDetailStyle}>{event.summary}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>Positive Signals</h2>
            {positiveSignals.length === 0 ? (
              <p style={mutedText}>No positive signals in recent activity.</p>
            ) : (
              <ul style={listStyle}>
                {positiveSignals.map((event) => (
                  <li key={`positive-${event.id}`}>
                    <strong>{event.title}</strong>{" "}
                    <span style={mutedText}>{formatDate(event.createdAt)}</span>
                    <p style={itemDetailStyle}>{event.summary}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>Risk Signals</h2>
            {riskSignals.length === 0 ? (
              <p style={mutedText}>
                No risk signals — nothing overdue in recent activity.
              </p>
            ) : (
              <ul style={listStyle}>
                {riskSignals.map((event) => (
                  <li key={`risk-${event.id}`}>
                    <strong>{event.title}</strong>{" "}
                    <span style={mutedText}>{formatDate(event.createdAt)}</span>
                    <p style={itemDetailStyle}>{event.summary}</p>
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

const breakdownGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
  gap: 12,
  marginTop: 12,
}

const breakdownCard: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 16,
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

function severityBadge(
  severity: "positive" | "info" | "warning"
): React.CSSProperties {
  const palette = {
    positive: { background: "#dcfce7", color: "#15803d" },
    info: { background: "#dbeafe", color: "#1d4ed8" },
    warning: { background: "#fee2e2", color: "#b91c1c" },
  }[severity]

  return {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    ...palette,
  }
}
