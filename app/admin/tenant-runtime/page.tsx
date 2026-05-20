"use client"

import { useEffect, useState } from "react"
import {
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  PageShell,
  StatusBadge,
} from "@/components/executive-ui"

export default function TenantRuntimePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [orgName, setOrgName] = useState("")
  const [ownerEmail, setOwnerEmail] = useState("")

  async function loadData() {
    const res = await fetch("/api/tenant-runtime")
    const result = await res.json()

    if (result.ok) {
      setData(result)
    }
  }

  async function runTenantSnapshot() {
    setLoading(true)

    const res = await fetch("/api/tenant-runtime", {
      method: "POST",
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Tenant runtime failed")
      return
    }

    await loadData()
  }

  async function createOrganization() {
    if (!orgName.trim()) return

    setLoading(true)

    const res = await fetch("/api/tenant-runtime/organization", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: orgName,
        ownerEmail,
        ownerName: ownerEmail ? ownerEmail.split("@")[0] : "",
        orgType: "organization",
        plan: "starter",
      }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Organization creation failed")
      return
    }

    setOrgName("")
    setOwnerEmail("")
    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  const organizations = data?.organizations || []
  const workspaces = data?.workspaces || []
  const members = data?.members || []
  const policies = data?.policies || []
  const records = data?.records || []
  const snapshots = data?.snapshots || []
  const latest = snapshots[0]

  return (
    <PageShell
      eyebrow="Institutional Workspace Runtime"
      title="Multi-Tenant Sovereign Organization Layer"
      description="Create tenant organizations, isolate workspaces, scope intelligence records, manage tenant governance and prepare the platform for real institutional onboarding."
    >
      <ExecutiveGrid min={220}>
        <MetricCard label="Organizations" value={organizations.length} />
        <MetricCard label="Workspaces" value={workspaces.length} />
        <MetricCard label="Members" value={members.length} />
        <MetricCard label="Tenant Policies" value={policies.length} />
        <MetricCard label="Tenant Records" value={records.length} />
        <MetricCard label="Runtime Snapshots" value={snapshots.length} />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Tenant Runtime Control" eyebrow="Organization intelligence">
            <button disabled={loading} onClick={runTenantSnapshot} style={buttonStyle}>
              {loading ? "Generating..." : "Generate Tenant Runtime Snapshot"}
            </button>

            {latest ? (
              <div style={cardStyle}>
                <StatusBadge status={latest.status} />
                <h3>{latest.title}</h3>
                <p>{latest.summary}</p>
                <p style={{ color: "#666" }}>
                  Health {latest.healthScore}/100 · Governance{" "}
                  {latest.governanceScore}/100 · Execution{" "}
                  {latest.executionScore}/100 · Economic {latest.economicScore}/100
                </p>
                <pre style={preStyle}>{JSON.stringify(latest.state, null, 2)}</pre>
              </div>
            ) : null}
          </ExecutiveCard>

          <ExecutiveCard title="Create Organization" eyebrow="Tenant onboarding">
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Organization name"
              style={inputStyle}
            />

            <input
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="Owner email"
              style={inputStyle}
            />

            <button disabled={loading} onClick={createOrganization} style={buttonStyle}>
              Create Tenant Organization
            </button>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Organizations" eyebrow="Tenant registry">
            <div style={{ display: "grid", gap: 12 }}>
              {organizations.map((org: any) => (
                <div key={org.id} style={cardStyle}>
                  <StatusBadge status={org.status} />
                  <h3>{org.name}</h3>
                  <p style={{ color: "#666" }}>
                    /{org.slug} · {org.orgType} · Plan {org.plan}
                  </p>
                  <p>Owner: {org.ownerEmail || "Not assigned"}</p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Workspaces" eyebrow="Tenant isolation">
            <div style={{ display: "grid", gap: 12 }}>
              {workspaces.map((workspace: any) => (
                <div key={workspace.id} style={cardStyle}>
                  <StatusBadge status={workspace.status} />
                  <h3>{workspace.name}</h3>
                  <p style={{ color: "#666" }}>
                    /{workspace.slug} · {workspace.workspaceType}
                  </p>
                  <p style={{ fontSize: 12, color: "#777" }}>
                    Org: {workspace.organizationId}
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Members" eyebrow="Tenant access">
            <div style={{ display: "grid", gap: 12 }}>
              {members.map((member: any) => (
                <div key={member.id} style={cardStyle}>
                  <StatusBadge status={member.role} />
                  <h3>{member.name || member.email}</h3>
                  <p style={{ color: "#666" }}>
                    {member.email} · {member.status}
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Tenant Governance Policies" eyebrow="Scoped rules">
            <div style={{ display: "grid", gap: 12 }}>
              {policies.map((policy: any) => (
                <div key={policy.id} style={cardStyle}>
                  <StatusBadge status={policy.severity} />
                  <h3>{policy.title}</h3>
                  <p style={{ color: "#666" }}>
                    {policy.policyType} · {policy.enforcement}
                  </p>
                  <pre style={preStyle}>{JSON.stringify(policy.rules, null, 2)}</pre>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Tenant Intelligence Records" eyebrow="Scoped memory">
          <div style={{ display: "grid", gap: 12 }}>
            {records.map((record: any) => (
              <div key={record.id} style={cardStyle}>
                <StatusBadge status={record.priority} />
                <h3>{record.title}</h3>
                <p>{record.summary}</p>
                <p style={{ color: "#666" }}>
                  {record.recordType} · {record.sourceLayer || "unknown"}
                </p>
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