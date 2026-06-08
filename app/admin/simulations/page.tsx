"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"

type SimulationScenario = {
  id: string
  label: string
  description: string
}

type StrategicSimulationResult = {
  scenario: string
  scenarioLabel: string
  baseline: Record<string, string | number>
  simulated: Record<string, string | number>
  estimatedImpact: Record<string, string | number>
  benefits: string[]
  risks: string[]
  recommendedActions: string[]
}

export default function SimulationsPage() {
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([])
  const [selectedScenario, setSelectedScenario] = useState("")
  const [simulation, setSimulation] = useState<StrategicSimulationResult | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadScenarios = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await fetch("/api/executive/simulations", {
      cache: "no-store",
    })
    const result = await response.json()

    setLoading(false)

    if (!result.ok) {
      setError(result.error || "Failed to load simulation scenarios")
      return
    }

    setScenarios(result.scenarios ?? [])
    setSelectedScenario((current) => current || result.scenarios?.[0]?.id || "")
  }, [])

  useEffect(() => {
    loadScenarios()
  }, [loadScenarios])

  async function runSimulation() {
    if (!selectedScenario) {
      return
    }

    setRunning(true)
    setError(null)

    const response = await fetch("/api/executive/simulations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scenario: selectedScenario }),
    })
    const result = await response.json()

    setRunning(false)

    if (!result.ok) {
      setError(result.error || "Failed to run simulation")
      return
    }

    setSimulation(result.simulation)
  }

  function renderMetricBlock(
    title: string,
    metrics: Record<string, string | number>
  ) {
    return (
      <div style={panelStyle}>
        <h2 style={sectionHeadingStyle}>{title}</h2>
        <ul style={listStyle}>
          {Object.entries(metrics).map(([key, value]) => (
            <li key={key}>
              <strong>{formatMetricLabel(key)}:</strong> {formatMetricValue(value)}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Strategic Simulations</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Rule-based what-if simulations using live platform data — forecast
          growth, revenue, delivery, initiatives, and content outcomes before
          acting.
        </p>
        <div style={actionRowStyle}>
          <Link href="/admin/executive-forecast" style={secondaryLinkStyle}>
            Executive Forecast
          </Link>
          <Link href="/admin/strategic-plan" style={secondaryLinkStyle}>
            Strategic Plan
          </Link>
          <Link href="/admin/knowledge-graph-intelligence" style={secondaryLinkStyle}>
            Knowledge Intelligence
          </Link>
          <Link href="/admin/operations" style={secondaryLinkStyle}>
            Operations Center
          </Link>
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <div style={controlRowStyle}>
          <label style={labelStyle}>
            Scenario
            <select
              value={selectedScenario}
              onChange={(event) => setSelectedScenario(event.target.value)}
              style={selectStyle}
              disabled={loading || scenarios.length === 0}
            >
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            style={primaryButtonStyle}
            disabled={running || !selectedScenario}
            onClick={runSimulation}
          >
            {running ? "Running..." : "Run Simulation"}
          </button>
        </div>

        {scenarios.find((scenario) => scenario.id === selectedScenario)
          ?.description && (
          <p style={scenarioDescriptionStyle}>
            {
              scenarios.find((scenario) => scenario.id === selectedScenario)
                ?.description
            }
          </p>
        )}
      </section>

      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}

      {loading && <p style={{ marginTop: 28 }}>Loading scenarios...</p>}

      {simulation && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Scenario</p>
              <h2 style={{ fontSize: 24, margin: "8px 0" }}>
                {simulation.scenarioLabel}
              </h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Baseline Metrics</p>
              <h2>{Object.keys(simulation.baseline).length}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Simulated Metrics</p>
              <h2>{Object.keys(simulation.simulated).length}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Impact Fields</p>
              <h2>{Object.keys(simulation.estimatedImpact).length}</h2>
            </div>
          </section>

          <section style={panelGridStyle}>
            {renderMetricBlock("Baseline Metrics", simulation.baseline)}
            {renderMetricBlock("Simulated Metrics", simulation.simulated)}
            {renderMetricBlock("Estimated Impact", simulation.estimatedImpact)}
          </section>

          <section style={panelGridStyle}>
            <div style={panelStyle}>
              <h2 style={sectionHeadingStyle}>Benefits</h2>
              <ul style={listStyle}>
                {simulation.benefits.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div style={panelStyle}>
              <h2 style={sectionHeadingStyle}>Risks</h2>
              <ul style={listStyle}>
                {simulation.risks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>Recommended Actions</h2>
            <ul style={listStyle}>
              {simulation.recommendedActions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  )
}

function formatMetricLabel(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .replace(/Aud/g, "AUD")
}

function formatMetricValue(value: string | number) {
  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      return value.toLocaleString("en-AU")
    }

    return value.toLocaleString("en-AU", {
      maximumFractionDigits: 2,
    })
  }

  return value
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

const controlRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "flex-end",
}

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  fontWeight: 600,
  fontSize: 14,
}

const selectStyle: React.CSSProperties = {
  minWidth: 280,
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--card-background)",
  fontSize: 14,
}

const primaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  background: "var(--button-background)",
  color: "var(--button-foreground)",
  fontWeight: 600,
  cursor: "pointer",
}

const scenarioDescriptionStyle: React.CSSProperties = {
  marginTop: 12,
  color: "var(--muted)",
  lineHeight: 1.6,
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

const panelGridStyle: React.CSSProperties = {
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

const sectionHeadingStyle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 18,
}

const listStyle: React.CSSProperties = {
  margin: "12px 0 0",
  paddingLeft: 20,
  lineHeight: 1.7,
}
