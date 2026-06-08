"use client"

import { useEffect, useState } from "react"
import {
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  PageShell,
  StatusBadge,
} from "@/components/executive-ui"

export default function FederatedIntelligencePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const res = await fetch("/api/federated-intelligence")
    const result = await res.json()

    if (result.ok) setData(result)
  }

  async function runCouncil() {
    setLoading(true)

    const res = await fetch("/api/federated-intelligence", {
      method: "POST",
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Federation council failed")
      return
    }

    await loadData()
  }

  async function executeAction(actionId: string) {
    setLoading(true)

    const res = await fetch("/api/federated-intelligence/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ actionId }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Action execution failed")
      return
    }

    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  const nodes = data?.nodes || []
  const signals = data?.signals || []
  const sessions = data?.sessions || []
  const agreements = data?.agreements || []
  const actions = data?.actions || []
  const latestSession = sessions[0]

  return (
    <PageShell
      eyebrow="Distributed Institutional Coordination"
      title="Federated Intelligence Network"
      description="Coordinate multiple intelligence nodes, shared priorities, federation agreements, distributed signals and governed cross-system actions."
    >
      <ExecutiveGrid min={220}>
        <MetricCard label="Nodes" value={nodes.length} />
        <MetricCard label="Signals" value={signals.length} />
        <MetricCard label="Council Sessions" value={sessions.length} />
        <MetricCard label="Agreements" value={agreements.length} />
        <MetricCard label="Actions" value={actions.length} />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Federation Council" eyebrow="Coordination runtime">
          <button disabled={loading} onClick={runCouncil} style={buttonStyle}>
            {loading ? "Coordinating..." : "Run Federation Council Cycle"}
          </button>

          {latestSession ? (
            <div style={cardStyle}>
              <StatusBadge status={latestSession.status} />
              <h3>{latestSession.title}</h3>
              <p>{latestSession.purpose}</p>
              {latestSession.findings ? (
                <pre style={preStyle}>
                  {JSON.stringify(latestSession.findings, null, 2)}
                </pre>
              ) : null}
            </div>
          ) : null}
        </ExecutiveCard>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Federated Nodes" eyebrow="Institutional network">
            <div style={{ display: "grid", gap: 12 }}>
              {nodes.map((node: any) => (
                <div key={node.id} style={cardStyle}>
                  <StatusBadge status={node.status} />
                  <h3>{node.name}</h3>
                  <p style={{ color: "var(--muted)" }}>
                    {node.nodeType} · {node.domain} · Trust {node.trustLevel}/100
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Federation Signals" eyebrow="Shared intelligence">
            <div style={{ display: "grid", gap: 12 }}>
              {signals.map((signal: any) => (
                <div key={signal.id} style={cardStyle}>
                  <StatusBadge status={signal.priority} />
                  <h3>{signal.title}</h3>
                  <p>{signal.summary}</p>
                  <p style={{ color: "var(--muted)" }}>
                    {signal.sourceNode} · {signal.signalType}
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Federation Agreements" eyebrow="Shared protocols">
            <div style={{ display: "grid", gap: 12 }}>
              {agreements.map((item: any) => (
                <div key={item.id} style={cardStyle}>
                  <StatusBadge status={item.status} />
                  <h3>{item.title}</h3>
                  <p style={{ color: "var(--muted)" }}>
                    {item.agreementType} · Risk {item.riskLevel}
                  </p>
                  <pre style={preStyle}>{JSON.stringify(item.terms, null, 2)}</pre>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Federation Actions" eyebrow="Governed coordination">
            <div style={{ display: "grid", gap: 12 }}>
              {actions.map((action: any) => (
                <div key={action.id} style={cardStyle}>
                  <StatusBadge status={action.status} />
                  <h3>{action.title}</h3>
                  <p>{action.rationale}</p>
                  <p style={{ color: "var(--muted)" }}>
                    {action.actionType} · Target {action.targetNode || "general"}
                  </p>

                  {action.status === "proposed" ? (
                    <button
                      disabled={loading}
                      onClick={() => executeAction(action.id)}
                      style={buttonStyle}
                    >
                      Execute Federation Action
                    </button>
                  ) : null}
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
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  cursor: "pointer",
  fontWeight: "bold",
}

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 18,
  background: "var(--card-background)",
}

const preStyle: React.CSSProperties = {
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  padding: 14,
  borderRadius: 14,
  overflowX: "auto",
  whiteSpace: "pre-wrap",
}