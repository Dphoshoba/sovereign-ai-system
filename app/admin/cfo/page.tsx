"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type CfoRisk = {
  type: string
  title: string
  severity: "low" | "medium" | "high" | "critical"
  impact: string
  mitigation: string
}

type CfoOpportunity = {
  type: string
  title: string
  value: number
  action: string
}

type CfoIntelligence = {
  financialHealth: number
  cashflowHealth: {
    score: number
    status: "Healthy" | "Stable" | "Warning" | "Critical"
  }
  revenueForecast: {
    next30Days: number
    next60Days: number
    next90Days: number
  }
  collectionsForecast: {
    expectedCollections: number
    collectionRate: number
    overdueExposure: number
  }
  clientValue: {
    highestValueClient: string | null
    averageClientValue: number
    totalClientValue: number
  }
  revenueConcentration: {
    largestClientPercent: number
    concentrationRisk: "low" | "medium" | "high"
  }
  risks: CfoRisk[]
  opportunities: CfoOpportunity[]
  recommendations: string[]
  generatedAt: string
}

function formatAud(value: number) {
  return `$${value.toLocaleString()} AUD`
}

export default function CfoPage() {
  const [cfo, setCfo] = useState<CfoIntelligence | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/executive/cfo", { cache: "no-store" })
      const result = await response.json()

      setLoading(false)

      if (!result.ok) {
        setError(result.error || "Failed to load CFO intelligence")
        return
      }

      setCfo(result.cfo)
    }

    load()
  }, [])

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>CFO Intelligence</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Financial intelligence above revenue intelligence — cashflow health,
          30/60/90 forecasts, client value, concentration, and CFO-level
          recommendations.
        </p>
        <div style={actionRowStyle}>
          <Link href="/admin/command-center" style={secondaryLinkStyle}>
            Command Center
          </Link>
          <Link href="/admin/revenue-intelligence" style={secondaryLinkStyle}>
            Revenue Intelligence
          </Link>
          <Link href="/admin/client-intelligence" style={secondaryLinkStyle}>
            Client Intelligence
          </Link>
          <Link href="/admin/automation-actions" style={secondaryLinkStyle}>
            Automation Actions
          </Link>
        </div>
      </section>

      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}

      {loading && <p style={{ marginTop: 28 }}>Loading CFO intelligence...</p>}

      {!loading && cfo && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Financial Health</p>
              <h2>{cfo.financialHealth}/100</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Cashflow Health</p>
              <h2>
                {cfo.cashflowHealth.score}/100{" "}
                <span style={statusBadge(cfo.cashflowHealth.status)}>
                  {cfo.cashflowHealth.status}
                </span>
              </h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>30-Day Forecast</p>
              <h2>{formatAud(cfo.revenueForecast.next30Days)}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>60-Day Forecast</p>
              <h2>{formatAud(cfo.revenueForecast.next60Days)}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>90-Day Forecast</p>
              <h2>{formatAud(cfo.revenueForecast.next90Days)}</h2>
            </div>
          </section>

          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Expected Collections</p>
              <h2>{formatAud(cfo.collectionsForecast.expectedCollections)}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Collection Rate</p>
              <h2>{cfo.collectionsForecast.collectionRate}%</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Overdue Exposure</p>
              <h2>{formatAud(cfo.collectionsForecast.overdueExposure)}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Revenue Concentration</p>
              <h2>
                {cfo.revenueConcentration.largestClientPercent}%{" "}
                <span style={riskBadge(cfo.revenueConcentration.concentrationRisk)}>
                  {cfo.revenueConcentration.concentrationRisk}
                </span>
              </h2>
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>Client Value</h2>
            <div style={breakdownGrid}>
              <div style={breakdownCard}>
                <p style={metaStyle}>Highest Value Client</p>
                <h3 style={{ margin: "6px 0 0" }}>
                  {cfo.clientValue.highestValueClient ?? "—"}
                </h3>
              </div>
              <div style={breakdownCard}>
                <p style={metaStyle}>Average Client Value</p>
                <h3 style={{ margin: "6px 0 0" }}>
                  {formatAud(cfo.clientValue.averageClientValue)}
                </h3>
              </div>
              <div style={breakdownCard}>
                <p style={metaStyle}>Total Client Value</p>
                <h3 style={{ margin: "6px 0 0" }}>
                  {formatAud(cfo.clientValue.totalClientValue)}
                </h3>
              </div>
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>CFO Recommendations</h2>
            <ol style={listStyle}>
              {cfo.recommendations.map((recommendation) => (
                <li key={recommendation} style={{ marginBottom: 8 }}>
                  {recommendation}
                </li>
              ))}
            </ol>
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>Financial Risks</h2>
            {cfo.risks.length === 0 ? (
              <p style={mutedText}>No financial risks detected.</p>
            ) : (
              <ul style={listStyle}>
                {cfo.risks.map((risk) => (
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
            <h2 style={sectionHeadingStyle}>Financial Opportunities</h2>
            {cfo.opportunities.length === 0 ? (
              <p style={mutedText}>No financial opportunities detected.</p>
            ) : (
              <ul style={listStyle}>
                {cfo.opportunities.map((opportunity) => (
                  <li key={opportunity.type} style={{ marginBottom: 10 }}>
                    <strong>{opportunity.title}</strong> —{" "}
                    {formatAud(opportunity.value)}
                    <p style={itemDetailStyle}>{opportunity.action}</p>
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
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
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
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
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

const badgeBase: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  verticalAlign: "middle",
}

function statusBadge(
  status: "Healthy" | "Stable" | "Warning" | "Critical"
): React.CSSProperties {
  const palette = {
    Healthy: { background: "#dcfce7", color: "#15803d" },
    Stable: { background: "#dbeafe", color: "#1d4ed8" },
    Warning: { background: "#ffedd5", color: "#c2410c" },
    Critical: { background: "#fee2e2", color: "#b91c1c" },
  }[status]

  return { ...badgeBase, ...palette }
}

function riskBadge(risk: "low" | "medium" | "high"): React.CSSProperties {
  const palette = {
    low: { background: "#dcfce7", color: "#15803d" },
    medium: { background: "#ffedd5", color: "#c2410c" },
    high: { background: "#fee2e2", color: "#b91c1c" },
  }[risk]

  return { ...badgeBase, ...palette }
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

  return { ...badgeBase, ...palette }
}
