"use client"

import { useEffect, useState } from "react"
import {
  PageShell,
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  StatusBadge,
} from "@/components/executive-ui"

type EvolutionRun = {
  id: string
  title: string
  status: string
  summary: string | null
  maturityScore: number
  findings: any
  createdAt: string
}

type Insight = {
  id: string
  type: string
  title: string
  insight: string
  priority: string
  confidence: number
  targetSystem: string | null
  status: string
}

type Policy = {
  id: string
  title: string
  policyArea: string
  recommendation: string
  priority: string
  riskLevel: string
  status: string
  error: string | null
}

export default function AdaptiveEvolutionPage() {
  const [runs, setRuns] = useState<EvolutionRun[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const res = await fetch("/api/adaptive-evolution")
    const result = await res.json()

    if (result.ok) {
      setRuns(result.runs)
      setInsights(result.insights)
      setPolicies(result.policies)
    }
  }

  async function runEvolution() {
    setLoading(true)

    const res = await fetch("/api/adaptive-evolution", {
      method: "POST",
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Evolution run failed")
      return
    }

    await loadData()
  }

  async function applyPolicy(policyId: string) {
    setLoading(true)

    const res = await fetch("/api/adaptive-evolution/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ policyId }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Policy apply failed")
      return
    }

    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  const latest = runs[0]
  const activeInsights = insights.filter((item) => item.status === "active").length
  const proposedPolicies = policies.filter((item) => item.status === "proposed").length
  const appliedPolicies = policies.filter((item) => item.status === "applied").length

  return (
    <PageShell
      eyebrow="Organizational Learning"
      title="Adaptive Intelligence Evolution Engine"
      description="Study outcomes, detect patterns, rank system maturity and evolve policies across workflows, agents, runtime, email, governance and strategy."
    >
      <ExecutiveGrid min={220}>
        <MetricCard
          label="Maturity Score"
          value={latest ? `${latest.maturityScore}/100` : "N/A"}
        />
        <MetricCard label="Evolution Runs" value={runs.length} />
        <MetricCard label="Active Insights" value={activeInsights} />
        <MetricCard label="Proposed Policies" value={proposedPolicies} />
        <MetricCard label="Applied Policies" value={appliedPolicies} />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Evolution Control" eyebrow="Learning cycle">
          <button disabled={loading} onClick={runEvolution} style={buttonStyle}>
            {loading ? "Evolving..." : "Run Evolution Cycle"}
          </button>

          {latest ? (
            <div style={cardStyle}>
              <StatusBadge status={latest.status} />
              <h3>{latest.title}</h3>
              <p>{latest.summary}</p>

              {latest.findings ? (
                <ExecutiveGrid min={240}>
                  <Finding title="Improved" items={latest.findings.whatImproved} />
                  <Finding title="Weak" items={latest.findings.whatIsWeak} />
                  <Finding title="Patterns" items={latest.findings.patterns} />
                  <Finding
                    title="Needs Evolution"
                    items={latest.findings.systemsNeedingEvolution}
                  />
                </ExecutiveGrid>
              ) : null}
            </div>
          ) : null}
        </ExecutiveCard>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Evolution Insights" eyebrow="Learned intelligence">
            <div style={{ display: "grid", gap: 12 }}>
              {insights.map((item) => (
                <div key={item.id} style={cardStyle}>
                  <StatusBadge status={item.priority} />
                  <h3>{item.title}</h3>
                  <p>{item.insight}</p>
                  <p style={{ color: "#666" }}>
                    {item.type} · {item.targetSystem || "general"} · Confidence{" "}
                    {Math.round(item.confidence * 100)}%
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Policy Recommendations" eyebrow="Safe evolution queue">
            <div style={{ display: "grid", gap: 12 }}>
              {policies.map((policy) => (
                <div key={policy.id} style={cardStyle}>
                  <StatusBadge status={policy.status} />
                  <h3>{policy.title}</h3>
                  <p>{policy.recommendation}</p>
                  <p style={{ color: "#666" }}>
                    {policy.policyArea} · {policy.priority} · Risk {policy.riskLevel}
                  </p>

                  {policy.error ? (
                    <p style={{ color: "#b00020" }}>{policy.error}</p>
                  ) : null}

                  {["proposed", "approved"].includes(policy.status) ? (
                    <button
                      disabled={loading}
                      onClick={() => applyPolicy(policy.id)}
                      style={buttonStyle}
                    >
                      Apply Policy
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Evolution History" eyebrow="Learning record">
          <div style={{ display: "grid", gap: 12 }}>
            {runs.map((run) => (
              <div key={run.id} style={cardStyle}>
                <StatusBadge status={run.status} />
                <h3>{run.title}</h3>
                <p>{run.summary}</p>
                <p style={{ color: "#777", fontSize: 12 }}>
                  Maturity {run.maturityScore}/100 ·{" "}
                  {new Date(run.createdAt).toLocaleString("en-AU")}
                </p>
              </div>
            ))}
          </div>
        </ExecutiveCard>
      </div>
    </PageShell>
  )
}

function Finding({ title, items }: { title: string; items?: string[] }) {
  return (
    <div style={findingStyle}>
      <strong>{title}</strong>
      <ul style={{ lineHeight: 1.8, paddingLeft: 20 }}>
        {(items || []).map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
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

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 16,
  padding: 18,
  marginTop: 14,
  background: "#fafafa",
}

const findingStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 14,
  padding: 14,
  marginTop: 14,
}