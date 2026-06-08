"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type DeliveryIntelligence = {
  healthScore: number
  activeProjects: number
  completedProjects: number
  overdueTasks: number
  overdueInvoices: number
  atRiskProjects: number
  totalRevenueOutstanding: number
  recommendations: string[]
  alerts: string[]
  opportunities: string[]
}

export default function DeliveryIntelligencePage() {
  const [intelligence, setIntelligence] = useState<DeliveryIntelligence | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadIntelligence() {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/delivery/intelligence", {
        cache: "no-store",
      })
      const result = await response.json()

      setLoading(false)

      if (!result.ok) {
        setError(result.error || "Failed to load delivery intelligence")
        return
      }

      setIntelligence(result.intelligence)
    }

    loadIntelligence()
  }, [])

  function formatAud(value: number) {
    return `AUD ${(value || 0).toLocaleString("en-AU")}`
  }

  function healthLabel(score: number) {
    if (score >= 80) return "Healthy"
    if (score >= 50) return "Needs Attention"
    return "At Risk"
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Client Delivery OS</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Delivery Intelligence
        </h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          AI-style health scoring, alerts, and recommendations across client
          projects, tasks, and invoices.
        </p>
        <Link href="/admin/delivery" style={linkStyle}>
          ← Back to Delivery Dashboard
        </Link>
      </section>

      {loading && <p style={{ marginTop: 28 }}>Loading intelligence...</p>}

      {error && (
        <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>
      )}

      {intelligence && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Health Score</p>
              <h2>{intelligence.healthScore}</h2>
              <p style={subMetaStyle}>{healthLabel(intelligence.healthScore)}</p>
            </div>

            <div style={metricCard}>
              <p style={metaStyle}>Outstanding Revenue</p>
              <h2>{formatAud(intelligence.totalRevenueOutstanding)}</h2>
            </div>

            <div style={metricCard}>
              <p style={metaStyle}>Overdue Tasks</p>
              <h2>{intelligence.overdueTasks}</h2>
            </div>

            <div style={metricCard}>
              <p style={metaStyle}>Overdue Invoices</p>
              <h2>{intelligence.overdueInvoices}</h2>
            </div>

            <div style={metricCard}>
              <p style={metaStyle}>At Risk Projects</p>
              <h2>{intelligence.atRiskProjects}</h2>
            </div>

            <div style={metricCard}>
              <p style={metaStyle}>Active Projects</p>
              <h2>{intelligence.activeProjects}</h2>
            </div>

            <div style={metricCard}>
              <p style={metaStyle}>Completed Projects</p>
              <h2>{intelligence.completedProjects}</h2>
            </div>
          </section>

          <section style={panelGrid}>
            <article style={panelStyle}>
              <h2 style={panelTitleStyle}>Recommendations</h2>
              {intelligence.recommendations.length === 0 ? (
                <p style={emptyStyle}>No recommendations right now.</p>
              ) : (
                <ul style={listStyle}>
                  {intelligence.recommendations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </article>

            <article style={panelStyle}>
              <h2 style={panelTitleStyle}>Alerts</h2>
              {intelligence.alerts.length === 0 ? (
                <p style={emptyStyle}>No urgent alerts.</p>
              ) : (
                <ul style={listStyle}>
                  {intelligence.alerts.map((item) => (
                    <li key={item} style={alertItemStyle}>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article style={panelStyle}>
              <h2 style={panelTitleStyle}>Opportunities</h2>
              {intelligence.opportunities.length === 0 ? (
                <p style={emptyStyle}>No opportunities identified yet.</p>
              ) : (
                <ul style={listStyle}>
                  {intelligence.opportunities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </article>
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

const linkStyle: React.CSSProperties = {
  display: "inline-block",
  marginTop: 16,
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

const subMetaStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "var(--muted)",
  fontSize: 14,
}

const panelGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 16,
  marginTop: 28,
}

const panelStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const panelTitleStyle: React.CSSProperties = {
  marginTop: 0,
}

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  lineHeight: 1.7,
}

const emptyStyle: React.CSSProperties = {
  color: "var(--muted)",
  margin: 0,
}

const alertItemStyle: React.CSSProperties = {
  color: "#b91c1c",
  fontWeight: 600,
}
