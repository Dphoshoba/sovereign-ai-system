"use client"

import { useEffect, useState } from "react"
import {
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  PageShell,
  StatusBadge,
} from "@/components/executive-ui"

export default function RecursiveEvolutionPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const res = await fetch("/api/recursive-evolution")
    const result = await res.json()

    if (result.ok) {
      setData(result)
    }
  }

  async function runEvolutionCycle() {
    setLoading(true)

    const res = await fetch("/api/recursive-evolution", {
      method: "POST",
    })

    const result = await res.json()

    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Evolution cycle failed")
      return
    }

    await loadData()
  }

  async function executeProposal(id: string) {
    setLoading(true)

    const res = await fetch("/api/recursive-evolution/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        proposalId: id,
      }),
    })

    const result = await res.json()

    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Proposal execution failed")
      return
    }

    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  const latest = data?.cycles?.[0]

  return (
    <PageShell
      eyebrow="Recursive Institutional Evolution"
      title="Self-Evolution Engine"
      description="Analyze institutional architecture, optimize cognition, evolve governance safely and coordinate recursive organizational improvement."
    >
      <ExecutiveGrid min={220}>
        <MetricCard
          label="Architecture Health"
          value={latest?.architectureHealth || 0}
        />
        <MetricCard
          label="Optimization Score"
          value={latest?.optimizationScore || 0}
        />
        <MetricCard
          label="Governance Coherence"
          value={latest?.governanceCoherence || 0}
        />
        <MetricCard
          label="Operational Efficiency"
          value={latest?.operationalEfficiency || 0}
        />
        <MetricCard
          label="Cognitive Alignment"
          value={latest?.cognitiveAlignment || 0}
        />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard
          title="Recursive Evolution Runtime"
          eyebrow="Institutional self-optimization"
        >
          <button
            disabled={loading}
            onClick={runEvolutionCycle}
            style={buttonStyle}
          >
            {loading ? "Evolving..." : "Run Evolution Cycle"}
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
            title="Architecture Observations"
            eyebrow="System diagnostics"
          >
            <div style={{ display: "grid", gap: 12 }}>
              {data?.observations?.map((item: any) => (
                <div key={item.id} style={cardStyle}>
                  <StatusBadge status={item.severity} />
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>

                  <p style={{ color: "#666" }}>
                    {item.observationType} · {item.affectedLayer}
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard
            title="Institutional Mutations"
            eyebrow="Evolution simulations"
          >
            <div style={{ display: "grid", gap: 12 }}>
              {data?.mutations?.map((item: any) => (
                <div key={item.id} style={cardStyle}>
                  <StatusBadge status={item.status} />

                  <h3>{item.title}</h3>

                  <p>{item.description}</p>

                  <p style={{ color: "#666" }}>
                    {item.mutationType} · {item.targetLayer}
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard
            title="Optimization Proposals"
            eyebrow="Recursive improvements"
          >
            <div style={{ display: "grid", gap: 12 }}>
              {data?.proposals?.map((item: any) => (
                <div key={item.id} style={cardStyle}>
                  <StatusBadge status={item.status} />

                  <h3>{item.title}</h3>

                  <p>{item.rationale}</p>

                  <p style={{ color: "#666" }}>
                    {item.proposalType} · Risk{" "}
                    {item.implementationRisk}
                  </p>

                  {item.status === "proposed" ? (
                    <button
                      disabled={loading}
                      onClick={() => executeProposal(item.id)}
                      style={buttonStyle}
                    >
                      Execute Proposal
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard
            title="Evolution Memory"
            eyebrow="Institutional learning"
          >
            <div style={{ display: "grid", gap: 12 }}>
              {data?.memories?.map((item: any) => (
                <div key={item.id} style={cardStyle}>
                  <StatusBadge status={item.priority} />

                  <h3>{item.title}</h3>

                  <p>{item.insight}</p>

                  <p style={{ color: "#666" }}>
                    {item.memoryType} · Confidence{" "}
                    {Math.round((item.confidence || 0) * 100)}%
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
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