"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { ExecutiveForecast } from "@/lib/executive/forecast"

export default function ExecutiveForecastPage() {
  const [forecast, setForecast] = useState<ExecutiveForecast | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadForecast() {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/executive/forecast", {
        cache: "no-store",
      })
      const result = await response.json()

      setLoading(false)

      if (!result.ok) {
        setError(result.error || "Failed to load executive forecast")
        return
      }

      setForecast(result.forecast)
    }

    loadForecast()
  }, [])

  function confidenceColor(confidence: ExecutiveForecast["confidence"]) {
    if (confidence === "High") {
      return "#15803d"
    }

    if (confidence === "Low") {
      return "#b91c1c"
    }

    return "var(--foreground)"
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Executive Forecast</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Rule-based 30-day forecast using archived briefings, platform
          snapshot, revenue, growth, and delivery intelligence.
        </p>
        <div style={linkRowStyle}>
          <Link href="/admin/executive-overview" style={linkStyle}>
            Executive Overview
          </Link>
          <Link href="/admin/monthly-review" style={linkStyle}>
            Monthly Review
          </Link>
          <Link href="/admin/operations" style={linkStyle}>
            Operations Center
          </Link>
          <Link href="/admin/strategic-plan" style={linkStyle}>
            Strategic Plan
          </Link>
          <Link href="/admin/simulations" style={linkStyle}>
            Simulations
          </Link>
        </div>
      </section>

      {loading && <p style={{ marginTop: 28 }}>Loading forecast...</p>}

      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}

      {forecast && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Forecast Health Score</p>
              <h2 style={{ fontSize: 48, margin: "8px 0" }}>
                {forecast.forecastHealthScore}
              </h2>
              <p style={subMetaStyle}>
                Next {forecast.forecastPeriodDays} days from {forecast.forecastDate}
              </p>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Confidence</p>
              <h2 style={{ color: confidenceColor(forecast.confidence) }}>
                {forecast.confidence}
              </h2>
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Executive Outlook</h2>
            <p style={{ margin: 0, lineHeight: 1.7 }}>
              {forecast.executiveOutlook}
            </p>
          </section>

          <section style={movementGrid}>
            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Growth Forecast</h2>
              <p style={{ margin: 0, lineHeight: 1.7 }}>
                {forecast.growthForecast}
              </p>
            </div>
            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Revenue Forecast</h2>
              <p style={{ margin: 0, lineHeight: 1.7 }}>
                {forecast.revenueForecast}
              </p>
            </div>
            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Delivery Forecast</h2>
              <p style={{ margin: 0, lineHeight: 1.7 }}>
                {forecast.deliveryForecast}
              </p>
            </div>
          </section>

          <section style={twoColumnGrid}>
            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Risks</h2>
              {forecast.riskForecast.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No rule-based risks flagged from current data.
                </p>
              ) : (
                <ul style={listStyle}>
                  {forecast.riskForecast.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Opportunities</h2>
              {forecast.opportunityForecast.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No opportunities identified from current platform data.
                </p>
              ) : (
                <ul style={listStyle}>
                  {forecast.opportunityForecast.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Recommended Focus Areas</h2>
            {forecast.recommendedFocusAreas.length === 0 ? (
              <p style={{ color: "var(--muted)", margin: 0 }}>
                No focus areas available from current data.
              </p>
            ) : (
              <ul style={listStyle}>
                {forecast.recommendedFocusAreas.map((item) => (
                  <li key={item}>{item}</li>
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

const movementGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 16,
  marginTop: 28,
}

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  lineHeight: 1.7,
}
