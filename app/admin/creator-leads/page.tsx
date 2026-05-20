"use client"

import { useEffect, useMemo, useState } from "react"

type CreatorLead = {
  id: string
  name: string
  email: string
  creatorType: string | null
  source: string
  status: string
  leadScore: number
  readiness: string
  niche: string | null
  bottlenecks: string | null
  notes: string | null
  projectedValue: number | null
  createdAt: string
}

const statuses = [
  "new",
  "contacted",
  "audit-booked",
  "strategy-call-complete",
  "proposal-sent",
  "client-active",
  "not-fit",
]

const readinessLevels = [
  "unknown",
  "starter-pack",
  "curious",
  "warm",
  "ready",
  "urgent",
]

export default function CreatorLeadsDashboard() {
  const [leads, setLeads] = useState<CreatorLead[]>([])
  const [selectedLead, setSelectedLead] = useState<CreatorLead | null>(null)
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")

  async function loadLeads() {
    const response = await fetch("/api/creator-leads")
    const result = await response.json()

    if (result.ok) {
      setLeads(result.leads)
    }
  }

  async function updateLead() {
    if (!selectedLead) return

    setLoading(true)

    const response = await fetch("/api/creator-leads/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(selectedLead),
    })

    const result = await response.json()

    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to update lead")
      return
    }

    await loadLeads()
    setSelectedLead(result.lead)
  }

  useEffect(() => {
    loadLeads()
  }, [])

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesStatus =
        statusFilter === "all" || lead.status === statusFilter

      const text = `${lead.name} ${lead.email} ${lead.creatorType || ""} ${
        lead.niche || ""
      }`.toLowerCase()

      return matchesStatus && text.includes(search.toLowerCase())
    })
  }, [leads, statusFilter, search])

  const totalProjected = leads.reduce(
    (sum, lead) => sum + (lead.projectedValue || 0),
    0
  )

  const hotLeads = leads.filter(
    (lead) => lead.leadScore >= 75 || ["ready", "urgent"].includes(lead.readiness)
  ).length

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Creator Intelligence CRM</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Creator Leads Dashboard
        </h1>

        <p style={{ color: "#ddd", maxWidth: 850, lineHeight: 1.7 }}>
          Track Starter Pack leads, score creator readiness, manage audit
          pipeline stages and prepare consultation opportunities for Echoes &
          Visions.
        </p>
      </section>

      <section style={metricsGrid}>
        <Metric label="Total Leads" value={leads.length.toString()} />
        <Metric label="Hot Leads" value={hotLeads.toString()} />
        <Metric
          label="Projected Value"
          value={`AUD ${totalProjected.toLocaleString("en-AU")}`}
        />
      </section>

      <section style={toolbarStyle}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, type or niche"
          style={inputStyle}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={inputStyle}
        >
          <option value="all">All Statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <button onClick={loadLeads} style={buttonStyle}>
          Refresh
        </button>
      </section>

      <section style={gridTwo}>
        <section>
          <h2>Leads</h2>

          <div style={{ display: "grid", gap: 14 }}>
            {filteredLeads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                style={{
                  ...leadCard,
                  border:
                    selectedLead?.id === lead.id
                      ? "2px solid #4f46e5"
                      : "1px solid #ddd",
                }}
              >
                <p style={metaStyle}>
                  {lead.status} · Score {lead.leadScore}
                </p>

                <h3>{lead.name}</h3>
                <p>{lead.email}</p>

                <p style={{ color: "#555" }}>
                  {lead.creatorType || "No creator type"} ·{" "}
                  {lead.readiness || "unknown"}
                </p>

                <p style={{ color: "#777" }}>
                  {new Date(lead.createdAt).toLocaleString("en-AU")}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2>Lead Intelligence</h2>

          {selectedLead ? (
            <div style={editorCard}>
              <p style={metaStyle}>{selectedLead.email}</p>

              <h3>{selectedLead.name}</h3>

              <label>
                Status
                <select
                  value={selectedLead.status}
                  onChange={(e) =>
                    setSelectedLead({
                      ...selectedLead,
                      status: e.target.value,
                    })
                  }
                  style={inputStyle}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Readiness
                <select
                  value={selectedLead.readiness}
                  onChange={(e) =>
                    setSelectedLead({
                      ...selectedLead,
                      readiness: e.target.value,
                    })
                  }
                  style={inputStyle}
                >
                  {readinessLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Lead Score
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={selectedLead.leadScore}
                  onChange={(e) =>
                    setSelectedLead({
                      ...selectedLead,
                      leadScore: Number(e.target.value),
                    })
                  }
                  style={inputStyle}
                />
              </label>

              <label>
                Niche
                <input
                  value={selectedLead.niche || ""}
                  onChange={(e) =>
                    setSelectedLead({
                      ...selectedLead,
                      niche: e.target.value,
                    })
                  }
                  style={inputStyle}
                />
              </label>

              <label>
                Bottlenecks
                <textarea
                  rows={4}
                  value={selectedLead.bottlenecks || ""}
                  onChange={(e) =>
                    setSelectedLead({
                      ...selectedLead,
                      bottlenecks: e.target.value,
                    })
                  }
                  style={inputStyle}
                />
              </label>

              <label>
                Notes
                <textarea
                  rows={5}
                  value={selectedLead.notes || ""}
                  onChange={(e) =>
                    setSelectedLead({
                      ...selectedLead,
                      notes: e.target.value,
                    })
                  }
                  style={inputStyle}
                />
              </label>

              <label>
                Projected Value
                <input
                  type="number"
                  value={selectedLead.projectedValue || ""}
                  onChange={(e) =>
                    setSelectedLead({
                      ...selectedLead,
                      projectedValue:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  style={inputStyle}
                />
              </label>

              <button disabled={loading} onClick={updateLead} style={buttonStyle}>
                {loading ? "Saving..." : "Save Lead Intelligence"}
              </button>
            </div>
          ) : (
            <div style={editorCard}>
              <p>Select a lead to view and update intelligence.</p>
            </div>
          )}
        </section>
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
  display: "grid",
  gridTemplateColumns: "2fr 1fr auto",
  gap: 12,
  marginTop: 28,
}

const gridTwo: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
  gap: 24,
  marginTop: 34,
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 6,
  marginBottom: 14,
  padding: 12,
  borderRadius: 10,
  border: "1px solid #ccc",
  fontSize: 15,
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

const leadCard: React.CSSProperties = {
  textAlign: "left",
  background: "#fff",
  borderRadius: 18,
  padding: 22,
  cursor: "pointer",
}

const editorCard: React.CSSProperties = {
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