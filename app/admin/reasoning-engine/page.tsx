"use client"

import { useEffect, useState } from "react"
import {
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  PageShell,
  StatusBadge,
} from "@/components/executive-ui"

export default function ReasoningEnginePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [question, setQuestion] = useState(
    "What is the highest-leverage strategic decision Echoes & Visions should make next?"
  )

  async function loadData() {
    const res = await fetch("/api/reasoning-engine")
    const result = await res.json()

    if (result.ok) setData(result)
  }

  async function runReasoning() {
    if (!question.trim()) return

    setLoading(true)

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 120000)

      const res = await fetch("/api/reasoning-engine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          question,
          reasoningType: "strategic-decision",
        }),
      })

      clearTimeout(timeout)

      const result = await res.json()

      if (!result.ok) {
        alert(result.error || "Reasoning simulation failed")
        return
      }

      await loadData()
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Reasoning simulation stopped unexpectedly"
      )
    } finally {
      setLoading(false)
    }
  }

  async function activateRecommendation(recommendationId: string) {
    setLoading(true)

    try {
      const res = await fetch("/api/reasoning-engine/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recommendationId }),
      })

      const result = await res.json()

      if (!result.ok) {
        alert(result.error || "Activation failed")
        return
      }

      if (result.authorizationRequest) {
        alert("Approval request created in Enterprise Governance.")
      }

      await loadData()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Activation failed")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const runs = data?.runs || []
  const options = data?.options || []
  const consequences = data?.consequences || []
  const recommendations = data?.recommendations || []
  const latest = runs[0]

  return (
    <PageShell
      eyebrow="Strategic Decision Simulation"
      title="Autonomous Reasoning Engine"
      description="Use semantic memory and the knowledge graph to compare options, simulate consequences, score risk and generate governed strategic recommendations."
    >
      <ExecutiveGrid min={220}>
        <MetricCard label="Reasoning Runs" value={runs.length} />
        <MetricCard label="Options" value={options.length} />
        <MetricCard label="Consequences" value={consequences.length} />
        <MetricCard label="Recommendations" value={recommendations.length} />
        <MetricCard label="Strategic Score" value={latest?.strategicScore || 0} />
        <MetricCard label="Risk Score" value={latest?.riskScore || 0} />
        <MetricCard label="Opportunity" value={latest?.opportunityScore || 0} />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Run Strategic Reasoning" eyebrow="Decision simulation">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            style={inputStyle}
          />

          <button disabled={loading} onClick={runReasoning} style={buttonStyle}>
            {loading ? "Reasoning..." : "Run Reasoning Simulation"}
          </button>

          {latest ? (
            <div style={cardStyle}>
              <StatusBadge status={latest.status} />
              <h3>{latest.title}</h3>
              <p>{latest.summary}</p>
              <p style={{ color: "#666" }}>
                Confidence {Math.round((latest.confidenceScore || 0) * 100)}%
              </p>

              {latest.reasoningTrace ? (
                <>
                  <h4>Reasoning Trace</h4>
                  <ul style={{ lineHeight: 1.8 }}>
                    {latest.reasoningTrace.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </>
              ) : null}

              {latest.findings ? (
                <pre style={preStyle}>{JSON.stringify(latest.findings, null, 2)}</pre>
              ) : null}
            </div>
          ) : null}
        </ExecutiveCard>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Decision Options" eyebrow="Strategic alternatives">
            <div style={{ display: "grid", gap: 12 }}>
              {options.map((item: any) => (
                <div key={item.id} style={cardStyle}>
                  <StatusBadge status={item.riskLevel} />
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <p><strong>Upside:</strong> {item.upside}</p>
                  <p><strong>Downside:</strong> {item.downside}</p>
                  <p style={{ color: "#666" }}>
                    Value {item.strategicValue}/100 · Cost pressure{" "}
                    {item.costPressure}/100 · {item.timeHorizon}
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Consequence Models" eyebrow="What-if outcomes">
            <div style={{ display: "grid", gap: 12 }}>
              {consequences.map((item: any) => (
                <div key={item.id} style={cardStyle}>
                  <StatusBadge status={item.impactLevel} />
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <p><strong>Mitigation:</strong> {item.mitigation}</p>
                  <p style={{ color: "#666" }}>
                    {item.consequenceType} · Probability{" "}
                    {Math.round((item.probability || 0) * 100)}%
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Reasoning Recommendations" eyebrow="Governed next moves">
          <div style={{ display: "grid", gap: 12 }}>
            {recommendations.map((item: any) => (
              <div key={item.id} style={cardStyle}>
                <StatusBadge status={item.status} />
                <h3>{item.title}</h3>
                <p>{item.rationale}</p>
                <p style={{ color: "#666" }}>
                  {item.recommendationType} · {item.priority} · Approval required:{" "}
                  {String(item.requiredApproval)}
                </p>
                <p><strong>Expected outcome:</strong> {item.expectedOutcome}</p>

                {["proposed"].includes(item.status) ? (
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid #ddd",
  padding: 12,
  marginBottom: 12,
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

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 16,
  padding: 18,
  background: "#fafafa",
}

const preStyle: React.CSSProperties = {
  background: "#111",
  color: "#fff",
  padding: 14,
  borderRadius: 14,
  overflowX: "auto",
  whiteSpace: "pre-wrap",
}