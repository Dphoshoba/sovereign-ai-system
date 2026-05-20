"use client"

import { useEffect, useState } from "react"
import {
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  PageShell,
  StatusBadge,
} from "@/components/executive-ui"

export default function SovereignRuntimePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const res = await fetch("/api/sovereign-runtime")
    const result = await res.json()

    if (result.ok) {
      setData(result)
    }
  }

  async function runRuntime() {
    setLoading(true)

    const res = await fetch("/api/sovereign-runtime", {
      method: "POST",
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Sovereign runtime failed")
      return
    }

    await loadData()
  }

  async function executeAction(actionId: string) {
    setLoading(true)

    const res = await fetch("/api/sovereign-runtime/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ actionId }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Execution failed")
      return
    }

    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  const latest = data?.snapshots?.[0]
  const priorities = data?.priorities || []
  const routes = data?.routes || []
  const actions = data?.actions || []

  return (
    <PageShell
      eyebrow="Central Intelligence Orchestration Core"
      title="Sovereign Unified Executive Runtime"
      description="Consolidate governance, cognition, economics, temporal simulation, operations, federation, recursive evolution and world modeling into one executive operating state."
    >
      <ExecutiveGrid min={220}>
        <MetricCard label="Overall Health" value={latest?.overallHealth || 0} />
        <MetricCard label="Intelligence" value={latest?.intelligenceScore || 0} />
        <MetricCard label="Governance" value={latest?.governanceScore || 0} />
        <MetricCard label="Execution" value={latest?.executionScore || 0} />
        <MetricCard label="Economic" value={latest?.economicScore || 0} />
        <MetricCard
          label="Future Readiness"
          value={latest?.futureReadinessScore || 0}
        />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Sovereign Runtime Control" eyebrow="Unified operating state">
          <button disabled={loading} onClick={runRuntime} style={buttonStyle}>
            {loading ? "Synthesizing..." : "Run Sovereign Runtime"}
          </button>

          {latest ? (
            <div style={cardStyle}>
              <StatusBadge status={latest.status} />
              <h3>{latest.title}</h3>
              <p>{latest.summary}</p>

              {latest.executiveState ? (
                <pre style={preStyle}>
                  {JSON.stringify(latest.executiveState, null, 2)}
                </pre>
              ) : null}
            </div>
          ) : null}
        </ExecutiveCard>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Runtime Priorities" eyebrow="What matters now">
            <div style={{ display: "grid", gap: 12 }}>
              {priorities.map((item: any) => (
                <div key={item.id} style={cardStyle}>
                  <StatusBadge status={item.priority} />
                  <h3>{item.title}</h3>
                  <p>{item.rationale}</p>
                  <p style={{ color: "#666" }}>{item.area}</p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Intelligence Routes" eyebrow="Cross-layer routing">
            <div style={{ display: "grid", gap: 12 }}>
              {routes.map((item: any) => (
                <div key={item.id} style={cardStyle}>
                  <StatusBadge status={item.priority} />
                  <h3>{item.title}</h3>
                  <p>{item.reason}</p>
                  <p style={{ color: "#666" }}>
                    {item.sourceLayer} → {item.targetLayer} · {item.routeType}
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Sovereign Actions" eyebrow="Governed action queue">
          <div style={{ display: "grid", gap: 12 }}>
            {actions.map((item: any) => (
              <div key={item.id} style={cardStyle}>
                <StatusBadge status={item.status} />
                <h3>{item.title}</h3>
                <p>{item.rationale}</p>
                <p style={{ color: "#666" }}>
                  {item.actionType} · {item.targetLayer}
                </p>

                {item.status === "proposed" ? (
                  <button
                    disabled={loading}
                    onClick={() => executeAction(item.id)}
                    style={buttonStyle}
                  >
                    Execute Governed Action
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