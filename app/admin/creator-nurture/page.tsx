"use client"

import { useEffect, useMemo, useState } from "react"

type CreatorLead = {
  id: string
  name: string
  email: string
  creatorType: string | null
  status: string
  leadScore: number
  readiness: string
  niche: string | null
}

type NurtureEvent = {
  id: string
  leadId: string
  type: string
  subject: string | null
  body: string | null
  status: string
  createdAt: string
}

type LeadInsight = {
  id: string
  leadId: string
  title: string
  insight: string
  priority: string
  recommendedAction: string | null
}

export default function CreatorNurturePage() {
  const [leads, setLeads] = useState<CreatorLead[]>([])
  const [events, setEvents] = useState<NurtureEvent[]>([])
  const [insights, setInsights] = useState<LeadInsight[]>([])
  const [selectedLeadId, setSelectedLeadId] = useState("")
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const [leadResponse, nurtureResponse] = await Promise.all([
      fetch("/api/creator-leads"),
      fetch("/api/creator-leads/nurture"),
    ])

    const leadResult = await leadResponse.json()
    const nurtureResult = await nurtureResponse.json()

    if (leadResult.ok) {
      setLeads(leadResult.leads)
      if (!selectedLeadId && leadResult.leads.length > 0) {
        setSelectedLeadId(leadResult.leads[0].id)
      }
    }

    if (nurtureResult.ok) {
      setEvents(nurtureResult.events)
      setInsights(nurtureResult.insights)
    }
  }

  async function generateNurture() {
    if (!selectedLeadId) return

    setLoading(true)

    const response = await fetch("/api/creator-leads/nurture", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ leadId: selectedLeadId }),
    })

    const result = await response.json()

    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to generate nurturing")
      return
    }

    await loadData()
  }

  async function markEvent(id: string, status: string) {
    setLoading(true)

    const response = await fetch("/api/creator-leads/nurture/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, status }),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to update event")
      return
    }

    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId)

  const leadEvents = useMemo(
    () => events.filter((event) => event.leadId === selectedLeadId),
    [events, selectedLeadId]
  )

  const leadInsights = useMemo(
    () => insights.filter((insight) => insight.leadId === selectedLeadId),
    [insights, selectedLeadId]
  )

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>AI Lead Nurturing</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Creator Nurturing + Follow-Up Engine
        </h1>

        <p style={{ color: "var(--hero-muted)", maxWidth: 860, lineHeight: 1.7 }}>
          Generate creator-specific follow-up emails, lead intelligence,
          readiness scoring and recommended next actions.
        </p>
      </section>

      <section style={toolbarStyle}>
        <select
          value={selectedLeadId}
          onChange={(e) => setSelectedLeadId(e.target.value)}
          style={inputStyle}
        >
          {leads.map((lead) => (
            <option key={lead.id} value={lead.id}>
              {lead.name} · {lead.email}
            </option>
          ))}
        </select>

        <button disabled={loading || !selectedLeadId} onClick={generateNurture} style={buttonStyle}>
          {loading ? "Generating..." : "Generate Nurture Sequence"}
        </button>

        <button disabled={loading} onClick={loadData} style={secondaryButton}>
          Refresh
        </button>
      </section>

      {selectedLead ? (
        <section style={summaryCard}>
          <p style={metaStyle}>
            {selectedLead.creatorType || "Creator"} · Score {selectedLead.leadScore}
          </p>

          <h2>{selectedLead.name}</h2>

          <p>{selectedLead.email}</p>
          <p>
            <strong>Status:</strong> {selectedLead.status} ·{" "}
            <strong>Readiness:</strong> {selectedLead.readiness}
          </p>
        </section>
      ) : null}

      <section style={gridTwo}>
        <section>
          <h2>AI Lead Insights</h2>

          <div style={{ display: "grid", gap: 14 }}>
            {leadInsights.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>No insights yet.</p>
            ) : (
              leadInsights.map((insight) => (
                <article key={insight.id} style={cardStyle}>
                  <p style={metaStyle}>{insight.priority}</p>
                  <h3>{insight.title}</h3>
                  <p style={{ lineHeight: 1.7 }}>{insight.insight}</p>
                  {insight.recommendedAction ? (
                    <p>
                      <strong>Recommended Action:</strong>{" "}
                      {insight.recommendedAction}
                    </p>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </section>

        <section>
          <h2>Nurture Emails</h2>

          <div style={{ display: "grid", gap: 14 }}>
            {leadEvents.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>No nurture emails generated yet.</p>
            ) : (
              leadEvents.map((event) => (
                <article key={event.id} style={cardStyle}>
                  <p style={metaStyle}>
                    {event.type} · {event.status}
                  </p>

                  <h3>{event.subject}</h3>

                  <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                    {event.body}
                  </p>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      disabled={loading}
                      onClick={() => markEvent(event.id, "approved")}
                      style={buttonStyle}
                    >
                      Approve
                    </button>

                    <button
                      disabled={loading}
                      onClick={() => markEvent(event.id, "sent")}
                      style={secondaryButton}
                    >
                      Mark Sent
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
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

const toolbarStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr auto auto",
  gap: 12,
  marginTop: 28,
}

const inputStyle: React.CSSProperties = {
  width: "100%",
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

const secondaryButton: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "1px solid #111",
  background: "var(--card-background)",
  color: "var(--foreground)",
  cursor: "pointer",
  fontWeight: "bold",
}

const summaryCard: React.CSSProperties = {
  marginTop: 28,
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const gridTwo: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
  gap: 24,
  marginTop: 34,
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