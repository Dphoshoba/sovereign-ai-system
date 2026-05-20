"use client"

import { useState } from "react"

export default function MultiAgentPage() {
  const [topic, setTopic] = useState("")
  const [loading, setLoading] = useState(false)
  const [workflow, setWorkflow] = useState<any>(null)

  async function runWorkflow(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setWorkflow(null)

    const response = await fetch("/api/ai/multi-agent-workflow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ topic }),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to run workflow")
      return
    }

    setWorkflow(result.workflow)
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>Multi-Agent AI Workflow</h1>

      <p style={{ maxWidth: 760, color: "#555", lineHeight: 1.7 }}>
        Run Research, SEO, Editor, Thumbnail, and Publishing Strategy agents
        together for one Echoes & Visions content idea.
      </p>

      <form onSubmit={runWorkflow} style={formStyle}>
        <label>
          Topic
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            placeholder="Example: How AI agents help churches manage communication"
            style={inputStyle}
          />
        </label>

        <button disabled={loading} style={buttonStyle}>
          {loading ? "Agents working..." : "Run Multi-Agent Workflow"}
        </button>
      </form>

      {workflow ? (
        <section style={{ marginTop: 34, display: "grid", gap: 22 }}>
          <AgentCard title="Final Publishing Plan" content={workflow.finalPlan} />
          <AgentCard title="Research Agent" content={workflow.research} />
          <AgentCard title="SEO Agent" content={workflow.seo} />
          <AgentCard title="Editor Agent" content={workflow.editor} />
          <AgentCard title="Thumbnail Agent" content={workflow.thumbnail} />
        </section>
      ) : null}
    </main>
  )
}

function AgentCard({ title, content }: { title: string; content: string }) {
  return (
    <div style={cardStyle}>
      <h2>{title}</h2>
      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.75 }}>{content}</div>
    </div>
  )
}

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: 16,
  maxWidth: 760,
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

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 24,
}