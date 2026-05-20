"use client"

import { useEffect, useState } from "react"

type ScheduledOperation = {
  id: string
  name: string
  type: string
  status: string
  frequency: string
  lastRunAt: string | null
  nextRunAt: string
  createdAt: string
}

export default function SchedulerPage() {
  const [operations, setOperations] = useState<ScheduledOperation[]>([])
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: "",
    type: "publish_scheduled_articles",
    frequency: "daily",
    status: "active",
  })

  async function loadOperations() {
    const response = await fetch("/api/ai/scheduler")
    const result = await response.json()

    if (result.ok) {
      setOperations(result.operations)
    }
  }

  async function saveOperation(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)

    const response = await fetch("/api/ai/scheduler", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to save scheduled operation")
      return
    }

    setForm({
      name: "",
      type: "publish_scheduled_articles",
      frequency: "daily",
      status: "active",
    })

    loadOperations()
  }

  async function runSchedulerNow() {
    setLoading(true)

    const response = await fetch("/api/ai/scheduler/run", {
      method: "POST",
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Scheduler runner failed")
      return
    }

    alert(`Scheduler checked. Queued jobs: ${result.queued}`)
    loadOperations()
  }

  useEffect(() => {
    loadOperations()
  }, [])

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Recursive Operations</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Autonomous Scheduler
        </h1>

        <p style={{ color: "#ddd", maxWidth: 840, lineHeight: 1.7 }}>
          Schedule recurring AI operations like publishing checks, embeddings,
          executive reviews, growth intelligence and self-improvement audits.
        </p>
      </section>

      <form onSubmit={saveOperation} style={formStyle}>
        <label>
          Operation Name
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Daily Publishing Check"
            style={inputStyle}
          />
        </label>

        <label>
          Operation Type
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            style={inputStyle}
          >
            <option value="publish_scheduled_articles">
              Publish Scheduled Articles
            </option>
            <option value="embed_published_articles">
              Embed Published Articles
            </option>
            <option value="run_executive_brain">Run Executive Brain</option>
            <option value="run_growth_intelligence">
              Run Growth Intelligence
            </option>
            <option value="run_self_improvement">Run Self-Improvement</option>
          </select>
        </label>

        <label>
          Frequency
          <select
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value })}
            style={inputStyle}
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>

        <label>
          Status
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            style={inputStyle}
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </label>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button disabled={loading} style={buttonStyle}>
            {loading ? "Saving..." : "Save Scheduled Operation"}
          </button>

          <button
            disabled={loading}
            type="button"
            onClick={runSchedulerNow}
            style={secondaryButton}
          >
            Run Scheduler Now
          </button>
        </div>
      </form>

      <section style={{ marginTop: 40 }}>
        <h2>Scheduled Operations</h2>

        <div style={{ display: "grid", gap: 16 }}>
          {operations.map((operation) => (
            <div key={operation.id} style={cardStyle}>
              <p style={metaStyle}>
                {operation.status} · {operation.frequency}
              </p>

              <h3>{operation.name}</h3>

              <p>
                <strong>Type:</strong> {operation.type}
              </p>

              <p>
                <strong>Last Run:</strong>{" "}
                {operation.lastRunAt
                  ? new Date(operation.lastRunAt).toLocaleString("en-AU")
                  : "Never"}
              </p>

              <p>
                <strong>Next Run:</strong>{" "}
                {new Date(operation.nextRunAt).toLocaleString("en-AU")}
              </p>
            </div>
          ))}
        </div>
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

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "#777",
  fontSize: 13,
  margin: 0,
}