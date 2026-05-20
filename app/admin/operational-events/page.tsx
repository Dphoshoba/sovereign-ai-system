"use client"

import { useEffect, useMemo, useState } from "react"

type OperationalEvent = {
  id: string
  type: string
  source: string
  title: string
  message: string | null
  severity: string
  status: string
  entityType: string | null
  entityId: string | null
  payload: any
  createdAt: string
}

export default function OperationalEventsPage() {
  const [events, setEvents] = useState<OperationalEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [autoRefresh, setAutoRefresh] = useState(true)

  async function loadEvents() {
    const response = await fetch("/api/operational-events")
    const result = await response.json()

    if (result.ok) {
      setEvents(result.events)
    }
  }

  async function scanEvents() {
    setLoading(true)

    const response = await fetch("/api/operational-events/scan", {
      method: "POST",
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Operational scan failed")
      return
    }

    await loadEvents()
  }

  async function reactToEvent(eventId: string) {
    setLoading(true)

    const response = await fetch("/api/operational-events/react", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventId }),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Event reaction failed")
      return
    }

    await loadEvents()
  }

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return

    const timer = setInterval(() => {
      loadEvents()
    }, 5000)

    return () => clearInterval(timer)
  }, [autoRefresh])

  const filteredEvents = useMemo(() => {
    if (statusFilter === "all") return events
    return events.filter((event) => event.status === statusFilter)
  }, [events, statusFilter])

  const critical = events.filter((event) => event.severity === "critical").length
  const high = events.filter((event) => event.severity === "high").length
  const newEvents = events.filter((event) => event.status === "new").length
  const processed = events.filter((event) => event.status === "processed").length

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Live AI Nervous System</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Real-Time Operational Event Bus
        </h1>

        <p style={{ color: "#ddd", maxWidth: 880, lineHeight: 1.7 }}>
          Watch live operational signals from CRM, audits, revenue,
          automations, mission cycles and agent systems.
        </p>
      </section>

      <section style={metricsGrid}>
        <Metric label="New Events" value={newEvents.toString()} />
        <Metric label="Processed" value={processed.toString()} />
        <Metric label="High Severity" value={high.toString()} />
        <Metric label="Critical" value={critical.toString()} />
      </section>

      <section style={toolbarStyle}>
        <button disabled={loading} onClick={scanEvents} style={buttonStyle}>
          {loading ? "Scanning..." : "Scan Operational Signals"}
        </button>

        <button disabled={loading} onClick={loadEvents} style={secondaryButton}>
          Refresh
        </button>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={inputStyle}
        >
          <option value="all">All</option>
          <option value="new">New</option>
          <option value="processed">Processed</option>
        </select>

        <label style={checkboxStyle}>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh
        </label>
      </section>

      <section style={{ marginTop: 34 }}>
        <h2>Operational Stream</h2>

        <div style={{ display: "grid", gap: 16 }}>
          {filteredEvents.map((event) => (
            <article key={event.id} style={cardStyle}>
              <p style={metaStyle}>
                {event.severity} · {event.status} · {event.source}
              </p>

              <h3>{event.title}</h3>

              {event.message ? (
                <p style={{ lineHeight: 1.7, color: "#555" }}>
                  {event.message}
                </p>
              ) : null}

              <p>
                <strong>Type:</strong> {event.type}
              </p>

              {event.entityType ? (
                <p>
                  <strong>Entity:</strong> {event.entityType} · {event.entityId}
                </p>
              ) : null}

              {event.payload?.reaction ? (
                <div style={summaryBox}>
                  <strong>AI Reaction</strong>
                  <p>{event.payload.reaction.summary}</p>

                  {event.payload.reaction.recommendedActions?.length ? (
                    <ul style={{ lineHeight: 1.8 }}>
                      {event.payload.reaction.recommendedActions.map(
                        (item: string, index: number) => (
                          <li key={index}>{item}</li>
                        )
                      )}
                    </ul>
                  ) : null}
                </div>
              ) : null}

              <p style={{ color: "#777" }}>
                {new Date(event.createdAt).toLocaleString("en-AU")}
              </p>

              {event.status === "new" ? (
                <button
                  disabled={loading}
                  onClick={() => reactToEvent(event.id)}
                  style={buttonStyle}
                >
                  Trigger AI Reaction
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
  alignItems: "center",
  marginTop: 28,
}

const inputStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 10,
  border: "1px solid #ccc",
  fontSize: 15,
}

const checkboxStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontWeight: "bold",
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