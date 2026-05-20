"use client"

import { useEffect, useState } from "react"
import {
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  PageShell,
  StatusBadge,
} from "@/components/executive-ui"

export default function WorldModelPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [modelType, setModelType] = useState("planetary-strategic-simulation")
  const [horizon, setHorizon] = useState("12-months")

  async function loadData() {
    const res = await fetch("/api/world-model")
    const result = await res.json()

    if (result.ok) {
      setData(result)
    }
  }

  async function runWorldModel() {
    setLoading(true)

    const res = await fetch("/api/world-model", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ modelType, horizon }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "World model simulation failed")
      return
    }

    await loadData()
  }

  async function activateRecommendation(id: string) {
    setLoading(true)

    const res = await fetch("/api/world-model/activate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recommendationId: id }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Activation failed")
      return
    }

    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  const latest = data?.runs?.[0]
  const signals = data?.signals || []
  const scenarios = data?.scenarios || []
  const recommendations = data?.recommendations || []

  return (
    <PageShell
      eyebrow="Planetary Strategic Simulation"
      title="Sovereign World Model Engine"
      description="Build macro strategic models, simulate civilization-scale trajectories and translate external conditions into governed strategic action."
    >
      <ExecutiveGrid min={220}>
        <MetricCard label="Stability Index" value={latest?.stabilityIndex || 0} />
        <MetricCard label="Opportunity Index" value={latest?.opportunityIndex || 0} />
        <MetricCard label="Risk Index" value={latest?.riskIndex || 0} />
        <MetricCard
          label="Confidence"
          value={`${Math.round((latest?.confidenceScore || 0) * 100)}%`}
        />
        <MetricCard label="Signals" value={signals.length} />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="World Model Runtime" eyebrow="Macro simulation">
          <select
            value={modelType}
            onChange={(e) => setModelType(e.target.value)}
            style={inputStyle}
          >
            <option value="planetary-strategic-simulation">
              Planetary Strategic Simulation
            </option>
            <option value="ai-economy-shift">
              AI Economy Shift
            </option>
            <option value="creator-economy-future">
              Creator Economy Future
            </option>
            <option value="governance-instability-model">
              Governance Instability Model
            </option>
            <option value="technology-disruption-map">
              Technology Disruption Map
            </option>
          </select>

          <select
            value={horizon}
            onChange={(e) => setHorizon(e.target.value)}
            style={inputStyle}
          >
            <option value="6-months">6 months</option>
            <option value="12-months">12 months</option>
            <option value="3-years">3 years</option>
            <option value="5-years">5 years</option>
          </select>

          <button disabled={loading} onClick={runWorldModel} style={buttonStyle}>
            {loading ? "Modeling..." : "Run World Model"}
          </button>

          {latest ? (
            <div style={cardStyle}>
              <StatusBadge status={latest.status} />
              <h3>{latest.title}</h3>
              <p>{latest.summary}</p>

              {latest.assumptions ? (
                <>
                  <h4>Assumptions</h4>
                  <ul style={{ lineHeight: 1.8 }}>
                    {latest.assumptions.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </>
              ) : null}

              {latest.findings ? (
                <pre style={preStyle}>
                  {JSON.stringify(latest.findings, null, 2)}
                </pre>
              ) : null}
            </div>
          ) : null}
        </ExecutiveCard>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Planetary Signals" eyebrow="Macro inputs">
            <div style={{ display: "grid", gap: 12 }}>
              {signals.map((signal: any) => (
                <div key={signal.id} style={cardStyle}>
                  <StatusBadge status={signal.severity} />
                  <h3>{signal.title}</h3>
                  <p>{signal.summary}</p>
                  <p style={{ color: "#666" }}>
                    {signal.domain} · {signal.signalType} · Relevance{" "}
                    {signal.relevanceScore}/100 · Confidence{" "}
                    {Math.round((signal.confidence || 0) * 100)}%
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Civilization Scenarios" eyebrow="Future branches">
            <div style={{ display: "grid", gap: 12 }}>
              {scenarios.map((scenario: any) => (
                <div key={scenario.id} style={cardStyle}>
                  <StatusBadge status={scenario.impactLevel} />
                  <h3>{scenario.title}</h3>
                  <p>{scenario.narrative}</p>
                  <p style={{ color: "#666" }}>
                    {scenario.scenarioType} · Probability{" "}
                    {Math.round((scenario.probability || 0) * 100)}%
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="World Model Recommendations" eyebrow="Governed strategic response">
          <div style={{ display: "grid", gap: 12 }}>
            {recommendations.map((item: any) => (
              <div key={item.id} style={cardStyle}>
                <StatusBadge status={item.status} />
                <h3>{item.title}</h3>
                <p>{item.rationale}</p>
                <p style={{ color: "#666" }}>
                  {item.recommendationType} · {item.executionWindow}
                </p>

                {item.status === "proposed" ? (
                  <button
                    disabled={loading}
                    onClick={() => activateRecommendation(item.id)}
                    style={buttonStyle}
                  >
                    Activate Recommendation
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </ExecutiveCard>
      </div>
    </PageShell>
  )
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 12,
  border: "none",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
}

const inputStyle: React.CSSProperties = {
  width: 280,
  padding: 12,
  borderRadius: 12,
  border: "1px solid #ddd",
  marginRight: 12,
  marginBottom: 12,
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 16,
  padding: 18,
  background: "#fafafa",
}

const preStyle: React.CSSProperties = {
  background: "#111",
  color: "#fff",
  padding: 16,
  borderRadius: 14,
  overflowX: "auto",
  whiteSpace: "pre-wrap",
}