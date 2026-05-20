"use client"

import { useEffect, useState } from "react"
import {
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  PageShell,
  StatusBadge,
} from "@/components/executive-ui"

export default function TemporalIntelligencePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [simulationType, setSimulationType] = useState(
    "strategic-future-projection"
  )

  async function loadData() {
    const res = await fetch("/api/temporal-intelligence")
    const result = await res.json()

    if (result.ok) {
      setData(result)
    }
  }

  async function runSimulation() {
    setLoading(true)

    const res = await fetch("/api/temporal-intelligence", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        simulationType,
        timelineHorizon: "12-months",
      }),
    })

    const result = await res.json()

    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Simulation failed")
      return
    }

    await loadData()
  }

  async function activateRecommendation(id: string) {
    setLoading(true)

    const res = await fetch("/api/temporal-intelligence/activate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recommendationId: id,
      }),
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

  return (
    <PageShell
      eyebrow="Future Strategic Simulation"
      title="Temporal Intelligence Engine"
      description="Model strategic futures, economic trajectories, organizational evolution and operational stability across time."
    >
      <ExecutiveGrid min={220}>
        <MetricCard
          label="Stability Score"
          value={latest?.stabilityScore || 0}
        />
        <MetricCard
          label="Strategic Health"
          value={latest?.strategicHealth || 0}
        />
        <MetricCard
          label="Economic Projection"
          value={`AUD ${Math.round(
            latest?.economicProjection || 0
          ).toLocaleString("en-AU")}`}
        />
        <MetricCard
          label="Confidence"
          value={`${Math.round(
            (latest?.confidenceScore || 0) * 100
          )}%`}
        />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard
          title="Temporal Simulation Runtime"
          eyebrow="Strategic futures"
        >
          <select
            value={simulationType}
            onChange={(e) => setSimulationType(e.target.value)}
            style={inputStyle}
          >
            <option value="strategic-future-projection">
              Strategic Future Projection
            </option>

            <option value="economic-growth-simulation">
              Economic Growth Simulation
            </option>

            <option value="governance-stability-test">
              Governance Stability Test
            </option>

            <option value="market-disruption-model">
              Market Disruption Model
            </option>

            <option value="enterprise-expansion">
              Enterprise Expansion
            </option>
          </select>

          <button
            disabled={loading}
            onClick={runSimulation}
            style={buttonStyle}
          >
            {loading ? "Simulating..." : "Run Temporal Simulation"}
          </button>

          {latest ? (
            <div style={cardStyle}>
              <StatusBadge status={latest.status} />
              <h3>{latest.title}</h3>
              <p>{latest.summary}</p>

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
          <ExecutiveCard
            title="Future Scenarios"
            eyebrow="Timeline branches"
          >
            <div style={{ display: "grid", gap: 12 }}>
              {data?.scenarios?.map((item: any) => (
                <div key={item.id} style={cardStyle}>
                  <StatusBadge status={item.impactLevel} />
                  <h3>{item.title}</h3>

                  <p>{item.narrative}</p>

                  <p style={{ color: "#666" }}>
                    {item.scenarioType} · Probability{" "}
                    {Math.round((item.probability || 0) * 100)}%
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard
            title="Strategic Timeline"
            eyebrow="Projected events"
          >
            <div style={{ display: "grid", gap: 12 }}>
              {data?.timelineEvents?.map((item: any) => (
                <div key={item.id} style={cardStyle}>
                  <StatusBadge status={item.severity} />

                  <h3>{item.title}</h3>

                  <p style={{ color: "#666" }}>
                    {item.eventType} · {item.projectedDate}
                  </p>

                  <p>
                    Confidence{" "}
                    {Math.round((item.confidence || 0) * 100)}%
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard
          title="Temporal Recommendations"
          eyebrow="Future optimization"
        >
          <div style={{ display: "grid", gap: 12 }}>
            {data?.recommendations?.map((item: any) => (
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
  width: 320,
  padding: 12,
  borderRadius: 12,
  border: "1px solid #ddd",
  marginRight: 12,
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
}