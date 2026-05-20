"use client"

import { useEffect, useState } from "react"
import {
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  PageShell,
  StatusBadge,
} from "@/components/executive-ui"

const DOMAIN_LABELS: Record<string, string> = {
  "ai-economy": "AI Economy",
  "creator-economy": "Creator Economy",
  "ministry-church-technology": "Ministry / Church Tech",
  "global-markets": "Global Markets",
  "governance-regulation": "Governance / Regulation",
  education: "Education",
  "media-content": "Media / Content",
  "spiritual-cultural-shifts": "Spiritual / Cultural",
}

export default function WorldModelV2Page() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [horizon, setHorizon] = useState("12-months")
  const [selectedStress, setSelectedStress] = useState<string[]>([])

  async function loadData() {
    const res = await fetch("/api/world-model-v2")
    const result = await res.json()

    if (result.ok) {
      setData(result)
      if (selectedStress.length === 0 && result.stressTypes?.length) {
        setSelectedStress(result.stressTypes)
      }
    }
  }

  async function runWorldModel() {
    setLoading(true)

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 120000)

      const res = await fetch("/api/world-model-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ horizon }),
      })

      clearTimeout(timeout)
      const result = await res.json()

      if (!result.ok) {
        alert(result.error || "World model V2 simulation failed")
        return
      }

      await loadData()
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "World model V2 simulation stopped unexpectedly"
      )
    } finally {
      setLoading(false)
    }
  }

  async function runStressTest() {
    setLoading(true)

    try {
      const res = await fetch("/api/world-model-v2/stress-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: data?.runs?.[0]?.id,
          stressTypes: selectedStress,
        }),
      })

      const result = await res.json()

      if (!result.ok) {
        alert(result.error || "Stress test failed")
        return
      }

      await loadData()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Stress test failed")
    } finally {
      setLoading(false)
    }
  }

  async function activateRecommendation(id: string) {
    setLoading(true)

    try {
      const res = await fetch("/api/world-model-v2/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId: id }),
      })

      const result = await res.json()

      if (!result.ok) {
        alert(result.error || "Activation failed")
        return
      }

      if (result.governanceRequired) {
        alert("Approval request created in Enterprise Governance.")
      }

      await loadData()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Activation failed")
    } finally {
      setLoading(false)
    }
  }

  function toggleStress(type: string) {
    setSelectedStress((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  useEffect(() => {
    loadData()
  }, [])

  const latest = data?.runs?.[0]
  const domainSignals = data?.domainSignals || []
  const scenarios = data?.scenarios || []
  const stressTests = data?.stressTests || []
  const shocks = data?.shocks || []
  const postures = data?.postures || []
  const recommendations = data?.recommendations || []

  const signalsByDomain = domainSignals.reduce(
    (acc: Record<string, any[]>, signal: any) => {
      const key = signal.domain || "other"
      if (!acc[key]) acc[key] = []
      acc[key].push(signal)
      return acc
    },
    {}
  )

  return (
    <PageShell
      eyebrow="Planetary Domain Intelligence"
      title="Sovereign World Model Engine V2"
      description="Model eight planetary domains, stress-test strategic futures, simulate shocks, score recommendations, and activate governed planetary action through integrated intelligence layers."
    >
      <ExecutiveGrid min={200}>
        <MetricCard
          label="Planetary Stability"
          value={latest?.planetaryStability || 0}
        />
        <MetricCard label="Opportunity Index" value={latest?.opportunityIndex || 0} />
        <MetricCard label="Systemic Risk" value={latest?.systemicRiskIndex || 0} />
        <MetricCard
          label="Strategic Readiness"
          value={latest?.strategicReadiness || 0}
        />
        <MetricCard
          label="Confidence"
          value={`${Math.round((latest?.confidenceScore || 0) * 100)}%`}
        />
        <MetricCard label="Domain Signals" value={domainSignals.length} />
        <MetricCard label="Shocks Modeled" value={shocks.length} />
        <MetricCard label="Recommendations" value={recommendations.length} />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Planetary Simulation" eyebrow="World Model V2 runtime">
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
            {loading ? "Modeling..." : "Run Planetary Simulation"}
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
                    {(latest.assumptions as string[]).map(
                      (item: string, index: number) => (
                        <li key={index}>{item}</li>
                      )
                    )}
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
        <ExecutiveCard title="Scenario Stress Testing" eyebrow="Future branch resilience">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {(data?.stressTypes || []).map((type: string) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleStress(type)}
                style={{
                  ...chipStyle,
                  background: selectedStress.includes(type) ? "#111" : "#eee",
                  color: selectedStress.includes(type) ? "#fff" : "#111",
                }}
              >
                {type.replace(/-/g, " ")}
              </button>
            ))}
          </div>

          <button
            disabled={loading || !latest}
            onClick={runStressTest}
            style={secondaryButtonStyle}
          >
            {loading ? "Testing..." : "Run Stress Test"}
          </button>

          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {stressTests.slice(0, 12).map((test: any) => (
              <div key={test.id} style={cardStyle}>
                <StatusBadge status={test.severity} />
                <h3>{test.title}</h3>
                <p>{test.description}</p>
                <p style={{ color: "#666" }}>
                  {test.stressType} · Resilience {test.resilienceScore}/100
                </p>
                {test.mitigation ? (
                  <p style={{ fontSize: 14 }}>
                    <strong>Mitigation:</strong> {test.mitigation}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </ExecutiveCard>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Planetary Domains" eyebrow="Eight-domain modeling">
            <div>
              {Object.entries(DOMAIN_LABELS).map(([domain, label]) => (
                <div key={domain} style={cardStyle}>
                  <h4 style={{ marginTop: 0 }}>{label}</h4>
                  {(signalsByDomain[domain] || []).slice(0, 2).map((signal: any) => (
                    <div key={signal.id} style={{ marginBottom: 12 }}>
                      <StatusBadge status={signal.severity} />
                      <p style={{ margin: "8px 0 4px", fontWeight: "bold" }}>
                        {signal.title}
                      </p>
                      <p style={{ margin: 0, fontSize: 14 }}>{signal.summary}</p>
                    </div>
                  ))}
                  {!signalsByDomain[domain]?.length ? (
                    <p style={{ color: "#888", fontSize: 14 }}>No signals yet</p>
                  ) : null}
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Future Scenarios" eyebrow="Branch probabilities">
            <div>
              {scenarios.slice(0, 8).map((scenario: any) => (
                <div key={scenario.id} style={cardStyle}>
                  <StatusBadge status={scenario.impactLevel} />
                  <h3>{scenario.title}</h3>
                  <p>{scenario.narrative}</p>
                  <p style={{ color: "#666" }}>
                    {scenario.scenarioType} ·{" "}
                    {Math.round((scenario.probability || 0) * 100)}% probability
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Strategic Shock Models" eyebrow="Disruption vectors">
            <div>
              {shocks.map((shock: any) => (
                <div key={shock.id} style={cardStyle}>
                  <StatusBadge status={shock.severity} />
                  <h3>{shock.title}</h3>
                  <p>{shock.narrative}</p>
                  <p style={{ color: "#666" }}>
                    {shock.shockType.replace(/-/g, " ")} · Impact{" "}
                    {shock.impactScore}/100 · {shock.timeHorizon}
                  </p>
                  {shock.responsePlan ? (
                    <p style={{ fontSize: 14 }}>
                      <strong>Response:</strong> {shock.responsePlan}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Strategic Posture" eyebrow="Readiness models">
            <div>
              {postures.map((posture: any) => (
                <div key={posture.id} style={cardStyle}>
                  <h3>{posture.title}</h3>
                  <p>{posture.recommendation}</p>
                  <p style={{ color: "#666" }}>
                    {posture.postureType} · Readiness {posture.readinessScore} ·
                    Risk {posture.riskExposure} · Upside {posture.upsidePotential}
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard
          title="Scored Planetary Recommendations"
          eyebrow="Governed activation · no bypass"
        >
          <div>
            {recommendations.map((item: any) => (
              <div key={item.id} style={cardStyle}>
                <StatusBadge status={item.status} />
                <h3>{item.title}</h3>
                <p>{item.rationale}</p>

                <ExecutiveGrid min={120}>
                  <MetricCard label="Urgency" value={item.urgencyScore} />
                  <MetricCard label="Opportunity" value={item.opportunityScore} />
                  <MetricCard label="Risk" value={item.riskScore} />
                  <MetricCard label="Cost Pressure" value={item.costPressureScore} />
                  <MetricCard
                    label="Execution Difficulty"
                    value={item.executionDifficultyScore}
                  />
                  <MetricCard
                    label="Governance Sensitivity"
                    value={item.governanceSensitivityScore}
                  />
                  <MetricCard label="Composite" value={item.compositeScore} />
                  <MetricCard
                    label="Confidence"
                    value={`${Math.round((item.confidenceScore || 0) * 100)}%`}
                  />
                </ExecutiveGrid>

                <p style={{ color: "#666" }}>
                  {item.recommendationType} · {item.priority} ·{" "}
                  {item.requiredApproval
                    ? "Governance approval required"
                    : "Low-risk activation path"}
                </p>

                {item.status === "proposed" ? (
                  <button
                    disabled={loading}
                    onClick={() => activateRecommendation(item.id)}
                    style={buttonStyle}
                  >
                    {item.requiredApproval
                      ? "Request Governance Approval"
                      : "Activate Recommendation"}
                  </button>
                ) : null}

                {item.status === "approval-requested" ? (
                  <p style={{ color: "#b45309", fontWeight: "bold" }}>
                    Pending approval in Enterprise Governance
                  </p>
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
  marginRight: 12,
}

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#333",
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

const chipStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  border: "none",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: "bold",
  textTransform: "capitalize",
}

const preStyle: React.CSSProperties = {
  background: "#111",
  color: "#fff",
  padding: 16,
  borderRadius: 14,
  overflowX: "auto",
  whiteSpace: "pre-wrap",
}