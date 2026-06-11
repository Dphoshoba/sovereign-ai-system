"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Severity = "low" | "medium" | "high" | "critical"

type CooBottleneck = {
  type: string
  title: string
  severity: Severity
  impact: string
  resolution: string
}

type CooRisk = {
  type: string
  title: string
  severity: Severity
  impact: string
  mitigation: string
}

type CooOpportunity = {
  type: string
  title: string
  value: number
  action: string
}

type CooIntelligence = {
  operationsHealth: number
  deliveryHealth: {
    score: number
    status: "Healthy" | "Stable" | "Warning" | "Critical"
  }
  workloadHealth: {
    score: number
    openTasks: number
    highPriorityTasks: number
    overdueTasks: number
    operationalLoad: number
  }
  projectForecast: {
    activeProjects: number
    overdueProjects: number
    completionRisk: "low" | "medium" | "high"
    deliveryCapacity: number
  }
  taskForecast: {
    open: number
    inProgress: number
    completed: number
    overdue: number
    highPriority: number
  }
  bottlenecks: CooBottleneck[]
  risks: CooRisk[]
  opportunities: CooOpportunity[]
  recommendations: string[]
  generatedAt: string
}

function formatAud(value: number) {
  return `$${value.toLocaleString()} AUD`
}

export default function CooPage() {
  const [coo, setCoo] = useState<CooIntelligence | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/executive/coo", { cache: "no-store" })
      const result = await response.json()

      setLoading(false)

      if (!result.ok) {
        setError(result.error || "Failed to load COO intelligence")
        return
      }

      setCoo(result.coo)
    }

    load()
  }, [])

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>COO Intelligence</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Operations intelligence above business memory, client intelligence,
          and automation actions — delivery health, workload, bottlenecks, and
          COO-level recommendations.
        </p>
        <div style={actionRowStyle}>
          <Link href="/admin/command-center" style={secondaryLinkStyle}>
            Command Center
          </Link>
          <Link href="/admin/operations" style={secondaryLinkStyle}>
            Operations Center
          </Link>
          <Link href="/admin/client-intelligence" style={secondaryLinkStyle}>
            Client Intelligence
          </Link>
          <Link href="/admin/automation-actions" style={secondaryLinkStyle}>
            Automation Actions
          </Link>
          <Link href="/admin/cfo" style={secondaryLinkStyle}>
            CFO Intelligence
          </Link>
        </div>
      </section>

      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}

      {loading && <p style={{ marginTop: 28 }}>Loading COO intelligence...</p>}

      {!loading && coo && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Operations Health</p>
              <h2>{coo.operationsHealth}/100</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Delivery Health</p>
              <h2>
                {coo.deliveryHealth.score}/100{" "}
                <span style={statusBadge(coo.deliveryHealth.status)}>
                  {coo.deliveryHealth.status}
                </span>
              </h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Workload Health</p>
              <h2>{coo.workloadHealth.score}/100</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Delivery Capacity</p>
              <h2>{coo.projectForecast.deliveryCapacity}/100</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Completion Risk</p>
              <h2>
                <span style={riskBadge(coo.projectForecast.completionRisk)}>
                  {coo.projectForecast.completionRisk}
                </span>
              </h2>
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>Project Forecast</h2>
            <div style={breakdownGrid}>
              <div style={breakdownCard}>
                <p style={metaStyle}>Active Projects</p>
                <h3 style={{ margin: "6px 0 0" }}>
                  {coo.projectForecast.activeProjects}
                </h3>
              </div>
              <div style={breakdownCard}>
                <p style={metaStyle}>Overdue Projects</p>
                <h3 style={{ margin: "6px 0 0" }}>
                  {coo.projectForecast.overdueProjects}
                </h3>
              </div>
              <div style={breakdownCard}>
                <p style={metaStyle}>Operational Load</p>
                <h3 style={{ margin: "6px 0 0" }}>
                  {coo.workloadHealth.operationalLoad}/100
                </h3>
              </div>
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>Task Forecast</h2>
            <div style={breakdownGrid}>
              <div style={breakdownCard}>
                <p style={metaStyle}>Open</p>
                <h3 style={{ margin: "6px 0 0" }}>{coo.taskForecast.open}</h3>
              </div>
              <div style={breakdownCard}>
                <p style={metaStyle}>In Progress</p>
                <h3 style={{ margin: "6px 0 0" }}>
                  {coo.taskForecast.inProgress}
                </h3>
              </div>
              <div style={breakdownCard}>
                <p style={metaStyle}>Completed</p>
                <h3 style={{ margin: "6px 0 0" }}>
                  {coo.taskForecast.completed}
                </h3>
              </div>
              <div style={breakdownCard}>
                <p style={metaStyle}>Overdue</p>
                <h3 style={{ margin: "6px 0 0" }}>{coo.taskForecast.overdue}</h3>
              </div>
              <div style={breakdownCard}>
                <p style={metaStyle}>High Priority</p>
                <h3 style={{ margin: "6px 0 0" }}>
                  {coo.taskForecast.highPriority}
                </h3>
              </div>
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>COO Recommendations</h2>
            <ol style={listStyle}>
              {coo.recommendations.map((recommendation) => (
                <li key={recommendation} style={{ marginBottom: 8 }}>
                  {recommendation}
                </li>
              ))}
            </ol>
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>Bottlenecks</h2>
            {coo.bottlenecks.length === 0 ? (
              <p style={mutedText}>No delivery bottlenecks detected.</p>
            ) : (
              <ul style={listStyle}>
                {coo.bottlenecks.map((bottleneck) => (
                  <li key={bottleneck.type} style={{ marginBottom: 10 }}>
                    <strong>{bottleneck.title}</strong>{" "}
                    <span style={severityBadge(bottleneck.severity)}>
                      {bottleneck.severity}
                    </span>
                    <p style={itemDetailStyle}>{bottleneck.impact}</p>
                    <p style={itemDetailStyle}>
                      <em>Resolution:</em> {bottleneck.resolution}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>Operations Risks</h2>
            {coo.risks.length === 0 ? (
              <p style={mutedText}>No operations risks detected.</p>
            ) : (
              <ul style={listStyle}>
                {coo.risks.map((risk) => (
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
            <h2 style={sectionHeadingStyle}>Operations Opportunities</h2>
            {coo.opportunities.length === 0 ? (
              <p style={mutedText}>No operations opportunities detected.</p>
            ) : (
              <ul style={listStyle}>
                {coo.opportunities.map((opportunity) => (
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

function severityBadge(severity: Severity): React.CSSProperties {
  const palette = {
    low: { background: "#dbeafe", color: "#1d4ed8" },
    medium: { background: "#fef9c3", color: "#a16207" },
    high: { background: "#ffedd5", color: "#c2410c" },
    critical: { background: "#fee2e2", color: "#b91c1c" },
  }[severity]

  return { ...badgeBase, ...palette }
}
