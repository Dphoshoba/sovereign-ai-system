"use client"

import { useEffect, useState } from "react"

type AiActivityEvent = {
  id: string
  type: string
  title: string
  message: string | null
  status: string
  createdAt: string
}

export default function AiActivityPage() {
  const [events, setEvents] = useState<AiActivityEvent[]>([])
  const [loading, setLoading] = useState(false)

  async function loadEvents() {
    const response = await fetch("/api/ai/activity")
    const result = await response.json()

    if (result.ok) {
      setEvents(result.events)
    }
  }

  async function createTestEvent() {
    setLoading(true)

    await fetch("/api/ai/activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "test",
        title: "Manual test event",
        message: "The activity stream is receiving events correctly.",
        status: "success",
      }),
    })

    setLoading(false)
    loadEvents()
  }

  useEffect(() => {
    loadEvents()

    const interval = setInterval(() => {
      loadEvents()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>AI Activity Stream</h1>

      <p style={{ maxWidth: 760, color: "#555", lineHeight: 1.7 }}>
        Live operational activity from jobs, agents, publishing workflows,
        memory updates, background tasks and future automations.
      </p>

      <button disabled={loading} onClick={createTestEvent} style={buttonStyle}>
        {loading ? "Creating..." : "Create Test Event"}
      </button>

      <section style={{ marginTop: 34 }}>
        <h2>Recent Activity</h2>

        <div style={{ display: "grid", gap: 14 }}>
          {events.map((event) => (
            <div key={event.id} style={cardStyle}>
              <div style={rowStyle}>
                <div>
                  <p style={metaStyle}>
                    {event.type} · {event.status}
                  </p>

                  <h3 style={{ margin: "4px 0" }}>{event.title}</h3>

                  {event.message ? (
                    <p style={{ color: "#555", lineHeight: 1.6 }}>
                      {event.message}
                    </p>
                  ) : null}
                </div>

                <small style={{ color: "#777" }}>
                  {new Date(event.createdAt).toLocaleString("en-AU")}
                </small>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

const buttonStyle: React.CSSProperties = {
  marginTop: 20,
  padding: "12px 16px",
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
  padding: 22,
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  alignItems: "flex-start",
}

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "#777",
  fontSize: 13,
  margin: 0,
}