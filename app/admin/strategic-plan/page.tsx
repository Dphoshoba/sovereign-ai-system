"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type {
  StrategicInitiative,
  StrategicPlan,
  SuccessMetric,
} from "@/lib/executive/strategic-plan"

export default function StrategicPlanPage() {
  const [plan, setPlan] = useState<StrategicPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [executionMessage, setExecutionMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPlan() {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/executive/strategic-plan", {
        cache: "no-store",
      })
      const result = await response.json()

      setLoading(false)

      if (!result.ok) {
        setError(result.error || "Failed to load strategic plan")
        return
      }

      setPlan(result.plan)
    }

    loadPlan()
  }, [])

  async function generateExecutionPlan() {
    setGenerating(true)
    setExecutionMessage(null)
    setError(null)

    const response = await fetch("/api/executive/execution/generate", {
      method: "POST",
    })
    const result = await response.json()

    setGenerating(false)

    if (!result.ok) {
      setError(result.error || "Failed to generate execution plan")
      return
    }

    setExecutionMessage(
      `Created ${result.createdCount} execution initiative${result.createdCount === 1 ? "" : "s"}${result.skippedCount > 0 ? ` (${result.skippedCount} duplicates skipped)` : ""}.`
    )
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Strategic Plan</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Rule-based operating plan synthesized from forecast, reviews,
          recommendations, and live platform data.
        </p>
        <div style={linkRowStyle}>
          <Link href="/admin/executive-forecast" style={linkStyle}>
            Executive Forecast
          </Link>
          <Link href="/admin/monthly-review" style={linkStyle}>
            Monthly Review
          </Link>
          <Link href="/admin/executive-overview" style={linkStyle}>
            Executive Overview
          </Link>
          <Link href="/admin/operations" style={linkStyle}>
            Operations Center
          </Link>
          <Link href="/admin/execution" style={linkStyle}>
            Execution Engine
          </Link>
          <Link href="/admin/goals" style={linkStyle}>
            Quarterly Goals
          </Link>
          <Link href="/admin/planning-cycles" style={linkStyle}>
            Planning Cycles
          </Link>
          <Link href="/admin/boardroom" style={linkStyle}>
            Executive Boardroom
          </Link>
        </div>
        <div style={actionRowStyle}>
          <button
            type="button"
            disabled={generating}
            onClick={generateExecutionPlan}
            style={primaryButtonStyle}
          >
            {generating ? "Generating..." : "Generate Execution Plan"}
          </button>
        </div>
      </section>

      {executionMessage && (
        <p style={successMessageStyle}>{executionMessage}</p>
      )}

      {loading && <p style={{ marginTop: 28 }}>Loading strategic plan...</p>}

      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}

      {plan && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Strategic Health</p>
              <h2 style={{ fontSize: 48, margin: "8px 0" }}>
                {plan.strategicHealth}
              </h2>
              <p style={subMetaStyle}>
                {plan.planningPeriod} · Generated {plan.generatedAt}
              </p>
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Executive Summary</h2>
            <p style={{ margin: 0, lineHeight: 1.7 }}>{plan.executiveSummary}</p>
          </section>

          <section style={twoColumnGrid}>
            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Objectives</h2>
              <ul style={listStyle}>
                {plan.objectives.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Priorities</h2>
              <ul style={listStyle}>
                {plan.priorities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <section style={{ marginTop: 28 }}>
            <h2>Initiatives</h2>
            {plan.initiatives.map((initiative) => (
              <InitiativeCard key={initiative.title} initiative={initiative} />
            ))}
          </section>

          <section style={twoColumnGrid}>
            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Risks</h2>
              {plan.risks.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No risks flagged from current forecast data.
                </p>
              ) : (
                <ul style={listStyle}>
                  {plan.risks.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Opportunities</h2>
              {plan.opportunities.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No opportunities identified from current data.
                </p>
              ) : (
                <ul style={listStyle}>
                  {plan.opportunities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section style={twoColumnGrid}>
            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Stop Doing</h2>
              {plan.stopDoing.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No stop-doing items flagged from current platform data.
                </p>
              ) : (
                <ul style={listStyle}>
                  {plan.stopDoing.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Success Metrics</h2>
              {plan.successMetrics.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No success metrics available from current data.
                </p>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {plan.successMetrics.map((metric) => (
                    <MetricRow key={metric.label} metric={metric} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  )
}

function InitiativeCard({ initiative }: { initiative: StrategicInitiative }) {
  return (
    <div style={initiativeCardStyle}>
      <h3 style={{ marginTop: 0 }}>{initiative.title}</h3>
      <p style={{ margin: "0 0 12px", lineHeight: 1.6 }}>{initiative.reason}</p>
      <ul style={listStyle}>
        {initiative.actions.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>
    </div>
  )
}

function MetricRow({ metric }: { metric: SuccessMetric }) {
  return (
    <div style={metricRowStyle}>
      <strong>{metric.label}</strong>
      <p style={{ margin: "4px 0 0" }}>
        {metric.currentValue} → {metric.targetValue}
      </p>
    </div>
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

const actionRowStyle: React.CSSProperties = {
  marginTop: 16,
}

const primaryButtonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  background: "var(--button-background)",
  color: "var(--button-foreground)",
  fontWeight: 700,
  cursor: "pointer",
}

const successMessageStyle: React.CSSProperties = {
  marginTop: 28,
  color: "#15803d",
  fontWeight: 600,
}

const metricsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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
  color: "var(--muted)",
  margin: "8px 0 0",
  fontSize: 14,
}

const panelStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
  marginTop: 28,
}

const twoColumnGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 16,
  marginTop: 28,
}

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  lineHeight: 1.7,
}

const initiativeCardStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
  marginTop: 16,
}

const metricRowStyle: React.CSSProperties = {
  padding: "12px 0",
  borderBottom: "1px solid var(--border)",
}
