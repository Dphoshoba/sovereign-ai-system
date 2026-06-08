"use client"

import { useEffect, useState } from "react"

type Tool = {
  id: string
  name: string
  description: string | null
  category: string
  riskLevel: string
  requiresApproval: boolean
  enabled: boolean
}

type ToolAction = {
  id: string
  toolName: string
  title: string
  description: string | null
  status: string
  riskLevel: string
  requiresApproval: boolean
  approved: boolean
  payload: any
  result: any
  error: string | null
  createdAt: string
}

export default function ToolGatewayPage() {
  const [tools, setTools] = useState<Tool[]>([])
  const [actions, setActions] = useState<ToolAction[]>([])
  const [toolName, setToolName] = useState("create-follow-up-task")
  const [title, setTitle] = useState("Follow up with hot creator lead")
  const [description, setDescription] = useState("")
  const [payload, setPayload] = useState(
    JSON.stringify(
      {
        leadId: "",
        title: "Follow up with hot creator lead",
        description: "Reach out and offer two audit time slots.",
        priority: "high",
      },
      null,
      2
    )
  )
  const [loading, setLoading] = useState(false)

  async function loadGateway() {
    const response = await fetch("/api/tool-gateway")
    const result = await response.json()

    if (result.ok) {
      setTools(result.tools)
      setActions(result.actions)

      if (result.tools.length > 0 && !toolName) {
        setToolName(result.tools[0].name)
      }
    }
  }

  async function createAction() {
    setLoading(true)

    try {
      const parsedPayload = payload.trim() ? JSON.parse(payload) : {}

      const response = await fetch("/api/tool-gateway", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toolName,
          title,
          description,
          payload: parsedPayload,
        }),
      })

      const result = await response.json()

      if (!result.ok) {
        alert(result.error || "Failed to create tool action")
        return
      }

      await loadGateway()
    } catch {
      alert("Payload must be valid JSON")
    } finally {
      setLoading(false)
    }
  }

  async function approveAction(actionId: string) {
    setLoading(true)

    const response = await fetch("/api/tool-gateway/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ actionId }),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to approve action")
      return
    }

    await loadGateway()
  }

  async function runAction(actionId: string) {
    setLoading(true)

    const response = await fetch("/api/tool-gateway/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ actionId }),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to run action")
      return
    }

    await loadGateway()
  }

  useEffect(() => {
    loadGateway()
  }, [])

  const selectedTool = tools.find((tool) => tool.name === toolName)

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>External Execution</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Tool Execution Layer + Action Gateway
        </h1>

        <p style={{ color: "var(--hero-muted)", maxWidth: 880, lineHeight: 1.7 }}>
          Queue, approve and execute governed operational actions across CRM,
          email drafts, invoices, event bus and external integrations.
        </p>
      </section>

      <section style={gridTwo}>
        <section style={panelStyle}>
          <h2>Create Tool Action</h2>

          <label>
            Tool
            <select
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              style={inputStyle}
            >
              {tools.map((tool) => (
                <option key={tool.id} value={tool.name}>
                  {tool.name}
                </option>
              ))}
            </select>
          </label>

          {selectedTool ? (
            <div style={summaryBox}>
              <p>
                <strong>Risk:</strong> {selectedTool.riskLevel}
              </p>
              <p>
                <strong>Approval:</strong>{" "}
                {selectedTool.requiresApproval ? "Required" : "Not required"}
              </p>
              <p>{selectedTool.description}</p>
            </div>
          ) : null}

          <label>
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label>
            Description
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label>
            Payload JSON
            <textarea
              rows={10}
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              style={inputStyle}
            />
          </label>

          <button disabled={loading} onClick={createAction} style={buttonStyle}>
            {loading ? "Creating..." : "Create Tool Action"}
          </button>
        </section>

        <section style={panelStyle}>
          <h2>Registered Tools</h2>

          <div style={{ display: "grid", gap: 12 }}>
            {tools.map((tool) => (
              <article key={tool.id} style={miniCardStyle}>
                <p style={metaStyle}>
                  {tool.category} · {tool.riskLevel}
                </p>
                <h3>{tool.name}</h3>
                <p>{tool.description}</p>
                <p>
                  <strong>Status:</strong>{" "}
                  {tool.enabled ? "Enabled" : "Disabled"}
                </p>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section style={{ marginTop: 34 }}>
        <h2>Action Queue</h2>

        <div style={{ display: "grid", gap: 16 }}>
          {actions.map((action) => (
            <article key={action.id} style={cardStyle}>
              <p style={metaStyle}>
                {action.riskLevel} · {action.status} · {action.toolName}
              </p>

              <h3>{action.title}</h3>

              {action.description ? (
                <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
                  {action.description}
                </p>
              ) : null}

              <p>
                <strong>Approval:</strong>{" "}
                {action.requiresApproval
                  ? action.approved
                    ? "Approved"
                    : "Required"
                  : "Not required"}
              </p>

              {action.error ? (
                <p style={{ color: "#b00020" }}>
                  <strong>Error:</strong> {action.error}
                </p>
              ) : null}

              {action.result ? (
                <div style={summaryBox}>
                  <strong>Result</strong>
                  <pre style={{ whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(action.result, null, 2)}
                  </pre>
                </div>
              ) : null}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {action.requiresApproval && !action.approved ? (
                  <button
                    disabled={loading}
                    onClick={() => approveAction(action.id)}
                    style={secondaryButton}
                  >
                    Approve
                  </button>
                ) : null}

                {["queued", "approval-required"].includes(action.status) &&
                (!action.requiresApproval || action.approved) ? (
                  <button
                    disabled={loading}
                    onClick={() => runAction(action.id)}
                    style={buttonStyle}
                  >
                    Run Action
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

const heroStyle: React.CSSProperties = {
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  borderRadius: 24,
  padding: 34,
}

const eyebrowStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "var(--muted)",
  margin: 0,
}

const gridTwo: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
  gap: 24,
  marginTop: 34,
}

const panelStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 6,
  marginBottom: 14,
  padding: 12,
  borderRadius: 10,
  border: "1px solid var(--border)",
  fontSize: 15,
  fontFamily: "inherit",
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  cursor: "pointer",
  fontWeight: "bold",
}

const secondaryButton: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "1px solid #111",
  background: "var(--card-background)",
  color: "var(--foreground)",
  cursor: "pointer",
  fontWeight: "bold",
}

const cardStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const miniCardStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: 18,
}

const summaryBox: React.CSSProperties = {
  background: "var(--card-background)",
  borderRadius: 12,
  padding: 16,
  marginTop: 12,
  marginBottom: 12,
}

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "var(--muted)",
  fontSize: 13,
  margin: 0,
}