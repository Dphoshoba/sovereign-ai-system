"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type RevenueRisk = {
  type: string
  title: string
  severity: "low" | "medium" | "high" | "critical"
  impact: string
  mitigation: string
}

type RevenueOpportunity = {
  type: string
  title: string
  value: number
  action: string
}

type RevenueIntelligence = {
  collectedRevenue: number
  outstandingRevenue: number
  pipelineValue: number
  forecastRevenue: number
  collectionRate: number
  revenueHealth: number
  risks: RevenueRisk[]
  opportunities: RevenueOpportunity[]
  trendSummary: string[]
  generatedAt: string
}

function formatAud(value: number) {
  return `$${value.toLocaleString()} AUD`
}

export default function RevenueIntelligencePage() {
  const [intelligence, setIntelligence] = useState<RevenueIntelligence | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/executive/revenue-intelligence", {
        cache: "no-store",
      })
      const result = await response.json()

      setLoading(false)

      if (!result.ok) {
        setError(result.error || "Failed to load revenue intelligence")
        return
      }

      setIntelligence(result.intelligence)
    }

    load()
  }, [])

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Revenue Intelligence</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Business data and business memory transformed into deterministic
          revenue intelligence — health, forecast, risks, and the fastest paths
          to new revenue.
        </p>
        <div style={actionRowStyle}>
          <Link href="/admin/command-center" style={secondaryLinkStyle}>
            Command Center
          </Link>
          <Link href="/admin/business-memory" style={secondaryLinkStyle}>
            Business Memory
          </Link>
          <Link href="/admin/executive-learning" style={secondaryLinkStyle}>
            Executive Learning
          </Link>
          <Link href="/admin/recommendation-improvement" style={secondaryLinkStyle}>
            Recommendation Improvement
          </Link>
          <Link href="/admin/revenue" style={secondaryLinkStyle}>
            Revenue
          </Link>
        </div>
      </section>

      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}

      {loading && (
        <p style={{ marginTop: 28 }}>Loading revenue intelligence...</p>
      )}

      {!loading && intelligence && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Revenue Health</p>
              <h2>{intelligence.revenueHealth}/100</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Forecast Revenue</p>
              <h2>{formatAud(intelligence.forecastRevenue)}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Collected Revenue</p>
              <h2>{formatAud(intelligence.collectedRevenue)}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Outstanding Revenue</p>
              <h2>{formatAud(intelligence.outstandingRevenue)}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Pipeline Value</p>
              <h2>{formatAud(intelligence.pipelineValue)}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Collection Rate</p>
              <h2>{intelligence.collectionRate}%</h2>
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>Revenue Risks</h2>
            {intelligence.risks.length === 0 ? (
              <p style={mutedText}>No revenue risks detected.</p>
            ) : (
              <ul style={listStyle}>
                {intelligence.risks.map((risk) => (
                  <li key={risk.type} style={{ marginBottom: 10 }}>
                    <strong>{risk.title}</strong>{" "}
                    <span style={severityBadge(risk.severity)}>
                      {risk.severity}
                    </span>
                    <p style={itemDetailStyle}>{risk.impact}</p>
                    <p style={itemDetailStyle}>
                      <em>Mitigation:</em> {risk.mitigation}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>Revenue Opportunities</h2>
            {intelligence.opportunities.length === 0 ? (
              <p style={mutedText}>No revenue opportunities detected.</p>
            ) : (
              <ul style={listStyle}>
                {intelligence.opportunities.map((opportunity) => (
                  <li key={opportunity.type} style={{ marginBottom: 10 }}>
                    <strong>{opportunity.title}</strong> —{" "}
                    {formatAud(opportunity.value)}
                    <p style={itemDetailStyle}>{opportunity.action}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>Trend Summary</h2>
            {intelligence.trendSummary.length === 0 ? (
              <p style={mutedText}>Not enough activity to summarize trends.</p>
            ) : (
              <ul style={listStyle}>
                {intelligence.trendSummary.map((trend) => (
                  <li key={trend}>{trend}</li>
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

function severityBadge(
  severity: "low" | "medium" | "high" | "critical"
): React.CSSProperties {
  const palette = {
    low: { background: "#dbeafe", color: "#1d4ed8" },
    medium: { background: "#fef9c3", color: "#a16207" },
    high: { background: "#ffedd5", color: "#c2410c" },
    critical: { background: "#fee2e2", color: "#b91c1c" },
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
