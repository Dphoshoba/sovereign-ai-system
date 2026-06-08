"use client"

import { useEffect, useState } from "react"

type Forecast = {
  id: string
  title: string
  forecastType: string
  timeframe: string
  confidence: number
  summary: string | null
  prediction: any
  recommendations: any
  createdAt: string
}

type Simulation = {
  id: string
  title: string
  scenario: string
  results: any
  riskLevel: string
  recommendation: string | null
  createdAt: string
}

export default function PredictiveIntelligencePage() {
  const [forecasts, setForecasts] = useState<Forecast[]>([])
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [scenario, setScenario] = useState(
    "What happens if Echoes & Visions doubles creator lead volume within 90 days?"
  )
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const response = await fetch("/api/predictive-intelligence")
    const result = await response.json()

    if (result.ok) {
      setForecasts(result.forecasts)
      setSimulations(result.simulations)
    }
  }

  async function generateForecasts() {
    setLoading(true)

    const response = await fetch("/api/predictive-intelligence", {
      method: "POST",
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Forecast generation failed")
      return
    }

    await loadData()
  }

  async function runSimulation() {
    setLoading(true)

    const response = await fetch("/api/predictive-intelligence/simulate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scenario,
      }),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Simulation failed")
      return
    }

    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Strategic Foresight</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Predictive Intelligence + Strategic Forecasting
        </h1>

        <p style={{ color: "var(--hero-muted)", maxWidth: 880, lineHeight: 1.7 }}>
          Forecast creator growth, operational risks, revenue trajectories and
          future scaling conditions before they occur.
        </p>
      </section>

      <section style={toolbarStyle}>
        <button
          disabled={loading}
          onClick={generateForecasts}
          style={buttonStyle}
        >
          {loading ? "Generating..." : "Generate Forecasts"}
        </button>

        <button
          disabled={loading}
          onClick={loadData}
          style={secondaryButton}
        >
          Refresh
        </button>
      </section>

      <section style={panelStyle}>
        <h2>Strategic Simulation</h2>

        <textarea
          rows={5}
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          style={inputStyle}
        />

        <button
          disabled={loading}
          onClick={runSimulation}
          style={buttonStyle}
        >
          Run Simulation
        </button>
      </section>

      <section style={{ marginTop: 34 }}>
        <h2>Forecasts</h2>

        <div style={{ display: "grid", gap: 16 }}>
          {forecasts.map((forecast) => (
            <article key={forecast.id} style={cardStyle}>
              <p style={metaStyle}>
                {forecast.forecastType} · {forecast.timeframe}
              </p>

              <h3>{forecast.title}</h3>

              <p>
                <strong>Confidence:</strong>{" "}
                {(forecast.confidence * 100).toFixed(0)}%
              </p>

              {forecast.summary ? (
                <div style={summaryBox}>
                  <strong>Forecast Summary</strong>
                  <p>{forecast.summary}</p>
                </div>
              ) : null}

              {forecast.prediction?.riskFactors?.length ? (
                <>
                  <h4>Risk Factors</h4>

                  <ul style={{ lineHeight: 1.8 }}>
                    {forecast.prediction.riskFactors.map(
                      (item: string, index: number) => (
                        <li key={index}>{item}</li>
                      )
                    )}
                  </ul>
                </>
              ) : null}

              {forecast.prediction?.opportunities?.length ? (
                <>
                  <h4>Opportunities</h4>

                  <ul style={{ lineHeight: 1.8 }}>
                    {forecast.prediction.opportunities.map(
                      (item: string, index: number) => (
                        <li key={index}>{item}</li>
                      )
                    )}
                  </ul>
                </>
              ) : null}

              {forecast.recommendations?.length ? (
                <>
                  <h4>Recommendations</h4>

                  <ul style={{ lineHeight: 1.8 }}>
                    {forecast.recommendations.map(
                      (item: string, index: number) => (
                        <li key={index}>{item}</li>
                      )
                    )}
                  </ul>
                </>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 34 }}>
        <h2>Strategic Simulations</h2>

        <div style={{ display: "grid", gap: 16 }}>
          {simulations.map((simulation) => (
            <article key={simulation.id} style={cardStyle}>
              <p style={metaStyle}>{simulation.riskLevel}</p>

              <h3>{simulation.title}</h3>

              <p style={{ lineHeight: 1.7 }}>{simulation.scenario}</p>

              {simulation.results ? (
                <div style={summaryBox}>
                  <strong>Simulation Results</strong>

                  <p>
                    <strong>Best Case:</strong>{" "}
                    {simulation.results.bestCase}
                  </p>

                  <p>
                    <strong>Expected Case:</strong>{" "}
                    {simulation.results.expectedCase}
                  </p>

                  <p>
                    <strong>Worst Case:</strong>{" "}
                    {simulation.results.worstCase}
                  </p>
                </div>
              ) : null}

              {simulation.recommendation ? (
                <p>
                  <strong>Recommendation:</strong>{" "}
                  {simulation.recommendation}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>
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

const toolbarStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 28,
  marginBottom: 28,
}

const panelStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 10,
  border: "1px solid var(--border)",
  marginBottom: 14,
  fontSize: 15,
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  cursor: "pointer",
  fontWeight: "bold",
}

const secondaryButton: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "1px solid #111",
  background: "var(--card-background)",
  color: "var(--foreground)",
  cursor: "pointer",
  fontWeight: "bold",
}

const cardStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const summaryBox: React.CSSProperties = {
  background: "var(--card-background)",
  borderRadius: 12,
  padding: 16,
  marginTop: 12,
  marginBottom: 12,
}

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "var(--muted)",
  fontSize: 13,
  margin: 0,
}