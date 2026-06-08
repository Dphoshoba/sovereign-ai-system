"use client"

import { useEffect, useState } from "react"

type Agent = {
  id: string
  name: string
  role: string
  department: string
  mission: string
  status: string
  tools: string | null
  memoryScope: string | null
}

type AgentRun = {
  id: string
  agentId: string
  agentName: string
  task: string
  summary: string | null
  output: any
  status: string
  createdAt: string
}

export default function ExecutiveAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [runs, setRuns] = useState<AgentRun[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState("")
  const [task, setTask] = useState(
    "Review the creator operations system and identify the highest-priority actions for this week."
  )
  const [loading, setLoading] = useState(false)

  async function loadAgents() {
    const response = await fetch("/api/executive-agents")
    const result = await response.json()

    if (result.ok) {
      setAgents(result.agents)
      setRuns(result.runs)

      if (!selectedAgentId && result.agents.length > 0) {
        setSelectedAgentId(result.agents[0].id)
      }
    }
  }

  async function runAgent() {
    if (!selectedAgentId || !task.trim()) return

    setLoading(true)

    const response = await fetch("/api/executive-agents/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agentId: selectedAgentId,
        task,
      }),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Agent run failed")
      return
    }

    await loadAgents()
  }

  useEffect(() => {
    loadAgents()
  }, [])

  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId)

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Workforce</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Multi-Agent Executive Workforce
        </h1>

        <p style={{ color: "var(--hero-muted)", maxWidth: 880, lineHeight: 1.7 }}>
          Coordinate specialized AI agents across strategy, creator success,
          revenue, workflow architecture, research and operations monitoring.
        </p>
      </section>

      <section style={metricsGrid}>
        <Metric label="Agents" value={agents.length.toString()} />
        <Metric label="Runs" value={runs.length.toString()} />
        <Metric
          label="Active"
          value={agents.filter((agent) => agent.status === "active").length.toString()}
        />
      </section>

      <section style={gridTwo}>
        <section>
          <h2>Executive Agents</h2>

          <div style={{ display: "grid", gap: 14 }}>
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                style={{
                  ...cardButton,
                  border:
                    selectedAgentId === agent.id
                      ? "2px solid #4f46e5"
                      : "1px solid #ddd",
                }}
              >
                <p style={metaStyle}>{agent.department}</p>
                <h3>{agent.name}</h3>
                <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>{agent.role}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2>Run Agent</h2>

          <div style={editorCard}>
            {selectedAgent ? (
              <>
                <p style={metaStyle}>{selectedAgent.department}</p>
                <h3>{selectedAgent.name}</h3>
                <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
                  {selectedAgent.mission}
                </p>
                <p>
                  <strong>Tools:</strong> {selectedAgent.tools || "Not listed"}
                </p>
                <p>
                  <strong>Memory:</strong>{" "}
                  {selectedAgent.memoryScope || "Not listed"}
                </p>
              </>
            ) : null}

            <label>
              Agent Task
              <textarea
                rows={6}
                value={task}
                onChange={(e) => setTask(e.target.value)}
                style={inputStyle}
              />
            </label>

            <button disabled={loading} onClick={runAgent} style={buttonStyle}>
              {loading ? "Running Agent..." : "Run Executive Agent"}
            </button>
          </div>
        </section>
      </section>

      <section style={{ marginTop: 34 }}>
        <h2>Recent Agent Runs</h2>

        <div style={{ display: "grid", gap: 16 }}>
          {runs.map((run) => (
            <article key={run.id} style={cardStyle}>
              <p style={metaStyle}>
                {run.agentName} · {run.status}
              </p>

              <h3>{run.task}</h3>

              {run.summary ? (
                <p style={{ lineHeight: 1.7 }}>{run.summary}</p>
              ) : null}

              {run.output?.recommendedActions?.length ? (
                <div>
                  <strong>Recommended Actions</strong>
                  <ul style={{ lineHeight: 1.8 }}>
                    {run.output.recommendedActions.map((item: any, index: number) => (
                      <li key={index}>
                        <strong>{item.priority}:</strong> {item.action} —{" "}
                        {item.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {run.output?.handoffSuggestions?.length ? (
                <div>
                  <strong>Handoff Suggestions</strong>
                  <ul style={{ lineHeight: 1.8 }}>
                    {run.output.handoffSuggestions.map((item: any, index: number) => (
                      <li key={index}>
                        <strong>{item.agent}:</strong> {item.task}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <p style={{ color: "var(--muted)" }}>
                {new Date(run.createdAt).toLocaleString("en-AU")}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={metricCard}>
      <p style={metaStyle}>{label}</p>
      <h2>{value}</h2>
    </div>
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

const metricsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
  marginTop: 28,
}

const metricCard: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const gridTwo: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
  gap: 24,
  marginTop: 34,
}

const cardButton: React.CSSProperties = {
  textAlign: "left",
  background: "var(--card-background)",
  borderRadius: 18,
  padding: 22,
  cursor: "pointer",
}

const editorCard: React.CSSProperties = {
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

const cardStyle: React.CSSProperties = {
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