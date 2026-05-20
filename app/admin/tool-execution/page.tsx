"use client"

import { useState } from "react"

export default function ToolExecutionPage() {
  const [action, setAction] = useState("save_memory")
  const [payload, setPayload] = useState(`{
  "type": "strategy",
  "title": "Example Memory",
  "content": "This is a saved memory from tool execution.",
  "tags": "tool, memory"
}`)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState("")

  async function runTool(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setResult("")

    try {
      const parsedPayload = JSON.parse(payload)

      const response = await fetch("/api/ai/tool-execution", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          payload: parsedPayload,
        }),
      })

      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult(
        error instanceof Error
          ? error.message
          : "Invalid payload or tool execution failed"
      )
    }

    setLoading(false)
  }

  function loadTemplate(nextAction: string) {
    setAction(nextAction)

    if (nextAction === "save_memory") {
      setPayload(`{
  "type": "strategy",
  "title": "Strategic Insight",
  "content": "Save an important long-term insight here.",
  "tags": "strategy, memory"
}`)
    }

    if (nextAction === "create_job") {
      setPayload(`{
  "type": "publish-scheduled",
  "payload": {
    "source": "manual-tool-console"
  }
}`)
    }

    if (nextAction === "log_activity") {
      setPayload(`{
  "type": "agent-action",
  "title": "Manual Tool Test",
  "message": "The tool execution layer is working.",
  "status": "success"
}`)
    }

    if (nextAction === "create_crm_client") {
      setPayload(`{
  "name": "Sample Lead",
  "email": "sample@example.com",
  "type": "lead",
  "status": "new",
  "source": "tool-console",
  "interests": "AI automation and strategy",
  "notes": "Created through tool execution layer.",
  "tags": "test, lead"
}`)
    }
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Agent Actions</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          AI Tool Execution Layer
        </h1>

        <p style={{ color: "#ddd", maxWidth: 820, lineHeight: 1.7 }}>
          Execute approved internal actions safely: save memory, create jobs,
          log activity and create CRM leads.
        </p>
      </section>

      <form onSubmit={runTool} style={formStyle}>
        <label>
          Tool Action
          <select
            value={action}
            onChange={(e) => loadTemplate(e.target.value)}
            style={inputStyle}
          >
            <option value="save_memory">Save Memory</option>
            <option value="create_job">Create Job</option>
            <option value="log_activity">Log Activity</option>
            <option value="create_crm_client">Create CRM Client</option>
          </select>
        </label>

        <label>
          Payload JSON
          <textarea
            rows={14}
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            style={inputStyle}
          />
        </label>

        <button disabled={loading} style={buttonStyle}>
          {loading ? "Executing..." : "Execute Tool"}
        </button>
      </form>

      {result ? (
        <section style={resultStyle}>
          <h2>Result</h2>
          <pre style={preStyle}>{result}</pre>
        </section>
      ) : null}
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
  maxWidth: 900,
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

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
}

const resultStyle: React.CSSProperties = {
  marginTop: 28,
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 24,
}

const preStyle: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  background: "#111",
  color: "#fff",
  borderRadius: 12,
  padding: 16,
  overflowX: "auto",
}