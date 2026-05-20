"use client"

import { useEffect, useState } from "react"
import {
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  PageShell,
  StatusBadge,
} from "@/components/executive-ui"

export default function IdentityRuntimePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loginEmail, setLoginEmail] = useState("davidoshoba@gmail.com")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")
  const [accessResult, setAccessResult] = useState<any>(null)

  async function loadData() {
    const res = await fetch("/api/identity-runtime")
    const result = await res.json()

    if (result.ok) setData(result)
  }

  async function simulateLogin() {
    setLoading(true)

    const res = await fetch("/api/identity-runtime", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: loginEmail,
        name: loginEmail.split("@")[0],
      }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Login failed")
      return
    }

    await loadData()
  }

  async function inviteMember() {
    const org = data?.activeOrganization || data?.organizations?.[0]

    if (!org || !inviteEmail.trim()) return

    setLoading(true)

    const res = await fetch("/api/identity-runtime/invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        organizationId: org.id,
        email: inviteEmail,
        role: inviteRole,
        invitedBy: "davidoshoba@gmail.com",
      }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Invitation failed")
      return
    }

    setInviteEmail("")
    await loadData()

    alert(`Invite created: ${result.inviteLink}`)
  }

  async function checkAccess() {
    const org = data?.activeOrganization || data?.organizations?.[0]

    if (!org) return

    setLoading(true)

    const res = await fetch("/api/identity-runtime/access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: loginEmail,
        organizationId: org.id,
        resource: "admin",
        action: "access",
      }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Access check failed")
      return
    }

    setAccessResult(result)
    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  const users = data?.users || []
  const sessions = data?.sessions || []
  const invitations = data?.invitations || []
  const accessPolicies = data?.accessPolicies || []
  const accessLogs = data?.accessLogs || []

  const activeSessions = sessions.filter((s: any) => s.status === "active").length
  const pendingInvites = invitations.filter((i: any) => i.status === "pending").length
  const deniedLogs = accessLogs.filter((l: any) => l.decision === "denied").length

  return (
    <PageShell
      eyebrow="Trust and Institutional Access"
      title="Sovereign Identity Fabric"
      description="Manage identity users, sessions, invitations, tenant access policies and scoped institutional permissions."
    >
      <ExecutiveGrid min={220}>
        <MetricCard label="Users" value={users.length} />
        <MetricCard label="Active Sessions" value={activeSessions} />
        <MetricCard label="Pending Invites" value={pendingInvites} />
        <MetricCard label="Access Policies" value={accessPolicies.length} />
        <MetricCard label="Denied Access" value={deniedLogs} />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Simulate Login" eyebrow="Session runtime">
            <input
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Email"
              style={inputStyle}
            />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button disabled={loading} onClick={simulateLogin} style={buttonStyle}>
                Create Session
              </button>

              <button disabled={loading} onClick={checkAccess} style={secondaryButtonStyle}>
                Check Admin Access
              </button>
            </div>

            {accessResult ? (
              <div style={cardStyle}>
                <StatusBadge status={accessResult.allowed ? "allowed" : "denied"} />
                <h3>{accessResult.allowed ? "Access Allowed" : "Access Denied"}</h3>
                <p>Role: {accessResult.role || "none"}</p>
              </div>
            ) : null}
          </ExecutiveCard>

          <ExecutiveCard title="Invite Member" eyebrow="Institutional onboarding">
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Invite email"
              style={inputStyle}
            />

            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              style={inputStyle}
            >
              <option value="member">Member</option>
              <option value="operator">Operator</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>

            <button disabled={loading} onClick={inviteMember} style={buttonStyle}>
              Create Invitation
            </button>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Identity Users" eyebrow="People and accounts">
            <div style={{ display: "grid", gap: 12 }}>
              {users.map((user: any) => (
                <div key={user.id} style={cardStyle}>
                  <StatusBadge status={user.status} />
                  <h3>{user.name || user.email}</h3>
                  <p style={{ color: "#666" }}>{user.email}</p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Sessions" eyebrow="Active access context">
            <div style={{ display: "grid", gap: 12 }}>
              {sessions.map((session: any) => (
                <div key={session.id} style={cardStyle}>
                  <StatusBadge status={session.status} />
                  <h3>{session.email}</h3>
                  <p style={{ color: "#666" }}>
                    Role {session.role || "none"} · Org {session.organizationId || "none"}
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Invitations" eyebrow="Onboarding queue">
            <div style={{ display: "grid", gap: 12 }}>
              {invitations.map((invite: any) => (
                <div key={invite.id} style={cardStyle}>
                  <StatusBadge status={invite.status} />
                  <h3>{invite.email}</h3>
                  <p style={{ color: "#666" }}>
                    Role {invite.role} · Token {invite.token}
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Tenant Access Policies" eyebrow="Scoped permissions">
            <div style={{ display: "grid", gap: 12 }}>
              {accessPolicies.map((policy: any) => (
                <div key={policy.id} style={cardStyle}>
                  <StatusBadge status={policy.status} />
                  <h3>{policy.title}</h3>
                  <p style={{ color: "#666" }}>
                    {policy.resource} · {policy.action} · {policy.enforcement}
                  </p>
                  <pre style={preStyle}>
                    {JSON.stringify(policy.allowedRoles, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Access Decision Logs" eyebrow="Permission audit">
          <div style={{ display: "grid", gap: 12 }}>
            {accessLogs.map((log: any) => (
              <div key={log.id} style={cardStyle}>
                <StatusBadge status={log.decision} />
                <h3>{log.email || "Unknown actor"}</h3>
                <p>{log.reason}</p>
                <p style={{ color: "#666" }}>
                  {log.resource} · {log.action} · Role {log.role || "none"}
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