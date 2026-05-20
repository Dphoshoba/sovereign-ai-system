"use client"

import { useEffect, useState } from "react"

type Rule = {
  id: string
  agentId: string | null
  department: string | null
  action: string
  allowed: boolean
  requiresApproval: boolean
  notes: string | null
}

type Approval = {
  id: string
  action: string
  status: string
  reason: string | null
  createdAt: string
}

export default function GovernancePage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    action: "save_memory",
    department: "",
    agentId: "",
    allowed: true,
    requiresApproval: false,
    notes: "",
  })

  async function loadGovernance() {
    const response = await fetch("/api/ai/governance")
    const result = await response.json()

    if (result.ok) {
      setRules(result.rules)
      setApprovals(result.approvals)
    }
  }

  async function saveRule(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)

    const response = await fetch("/api/ai/governance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to save rule")
      return
    }

    setForm({
      action: "save_memory",
      department: "",
      agentId: "",
      allowed: true,
      requiresApproval: false,
      notes: "",
    })

    loadGovernance()
  }

  async function updateApproval(id: string, status: "approved" | "rejected") {
    setLoading(true)

    const response = await fetch("/api/ai/governance/approval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        status,
        reason:
          status === "approved"
            ? "Approved by admin."
            : "Rejected by admin.",
      }),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to update approval")
      return
    }

    loadGovernance()
  }

  useEffect(() => {
    loadGovernance()
  }, [])

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>AI Constitution</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Governance + Permissions
        </h1>

        <p style={{ color: "#ddd", maxWidth: 840, lineHeight: 1.7 }}>
          Control which agents and departments may execute tools, which actions
          need approval, and which operations are blocked.
        </p>
      </section>

      <form onSubmit={saveRule} style={formStyle}>
        <label>
          Action
          <select
            value={form.action}
            onChange={(e) => setForm({ ...form, action: e.target.value })}
            style={inputStyle}
          >
            <option value="save_memory">Save Memory</option>
            <option value="create_job">Create Job</option>
            <option value="log_activity">Log Activity</option>
            <option value="create_crm_client">Create CRM Client</option>
          </select>
        </label>

        <label>
          Department
          <input
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            placeholder="Optional: Growth Department"
            style={inputStyle}
          />
        </label>

        <label>
          Agent ID
          <input
            value={form.agentId}
            onChange={(e) => setForm({ ...form, agentId: e.target.value })}
            placeholder="Optional specific agent ID"
            style={inputStyle}
          />
        </label>

        <label style={checkboxStyle}>
          <input
            type="checkbox"
            checked={form.allowed}
            onChange={(e) => setForm({ ...form, allowed: e.target.checked })}
          />
          Allow action
        </label>

        <label style={checkboxStyle}>
          <input
            type="checkbox"
            checked={form.requiresApproval}
            onChange={(e) =>
              setForm({ ...form, requiresApproval: e.target.checked })
            }
          />
          Requires approval
        </label>

        <label>
          Notes
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            style={inputStyle}
          />
        </label>

        <button disabled={loading} style={buttonStyle}>
          {loading ? "Saving..." : "Save Permission Rule"}
        </button>
      </form>

      <section style={gridTwo}>
        <section>
          <h2>Permission Rules</h2>

          <div style={{ display: "grid", gap: 14 }}>
            {rules.map((rule) => (
              <div key={rule.id} style={cardStyle}>
                <p style={metaStyle}>{rule.action}</p>
                <h3>{rule.allowed ? "Allowed" : "Blocked"}</h3>
                <p>
                  <strong>Approval:</strong>{" "}
                  {rule.requiresApproval ? "Required" : "Not required"}
                </p>
                <p>
                  <strong>Department:</strong> {rule.department || "Global"}
                </p>
                <p>
                  <strong>Agent:</strong> {rule.agentId || "Any"}
                </p>
                {rule.notes ? <p>{rule.notes}</p> : null}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>Approval Requests</h2>

          <div style={{ display: "grid", gap: 14 }}>
            {approvals.map((approval) => (
              <div key={approval.id} style={cardStyle}>
                <p style={metaStyle}>{approval.status}</p>
                <h3>{approval.action}</h3>
                {approval.reason ? <p>{approval.reason}</p> : null}

                {approval.status === "pending" ? (
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      disabled={loading}
                      onClick={() => updateApproval(approval.id, "approved")}
                      style={buttonStyle}
                    >
                      Approve
                    </button>

                    <button
                      disabled={loading}
                      onClick={() => updateApproval(approval.id, "rejected")}
                      style={dangerButton}
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

const heroStyle: React.CSSProperties = {
  background: "#111",
  color: "#fff",
  borderRadius: 24,
  padding: 34,
}

const eyebrowStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "#aaa",
  margin: 0,
}

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: 16,
  maxWidth: 840,
  marginTop: 24,
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 24,
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 6,
  padding: 12,
  borderRadius: 10,
  border: "1px solid #ccc",
  fontSize: 16,
}

const checkboxStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  fontWeight: "bold",
}

const gridTwo: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 24,
  marginTop: 40,
}

const buttonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "none",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
}

const dangerButton: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "none",
  background: "#b00020",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 22,
}

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "#777",
  fontSize: 13,
  margin: 0,
}