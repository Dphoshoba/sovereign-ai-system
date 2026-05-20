"use client"

import { useEffect, useState } from "react"
import {
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  PageShell,
  StatusBadge,
} from "@/components/executive-ui"

export default function EnterpriseGovernancePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const res = await fetch("/api/enterprise-governance")
    const result = await res.json()

    if (result.ok) {
      setData(result)
    }
  }

  async function createTestRequest() {
    setLoading(true)

    const res = await fetch("/api/enterprise-governance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Approve high-risk sovereign runtime execution",
        targetType: "SovereignRuntimeAction",
        targetId: null,
        requestedBy: "sovereign-runtime",
        requestedRole: "system",
        actionType: "execute-high-risk-action",
        targetLayer: "governance",
        riskLevel: "high",
        rationale:
          "Test authorization request for constitutional execution control.",
        payload: {
          source: "enterprise-governance-test",
        },
      }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Request creation failed")
      return
    }

    await loadData()
  }

  async function decide(requestId: string, action: "approve" | "reject") {
    setLoading(true)

    const res = await fetch("/api/enterprise-governance/decision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId,
        action,
        actorEmail: "davidoshoba@gmail.com",
        notes: `Decision: ${action}`,
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

  const roles = data?.roles || []
  const actors = data?.actors || []
  const policies = data?.policies || []
  const requests = data?.requests || []
  const auditTrail = data?.auditTrail || []

  const pending = requests.filter((r: any) => r.status === "pending").length
  const approved = requests.filter((r: any) => r.status === "approved").length
  const rejected = requests.filter((r: any) => r.status === "rejected").length
  const highRisk = requests.filter((r: any) =>
    ["high", "critical"].includes(r.riskLevel)
  ).length

  return (
    <PageShell
      eyebrow="Constitutional Execution Framework"
      title="Enterprise Governance OS"
      description="Manage roles, authority, constitutional policies, approvals and audit trails across the sovereign intelligence runtime."
    >
      <ExecutiveGrid min={220}>
        <MetricCard label="Roles" value={roles.length} />
        <MetricCard label="Actors" value={actors.length} />
        <MetricCard label="Policies" value={policies.length} />
        <MetricCard label="Pending" value={pending} />
        <MetricCard label="Approved" value={approved} />
        <MetricCard label="Rejected" value={rejected} />
        <MetricCard label="High Risk" value={highRisk} />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Governance Control" eyebrow="Authority system">
          <button disabled={loading} onClick={createTestRequest} style={buttonStyle}>
            {loading ? "Creating..." : "Create Test Authorization Request"}
          </button>
        </ExecutiveCard>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Authorization Requests" eyebrow="Approval queue">
            <div style={{ display: "grid", gap: 12 }}>
              {requests.map((item: any) => (
                <div key={item.id} style={cardStyle}>
                  <StatusBadge status={item.status} />
                  <h3>{item.title}</h3>
                  <p>{item.rationale}</p>
                  <p style={{ color: "#666" }}>
                    {item.targetType} · {item.actionType} · Risk {item.riskLevel}
                  </p>

                  {item.policyMatches?.length ? (
                    <pre style={preStyle}>
                      {JSON.stringify(item.policyMatches, null, 2)}
                    </pre>
                  ) : null}

                  {item.status === "pending" ? (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        disabled={loading}
                        onClick={() => decide(item.id, "approve")}
                        style={buttonStyle}
                      >
                        Approve
                      </button>

                      <button
                        disabled={loading}
                        onClick={() => decide(item.id, "reject")}
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

          <ExecutiveCard title="Constitutional Policies" eyebrow="Rules of autonomy">
            <div style={{ display: "grid", gap: 12 }}>
              {policies.map((policy: any) => (
                <div key={policy.id} style={cardStyle}>
                  <StatusBadge status={policy.severity} />
                  <h3>{policy.title}</h3>
                  <p>{policy.description}</p>
                  <p style={{ color: "#666" }}>
                    {policy.policyArea} · {policy.ruleType} · {policy.enforcement}
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Governance Actors" eyebrow="Authority map">
            <div style={{ display: "grid", gap: 12 }}>
              {actors.map((actor: any) => (
                <div key={actor.id} style={cardStyle}>
                  <StatusBadge status={actor.status} />
                  <h3>{actor.name}</h3>
                  <p style={{ color: "#666" }}>
                    {actor.email || "No email"} · {actor.actorType} · {actor.roleName}
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Roles" eyebrow="Permission structure">
            <div style={{ display: "grid", gap: 12 }}>
              {roles.map((role: any) => (
                <div key={role.id} style={cardStyle}>
                  <StatusBadge status={`level-${role.authorityLevel}`} />
                  <h3>{role.name}</h3>
                  <p>{role.description}</p>
                  <pre style={preStyle}>{JSON.stringify(role.permissions, null, 2)}</pre>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Audit Trail" eyebrow="Constitutional memory">
          <div style={{ display: "grid", gap: 12 }}>
            {auditTrail.map((item: any) => (
              <div key={item.id} style={cardStyle}>
                <StatusBadge status={item.outcome} />
                <h3>{item.eventType}</h3>
                <p>
                  <strong>Actor:</strong> {item.actor || "system"} ·{" "}
                  <strong>Role:</strong> {item.actorRole || "unknown"}
                </p>
                <p style={{ color: "#666" }}>
                  {item.action} → {item.outcome}
                </p>
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

const preStyle: React.CSSProperties = {
  background: "#111",
  color: "#fff",
  padding: 14,
  borderRadius: 14,
  overflowX: "auto",
  whiteSpace: "pre-wrap",
}