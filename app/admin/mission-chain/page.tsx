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

type MissionStep = {
  agentId: string
  agentName: string
  department: string | null
  role: string
  output: string
}

export default function MissionChainPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([])
  const [mission, setMission] = useState("")
  const [loading, setLoading] = useState(false)
  const [steps, setSteps] = useState<MissionStep[]>([])
  const [finalReport, setFinalReport] = useState("")

  async function loadAgents() {
    const response = await fetch("/api/ai/agents")
    const result = await response.json()

    if (result.ok) {
      const activeAgents = result.agents.filter(
        (agent: Agent) => agent.status === "active"
      )

      setAgents(activeAgents)

      if (activeAgents.length > 0) {
        setSelectedAgentIds(activeAgents.slice(0, 3).map((agent: Agent) => agent.id))
      }
    }
  }

  function toggleAgent(agentId: string) {
    if (selectedAgentIds.includes(agentId)) {
      setSelectedAgentIds(selectedAgentIds.filter((id) => id !== agentId))
      return
    }

    setSelectedAgentIds([...selectedAgentIds, agentId])
  }

  async function runMissionChain(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setSteps([])
    setFinalReport("")

    const response = await fetch("/api/ai/mission-chain", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mission,
        agentIds: selectedAgentIds,
      }),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Mission chain failed")
      return
    }

    setSteps(result.steps)
    setFinalReport(result.finalReport)
  }

  useEffect(() => {
    loadAgents()
  }, [])

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Multi-Agent Collaboration</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Mission Chains
        </h1>

        <p style={{ color: "var(--hero-muted)", maxWidth: 840, lineHeight: 1.7 }}>
          Select multiple specialist agents, give them one mission and let them
          collaborate in sequence with handoffs and a final executive report.
        </p>
      </section>

      <form onSubmit={runMissionChain} style={formStyle}>
        <label>
          Mission
          <textarea
            rows={6}
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            required
            placeholder="Example: Build a 30-day launch plan for an AI automation service for churches, creators and small businesses."
            style={inputStyle}
          />
        </label>

        <div>
          <h2>Select Agents</h2>

          <div style={agentGrid}>
            {agents.map((agent) => {
              const selected = selectedAgentIds.includes(agent.id)

              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => toggleAgent(agent.id)}
                  style={{
                    ...agentButton,
                    background: selected ? "#111" : "#fff",
                    color: selected ? "#fff" : "#111",
                  }}
                >
                  <strong>{agent.name}</strong>
                  <span style={{ fontSize: 13 }}>
                    {agent.department?.name || "General"}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <button
          disabled={loading || selectedAgentIds.length === 0}
          style={buttonStyle}
        >
          {loading ? "Agents Collaborating..." : "Run Mission Chain"}
        </button>
      </form>

      {finalReport ? (
        <section style={outputStyle}>
          <h2>Final Mission Report</h2>

          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {finalReport}
            </ReactMarkdown>
          </div>
        </section>
      ) : null}

      {steps.length > 0 ? (
        <section style={{ marginTop: 28, display: "grid", gap: 20 }}>
          <h2>Agent Handoffs</h2>

          {steps.map((step, index) => (
            <article key={`${step.agentId}-${index}`} style={stepCard}>
              <p style={metaStyle}>
                Step {index + 1} · {step.department || "General"}
              </p>

              <h3>{step.agentName}</h3>

              <p style={{ color: "var(--muted)" }}>{step.role}</p>

              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {step.output}
                </ReactMarkdown>
              </div>
            </article>
          ))}
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
  gap: 18,
  maxWidth: 900,
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

const agentGrid: React.CSSProperties = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
}

const agentButton: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: 16,
  textAlign: "left",
  cursor: "pointer",
  display: "grid",
  gap: 6,
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

const outputStyle: React.CSSProperties = {
  marginTop: 28,
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 28,
}

const stepCard: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "var(--muted)",
  fontSize: 13,
  margin: 0,
}