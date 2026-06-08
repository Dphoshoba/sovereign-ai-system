"use client"

import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type Agent = {
  id: string
  name: string
  role: string
  status: string
  department: {
    name: string
  } | null
}

export default function OperatingConsolePage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [agentId, setAgentId] = useState("")
  const [mission, setMission] = useState("")
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState("")
  const [activeAgent, setActiveAgent] = useState<any>(null)

  async function loadAgents() {
    const response = await fetch("/api/ai/agents")
    const result = await response.json()

    if (result.ok) {
      const activeAgents = result.agents.filter(
        (agent: Agent) => agent.status === "active"
      )

      setAgents(activeAgents)

      if (activeAgents.length > 0 && !agentId) {
        setAgentId(activeAgents[0].id)
      }
    }
  }

  async function runMission(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setOutput("")
    setActiveAgent(null)

    const response = await fetch("/api/ai/agent-runtime", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agentId,
        mission,
      }),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Agent runtime failed")
      return
    }

    setActiveAgent(result.agent)
    setOutput(result.output)
  }

  useEffect(() => {
    loadAgents()
  }, [])

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Live Agent Runtime</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          AI Operating Console
        </h1>

        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Run specialist agents live, inject memory context and execute missions
          across strategy, publishing, ministry, CRM, growth and automation.
        </p>
      </section>

      <form onSubmit={runMission} style={formStyle}>
        <label>
          Select Agent
          <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            required
            style={inputStyle}
          >
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}{" "}
                {agent.department?.name ? `· ${agent.department.name}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label>
          Mission
          <textarea
            rows={7}
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            required
            placeholder="Example: Create a launch strategy for an AI automation service for churches and small businesses."
            style={inputStyle}
          />
        </label>

        <button disabled={loading} style={buttonStyle}>
          {loading ? "Agent Running..." : "Run Agent Mission"}
        </button>
      </form>

      {activeAgent ? (
        <section style={agentPanel}>
          <p style={metaStyle}>Active Agent</p>
          <h2>{activeAgent.name}</h2>
          <p style={{ color: "var(--muted)" }}>
            {activeAgent.department || "General"} · {activeAgent.role}
          </p>
        </section>
      ) : null}

      {output ? (
        <section style={outputStyle}>
          <h2>Mission Output</h2>

          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {output}
            </ReactMarkdown>
          </div>
        </section>
      ) : null}
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

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: 16,
  maxWidth: 840,
  marginTop: 24,
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 6,
  padding: 12,
  borderRadius: 10,
  border: "1px solid var(--border)",
  fontSize: 16,
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

const agentPanel: React.CSSProperties = {
  marginTop: 28,
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const outputStyle: React.CSSProperties = {
  marginTop: 28,
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 28,
}

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "var(--muted)",
  fontSize: 13,
  margin: 0,
}