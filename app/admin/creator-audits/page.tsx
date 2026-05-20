"use client"

import { useEffect, useState } from "react"

type Audit = {
  id: string
  name: string
  email: string
  creatorType: string | null
  niche: string | null
  audienceSize: string | null
  publishingFrequency: string | null
  monetizationMethod: string | null
  currentTools: string | null
  biggestBottleneck: string | null
  automationGoals: string | null
  status: string
  opportunityScore: number
  auditSummary: string | null
  recommendedSystems: string | null
  nextActions: string | null
  proposalDraft: string | null
  createdAt: string
}

const statuses = [
  "audit-requested",
  "discovery-complete",
  "strategy-ready",
  "proposal-generated",
  "client-onboarding",
  "closed",
]

export default function CreatorAuditsAdminPage() {
  const [audits, setAudits] = useState<Audit[]>([])
  const [selected, setSelected] = useState<Audit | null>(null)
  const [loading, setLoading] = useState(false)

  async function loadAudits() {
    const response = await fetch("/api/creator-audit")
    const result = await response.json()

    if (result.ok) {
      setAudits(result.audits)
    }
  }

  async function saveAudit() {
    if (!selected) return

    setLoading(true)

    const response = await fetch("/api/creator-audit/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(selected),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to update audit")
      return
    }

    await loadAudits()
    setSelected(result.audit)
  }

  useEffect(() => {
    loadAudits()
  }, [])

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Creator Audit System</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          AI Consultation Booking + Audit Dashboard
        </h1>
        <p style={{ color: "#ddd", maxWidth: 850, lineHeight: 1.7 }}>
          Review creator audit requests, inspect AI diagnostics, manage
          consultation stages and prepare proposal drafts.
        </p>
      </section>

      <section style={gridTwo}>
        <section>
          <h2>Audit Requests</h2>

          <div style={{ display: "grid", gap: 14 }}>
            {audits.map((audit) => (
              <button
                key={audit.id}
                onClick={() => setSelected(audit)}
                style={{
                  ...cardButton,
                  border:
                    selected?.id === audit.id
                      ? "2px solid #4f46e5"
                      : "1px solid #ddd",
                }}
              >
                <p style={metaStyle}>
                  {audit.status} · Score {audit.opportunityScore}
                </p>
                <h3>{audit.name}</h3>
                <p>{audit.email}</p>
                <p style={{ color: "#555" }}>
                  {audit.creatorType || "Creator"} · {audit.niche || "No niche"}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2>Audit Intelligence</h2>

          {selected ? (
            <div style={editorCard}>
              <p style={metaStyle}>{selected.email}</p>
              <h3>{selected.name}</h3>

              <label>
                Status
                <select
                  value={selected.status}
                  onChange={(e) =>
                    setSelected({ ...selected, status: e.target.value })
                  }
                  style={inputStyle}
                >
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>

              <label>
                Opportunity Score
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={selected.opportunityScore}
                  onChange={(e) =>
                    setSelected({
                      ...selected,
                      opportunityScore: Number(e.target.value),
                    })
                  }
                  style={inputStyle}
                />
              </label>

              <Info label="Creator Type" value={selected.creatorType} />
              <Info label="Niche" value={selected.niche} />
              <Info label="Audience Size" value={selected.audienceSize} />
              <Info label="Publishing Frequency" value={selected.publishingFrequency} />
              <Info label="Monetization" value={selected.monetizationMethod} />
              <Info label="Current Tools" value={selected.currentTools} />
              <Info label="Biggest Bottleneck" value={selected.biggestBottleneck} />
              <Info label="Automation Goals" value={selected.automationGoals} />

              <TextEdit label="Audit Summary" value={selected.auditSummary || ""} onChange={(value) => setSelected({ ...selected, auditSummary: value })} />
              <TextEdit label="Recommended Systems" value={selected.recommendedSystems || ""} onChange={(value) => setSelected({ ...selected, recommendedSystems: value })} />
              <TextEdit label="Next Actions" value={selected.nextActions || ""} onChange={(value) => setSelected({ ...selected, nextActions: value })} />
              <TextEdit label="Proposal Draft" value={selected.proposalDraft || ""} onChange={(value) => setSelected({ ...selected, proposalDraft: value })} />

              <button disabled={loading} onClick={saveAudit} style={buttonStyle}>
                {loading ? "Saving..." : "Save Audit"}
              </button>
            </div>
          ) : (
            <div style={editorCard}>Select an audit request.</div>
          )}
        </section>
      </section>
    </main>
  )
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <p>
      <strong>{label}:</strong> {value || "Not provided"}
    </p>
  )
}

function TextEdit({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label>
      {label}
      <textarea
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </label>
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

const gridTwo: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
  gap: 24,
  marginTop: 34,
}

const cardButton: React.CSSProperties = {
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

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "#777",
  fontSize: 13,
  margin: 0,
}