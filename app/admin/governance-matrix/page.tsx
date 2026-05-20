"use client"

import { useEffect, useState } from "react"
import {
  PageShell,
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  StatusBadge,
} from "@/components/executive-ui"

type Policy = {
  id: string
  title: string
  description: string | null
  policyType: string
  severity: string
  enforcement: string
  status: string
}

type Arbitration = {
  id: string
  title: string
  arbitrationType: string
  targetSystem: string | null
  status: string
  severity: string
  rationale: string | null
  riskScore: number
}

type Approval = {
  id: string
  title: string
  targetType: string
  targetId: string | null
  status: string
  priority: string
  rationale: string | null
}

type Risk = {
  id: string
  title: string
  signalType: string
  severity: string
  affectedArea: string | null
  description: string | null
  recommendation: string | null
  status: string
}

export default function GovernanceMatrixPage() {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [arbitrations, setArbitrations] = useState<Arbitration[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [risks, setRisks] = useState<Risk[]>([])
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const res = await fetch("/api/governance-matrix")
    const result = await res.json()

    if (result.ok) {
      setPolicies(result.policies)
      setArbitrations(result.arbitrations)
      setApprovals(result.approvals)
      setRisks(result.risks)
    }
  }

  async function runGovernance() {
    setLoading(true)

    const res = await fetch("/api/governance-matrix", {
      method: "POST",
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Governance analysis failed")
      return
    }

    await loadData()
  }

  async function governanceDecision(
    type: string,
    id: string,
    action: string
  ) {
    setLoading(true)

    const res = await fetch("/api/governance-matrix/decision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type,
        id,
        action,
      }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Governance decision failed")
      return
    }

    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  const criticalRisks = risks.filter((r) => r.severity === "critical").length
  const pendingApprovals = approvals.filter((a) => a.status === "pending").length
  const pendingArbitrations = arbitrations.filter(
    (a) => a.status === "pending"
  ).length

  return (
    <PageShell
      eyebrow="Institutional Governance"
      title="Executive Governance Matrix"
      description="Govern strategic behavior, arbitrate conflicts, supervise risk, manage approvals and preserve long-term organizational coherence."
    >
      <ExecutiveGrid min={220}>
        <MetricCard label="Policies" value={policies.length} />
        <MetricCard label="Pending Arbitrations" value={pendingArbitrations} />
        <MetricCard label="Pending Approvals" value={pendingApprovals} />
        <MetricCard label="Critical Risks" value={criticalRisks} />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Governance Runtime" eyebrow="Executive supervision">
          <button disabled={loading} onClick={runGovernance} style={buttonStyle}>
            {loading ? "Analyzing..." : "Run Governance Analysis"}
          </button>
        </ExecutiveCard>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Governance Policies" eyebrow="Constitutional layer">
            <div style={{ display: "grid", gap: 12 }}>
              {policies.map((policy) => (
                <div key={policy.id} style={cardStyle}>
                  <StatusBadge status={policy.severity} />
                  <h3>{policy.title}</h3>
                  <p>{policy.description}</p>
                  <p style={{ color: "#666" }}>
                    {policy.policyType} · {policy.enforcement}
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Arbitrations" eyebrow="Conflict resolution">
            <div style={{ display: "grid", gap: 12 }}>
              {arbitrations.map((item) => (
                <div key={item.id} style={cardStyle}>
                  <StatusBadge status={item.status} />
                  <h3>{item.title}</h3>
                  <p>{item.rationale}</p>
                  <p style={{ color: "#666" }}>
                    {item.arbitrationType} · Risk {item.riskScore}/100
                  </p>

                  {item.status === "pending" ? (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        disabled={loading}
                        onClick={() =>
                          governanceDecision(
                            "arbitration",
                            item.id,
                            "resolve"
                          )
                        }
                        style={buttonStyle}
                      >
                        Resolve
                      </button>

                      <button
                        disabled={loading}
                        onClick={() =>
                          governanceDecision(
                            "arbitration",
                            item.id,
                            "dismiss"
                          )
                        }
                        style={secondaryButtonStyle}
                      >
                        Dismiss
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Approvals" eyebrow="Executive authorization">
            <div style={{ display: "grid", gap: 12 }}>
              {approvals.map((item) => (
                <div key={item.id} style={cardStyle}>
                  <StatusBadge status={item.status} />
                  <h3>{item.title}</h3>
                  <p>{item.rationale}</p>
                  <p style={{ color: "#666" }}>
                    {item.targetType} · {item.priority}
                  </p>

                  {item.status === "pending" ? (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        disabled={loading}
                        onClick={() =>
                          governanceDecision(
                            "approval",
                            item.id,
                            "approve"
                          )
                        }
                        style={buttonStyle}
                      >
                        Approve
                      </button>

                      <button
                        disabled={loading}
                        onClick={() =>
                          governanceDecision(
                            "approval",
                            item.id,
                            "reject"
                          )
                        }
                        style={secondaryButtonStyle}
                      >
                        Reject
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Risk Signals" eyebrow="Systemic supervision">
            <div style={{ display: "grid", gap: 12 }}>
              {risks.map((item) => (
                <div key={item.id} style={cardStyle}>
                  <StatusBadge status={item.severity} />
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>

                  {item.recommendation ? (
                    <p style={{ color: "#666" }}>
                      Recommendation: {item.recommendation}
                    </p>
                  ) : null}

                  <p style={{ color: "#666" }}>
                    {item.signalType} · {item.affectedArea || "general"}
                  </p>

                  {item.status === "open" ? (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        disabled={loading}
                        onClick={() =>
                          governanceDecision("risk", item.id, "close")
                        }
                        style={buttonStyle}
                      >
                        Close
                      </button>

                      <button
                        disabled={loading}
                        onClick={() =>
                          governanceDecision("risk", item.id, "escalate")
                        }
                        style={secondaryButtonStyle}
                      >
                        Escalate
                      </button>
                    </div>
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
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
}

const secondaryButtonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 12,
  border: "1px solid #111",
  background: "#fff",
  color: "#111",
  cursor: "pointer",
  fontWeight: "bold",
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 16,
  padding: 18,
  background: "#fafafa",
}