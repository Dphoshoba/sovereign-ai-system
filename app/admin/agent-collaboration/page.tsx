"use client"

import { useEffect, useState } from "react"

type Agent = {
  id: string
  name: string
  role: string
  department: string
}

type Delegation = {
  id: string
  fromAgentName: string
  toAgentName: string
  task: string
  context: string | null
  status: string
  priority: string
  responseSummary: string | null
  responsePayload: any
  createdAt: string
}

type Session = {
  id: string
  title: string
  objective: string
  status: string
  summary: string | null
  result: any
  createdAt: string
}

export default function AgentCollaborationPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [delegations, setDelegations] = useState<Delegation[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [fromAgentId, setFromAgentId] = useState("")
  const [toAgentId, setToAgentId] = useState("")
  const [task, setTask] = useState("Analyze this issue and recommend the next operational move.")
  const [context, setContext] = useState("")
  const [priority, setPriority] = useState("medium")
  const [objective, setObjective] = useState(
    "Decide the highest-leverage creator operations priority for this week."
  )
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const response = await fetch("/api/agent-collaboration")
    const result = await response.json()

    if (result.ok) {
      setAgents(result.agents)
      setDelegations(result.delegations)
      setSessions(result.sessions)

      if (!fromAgentId && result.agents.length > 0) setFromAgentId(result.agents[0].id)
      if (!toAgentId && result.agents.length > 1) setToAgentId(result.agents[1].id)
    }
  }

  async function createDelegation() {
    setLoading(true)

    const response = await fetch("/api/agent-collaboration", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fromAgentId,
        toAgentId,
        task,
        context,
        priority,
      }),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to create delegation")
      return
    }

    await loadData()
  }

  async function runDelegation(delegationId: string) {
    setLoading(true)

    const response = await fetch("/api/agent-collaboration/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ delegationId }),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to run delegation")
      return
    }

    await loadData()
  }

  async function runBoardroom() {
    setLoading(true)

    const response = await fetch("/api/agent-collaboration/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Executive Boardroom Session",
        objective,
      }),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to run boardroom session")
      return
    }

    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Agent Boardroom</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Multi-Agent Collaboration + Delegation
        </h1>

        <p style={{ color: "var(--hero-muted)", maxWidth: 880, lineHeight: 1.7 }}>
          Let executive agents delegate tasks, respond as specialists and form
          unified operational decisions.
        </p>
      </section>

      <section style={gridTwo}>
        <section style={panelStyle}>
          <h2>Create Delegation</h2>

          <label>
            From Agent
            <select value={fromAgentId} onChange={(e) => setFromAgentId(e.target.value)} style={inputStyle}>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            To Agent
            <select value={toAgentId} onChange={(e) => setToAgentId(e.target.value)} style={inputStyle}>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Priority
            <select value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle}>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </label>

          <label>
            Task
            <textarea rows={4} value={task} onChange={(e) => setTask(e.target.value)} style={inputStyle} />
          </label>

          <label>
            Context
            <textarea rows={4} value={context} onChange={(e) => setContext(e.target.value)} style={inputStyle} />
          </label>

          <button disabled={loading} onClick={createDelegation} style={buttonStyle}>
            {loading ? "Working..." : "Create Delegation"}
          </button>
        </section>

        <section style={panelStyle}>
          <h2>Executive Boardroom</h2>

          <label>
            Objective
            <textarea rows={6} value={objective} onChange={(e) => setObjective(e.target.value)} style={inputStyle} />
          </label>

          <button disabled={loading} onClick={runBoardroom} style={buttonStyle}>
            {loading ? "Running..." : "Run Boardroom Session"}
          </button>
        </section>
      </section>

      <section style={{ marginTop: 34 }}>
        <h2>Delegations</h2>

        <div style={{ display: "grid", gap: 16 }}>
          {delegations.map((delegation) => (
            <article key={delegation.id} style={cardStyle}>
              <p style={metaStyle}>
                {delegation.priority} · {delegation.status}
              </p>

              <h3>
                {delegation.fromAgentName} → {delegation.toAgentName}
              </h3>

              <p style={{ lineHeight: 1.7 }}>{delegation.task}</p>

              {delegation.context ? (
                <p style={{ color: "var(--muted)" }}>
                  <strong>Context:</strong> {delegation.context}
                </p>
              ) : null}

              {delegation.responseSummary ? (
                <div style={summaryBox}>
                  <strong>Response</strong>
                  <p>{delegation.responseSummary}</p>
                </div>
              ) : null}

              {delegation.responsePayload?.recommendedActions?.length ? (
                <ul style={{ lineHeight: 1.8 }}>
                  {delegation.responsePayload.recommendedActions.map((item: any, index: number) => (
                    <li key={index}>
                      <strong>{item.priority}:</strong> {item.action} — {item.reason}
                    </li>
                  ))}
                </ul>
              ) : null}

              {delegation.status === "pending" ? (
                <button disabled={loading} onClick={() => runDelegation(delegation.id)} style={buttonStyle}>
                  Run Delegation
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 34 }}>
        <h2>Boardroom Sessions</h2>

        <div style={{ display: "grid", gap: 16 }}>
          {sessions.map((session) => (
            <article key={session.id} style={cardStyle}>
              <p style={metaStyle}>{session.status}</p>

              <h3>{session.title}</h3>
              <p>{session.objective}</p>

              {session.summary ? (
                <div style={summaryBox}>
                  <strong>Summary</strong>
                  <p>{session.summary}</p>
                </div>
              ) : null}

              {session.result?.unifiedDecision ? (
                <p>
                  <strong>Unified Decision:</strong>{" "}
                  {session.result.unifiedDecision}
                </p>
              ) : null}

              {session.result?.executionPlan?.length ? (
                <ul style={{ lineHeight: 1.8 }}>
                  {session.result.executionPlan.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : null}
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