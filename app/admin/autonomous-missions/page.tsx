"use client"

import { useEffect, useState } from "react"

type MissionCycle = {
  id: string
  title: string
  objective: string
  cycleType: string
  status: string
  summary: string | null
  createdAt: string
}

type MissionTask = {
  id: string
  cycleId: string
  agentName: string
  task: string
  priority: string
  status: string
  resultSummary: string | null
  resultPayload: any
  createdAt: string
}

export default function AutonomousMissionsPage() {
  const [cycles, setCycles] = useState<MissionCycle[]>([])
  const [tasks, setTasks] = useState<MissionTask[]>([])
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const response = await fetch("/api/autonomous-missions")
    const result = await response.json()

    if (result.ok) {
      setCycles(result.cycles)
      setTasks(result.tasks)
    }
  }

  async function runCycle() {
    setLoading(true)

    const response = await fetch("/api/autonomous-missions", {
      method: "POST",
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to create mission cycle")
      return
    }

    await loadData()
  }

  async function executeTask(taskId: string) {
    setLoading(true)

    const response = await fetch("/api/autonomous-missions/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ taskId }),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to execute mission task")
      return
    }

    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  const pendingTasks = tasks.filter((task) => task.status === "pending").length
  const completedTasks = tasks.filter((task) => task.status === "completed").length

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Persistent Operations</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Autonomous Mission Cycles
        </h1>

        <p style={{ color: "#ddd", maxWidth: 880, lineHeight: 1.7 }}>
          Run recursive operational cycles across the executive AI organization
          and coordinate persistent autonomous missions.
        </p>
      </section>

      <section style={metricsGrid}>
        <Metric label="Mission Cycles" value={cycles.length.toString()} />
        <Metric label="Pending Tasks" value={pendingTasks.toString()} />
        <Metric label="Completed Tasks" value={completedTasks.toString()} />
      </section>

      <section style={toolbarStyle}>
        <button disabled={loading} onClick={runCycle} style={buttonStyle}>
          {loading ? "Running..." : "Start Autonomous Cycle"}
        </button>

        <button disabled={loading} onClick={loadData} style={secondaryButton}>
          Refresh
        </button>
      </section>

      <section style={{ marginTop: 34 }}>
        <h2>Mission Cycles</h2>

        <div style={{ display: "grid", gap: 16 }}>
          {cycles.map((cycle) => (
            <article key={cycle.id} style={cardStyle}>
              <p style={metaStyle}>
                {cycle.cycleType} · {cycle.status}
              </p>

              <h3>{cycle.title}</h3>

              <p>{cycle.objective}</p>

              {cycle.summary ? (
                <div style={summaryBox}>
                  <strong>Summary</strong>
                  <p>{cycle.summary}</p>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 34 }}>
        <h2>Mission Tasks</h2>

        <div style={{ display: "grid", gap: 16 }}>
          {tasks.map((task) => (
            <article key={task.id} style={cardStyle}>
              <p style={metaStyle}>
                {task.priority} · {task.status}
              </p>

              <h3>{task.agentName}</h3>

              <p style={{ lineHeight: 1.7 }}>{task.task}</p>

              {task.resultSummary ? (
                <div style={summaryBox}>
                  <strong>Result</strong>
                  <p>{task.resultSummary}</p>
                </div>
              ) : null}

              {task.resultPayload?.recommendedActions?.length ? (
                <ul style={{ lineHeight: 1.8 }}>
                  {task.resultPayload.recommendedActions.map(
                    (item: string, index: number) => (
                      <li key={index}>{item}</li>
                    )
                  )}
                </ul>
              ) : null}

              {task.status === "pending" ? (
                <button
                  disabled={loading}
                  onClick={() => executeTask(task.id)}
                  style={buttonStyle}
                >
                  Execute Mission
                </button>
              ) : null}
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

const metricsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
  marginTop: 28,
}

const metricCard: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 24,
}

const toolbarStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 28,
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

const secondaryButton: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "1px solid #111",
  background: "#fff",
  color: "#111",
  cursor: "pointer",
  fontWeight: "bold",
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 24,
}

const summaryBox: React.CSSProperties = {
  background: "#f5f5f5",
  borderRadius: 12,
  padding: 16,
  marginTop: 12,
  marginBottom: 12,
}

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "#777",
  fontSize: 13,
  margin: 0,
}