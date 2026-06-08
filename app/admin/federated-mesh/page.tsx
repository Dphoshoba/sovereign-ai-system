"use client"

import { useEffect, useState } from "react"
import {
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  PageShell,
  StatusBadge,
} from "@/components/executive-ui"

export default function FederatedMeshPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const res = await fetch("/api/federated-mesh")
    const result = await res.json()

    if (result.ok) setData(result)
  }

  async function runMesh() {
    setLoading(true)

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 120000)

      const res = await fetch("/api/federated-mesh", {
        method: "POST",
        signal: controller.signal,
      })

      clearTimeout(timeout)

      const result = await res.json()

      if (!result.ok) {
        alert(result.error || "Federated mesh run failed")
        return
      }

      await loadData()
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Federated mesh run stopped unexpectedly"
      )
    } finally {
      setLoading(false)
    }
  }

  async function dispatchPacket(packetId: string) {
    setLoading(true)

    try {
      const res = await fetch("/api/federated-mesh/dispatch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ packetId }),
      })

      const result = await res.json()

      if (!result.ok) {
        alert(result.error || "Packet dispatch failed")
        return
      }

      if (result.authorizationRequest) {
        alert("Approval request created in Enterprise Governance.")
      }

      await loadData()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Packet dispatch failed")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const nodes = data?.nodes || []
  const packets = data?.packets || []
  const sessions = data?.sessions || []
  const protocols = data?.protocols || []
  const societies = data?.societies || []
  const latest = data?.runs?.[0]

  const approvalPackets = packets.filter((p: any) =>
    ["approval-aware", "approval-requested"].includes(p.status)
  ).length

  return (
    <PageShell
      eyebrow="Multi-Agent Civilization Coordination"
      title="Federated Intelligence Mesh"
      description="Coordinate distributed intelligence nodes, agent societies, alliance protocols and governed cross-system intelligence exchange."
    >
      <ExecutiveGrid min={220}>
        <MetricCard label="Mesh Nodes" value={nodes.length} />
        <MetricCard label="Packets" value={packets.length} />
        <MetricCard label="Sessions" value={sessions.length} />
        <MetricCard label="Protocols" value={protocols.length} />
        <MetricCard label="Agent Societies" value={societies.length} />
        <MetricCard label="Approval Packets" value={approvalPackets} />
        <MetricCard label="Mesh Health" value={latest?.meshHealth || 0} />
        <MetricCard label="Coordination" value={latest?.coordinationScore || 0} />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Federated Mesh Runtime" eyebrow="Coordination cycle">
          <button disabled={loading} onClick={runMesh} style={buttonStyle}>
            {loading ? "Coordinating..." : "Run Federated Mesh"}
          </button>

          {latest ? (
            <div style={cardStyle}>
              <StatusBadge status={latest.status} />
              <h3>{latest.title}</h3>
              <p>{latest.summary}</p>
              <p style={{ color: "var(--muted)" }}>
                Mesh {latest.meshHealth}/100 · Trust {latest.trustHealth}/100 ·
                Coordination {latest.coordinationScore}/100 · Risk{" "}
                {latest.riskScore}/100
              </p>
              <pre style={preStyle}>{JSON.stringify(latest.findings, null, 2)}</pre>
            </div>
          ) : null}
        </ExecutiveCard>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Mesh Nodes" eyebrow="Federated institutions">
            <div style={{ display: "grid", gap: 12 }}>
              {nodes.map((node: any) => (
                <div key={node.id} style={cardStyle}>
                  <StatusBadge status={node.status} />
                  <h3>{node.nodeName}</h3>
                  <p style={{ color: "var(--muted)" }}>
                    {node.nodeType} · {node.domain} · Trust {node.trustScore}/100
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Agent Societies" eyebrow="Multi-agent topology">
            <div style={{ display: "grid", gap: 12 }}>
              {societies.map((society: any) => (
                <div key={society.id} style={cardStyle}>
                  <StatusBadge status={society.status} />
                  <h3>{society.societyName}</h3>
                  <p>{society.purpose}</p>
                  <p style={{ color: "var(--muted)" }}>
                    {society.societyType} · Performance {society.performanceScore}/100
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Intelligence Packets" eyebrow="Cross-node exchange">
            <div style={{ display: "grid", gap: 12 }}>
              {packets.map((packet: any) => (
                <div key={packet.id} style={cardStyle}>
                  <StatusBadge status={packet.status} />
                  <h3>{packet.title}</h3>
                  <p>{packet.summary}</p>
                  <p style={{ color: "var(--muted)" }}>
                    {packet.packetType} · {packet.priority} · {packet.classification}
                  </p>

                  {["queued", "approval-aware"].includes(packet.status) ? (
                    <button
                      disabled={loading}
                      onClick={() => dispatchPacket(packet.id)}
                      style={buttonStyle}
                    >
                      Dispatch Packet
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Alliance Protocols" eyebrow="Federation law">
            <div style={{ display: "grid", gap: 12 }}>
              {protocols.map((protocol: any) => (
                <div key={protocol.id} style={cardStyle}>
                  <StatusBadge status={protocol.status} />
                  <h3>{protocol.title}</h3>
                  <p style={{ color: "var(--muted)" }}>
                    {protocol.protocolType} · Trust Required {protocol.trustRequired}/100
                  </p>
                  <pre style={preStyle}>{JSON.stringify(protocol.rules, null, 2)}</pre>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Coordination Sessions" eyebrow="Federated decisions">
          <div style={{ display: "grid", gap: 12 }}>
            {sessions.map((session: any) => (
              <div key={session.id} style={cardStyle}>
                <StatusBadge status={session.status} />
                <h3>{session.title}</h3>
                <p>{session.coordinationGoal}</p>
                <pre style={preStyle}>
                  {JSON.stringify(
                    {
                      participatingNodes: session.participatingNodes,
                      decisions: session.decisions,
                      risks: session.risks,
                      outcomes: session.outcomes,
                    },
                    null,
                    2
                  )}
                </pre>
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