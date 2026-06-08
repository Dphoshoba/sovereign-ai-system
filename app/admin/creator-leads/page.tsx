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
  const [selectedLead, setSelectedLead] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [leadIntelligence, setLeadIntelligence] = useState<any[]>([])
  const [generatedEmail, setGeneratedEmail] = useState<any | null>(null)
  const [emailLoading, setEmailLoading] = useState(false)
  const [generatedProposal, setGeneratedProposal] = useState<any | null>(null)
  const [proposalLoading, setProposalLoading] = useState(false)

  async function loadLeads() {
    const response = await fetch("/api/creator-leads")
    const result = await response.json()

    if (result.ok) {
      setLeads(result.leads)
    }
  }

  async function loadLeadIntelligence() {
    const response = await fetch("/api/creator-leads/intelligence")
    const result = await response.json()

    if (result.ok) {
      setLeadIntelligence(result.intelligence)
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
    await loadLeadIntelligence()
    setSelectedLead(result.lead)
  }

  async function generateNurtureEmail() {
    if (!selectedLead) return

    setEmailLoading(true)

    const response = await fetch("/api/creator-leads/generate-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ leadId: selectedLead.id }),
    })

    const result = await response.json()

    setEmailLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to generate nurture email")
      return
    }

    setGeneratedEmail(result.email)
  }

  async function generateProposal() {
    if (!selectedLead) return

    setProposalLoading(true)

    const response = await fetch("/api/creator-leads/generate-proposal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ leadId: selectedLead.id }),
    })

    const result = await response.json()

    setProposalLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to generate proposal")
      return
    }

    setGeneratedProposal(result.proposal)
  }

  useEffect(() => {
    loadLeads()
    loadLeadIntelligence()
  }, [])

  useEffect(() => {
    setGeneratedEmail(null)
    setGeneratedProposal(null)
  }, [selectedLead?.id])

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

  const selectedLeadIntelligence = leadIntelligence.find(
    (item) => String(item.id) === String(selectedLead?.id)
  )

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
        <div style={metricCard}>
          <p style={metaStyle}>Total Leads</p>
          <div
            style={{
              fontSize: "48px",
              fontWeight: 800,
              color: "#ffffff",
              marginTop: "12px",
            }}
          >
            {leads.length}
          </div>
        </div>

        <div style={metricCard}>
          <p style={metaStyle}>Hot Leads</p>
          <div
            style={{
              fontSize: "48px",
              fontWeight: 800,
              color: "#22c55e",
              marginTop: "12px",
            }}
          >
            {hotLeads}
          </div>
        </div>

        <div style={metricCard}>
          <p style={metaStyle}>Projected Value</p>
          <div
            style={{
              fontSize: "48px",
              fontWeight: 800,
              color: "#60a5fa",
              marginTop: "12px",
            }}
          >
            AUD {totalProjected.toLocaleString("en-AU")}
          </div>
        </div>
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

        <button
          type="button"
          onClick={() => {
            loadLeads()
            loadLeadIntelligence()
          }}
          style={buttonStyle}
        >
          Refresh
        </button>
      </section>

      <section style={gridTwo}>
        <section>
          <h2>Leads</h2>

          <div style={{ display: "grid", gap: 14 }}>
            {filteredLeads.map((lead) => {
              const isSelected = selectedLead?.id === lead.id

              return (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => setSelectedLead(lead)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") setSelectedLead(lead)
                  }}
                  style={{
                    ...leadCard,
                    cursor: "pointer",
                    border: isSelected
                      ? "2px solid #4f46e5"
                      : "1px solid #ddd",
                    background: isSelected ? "#eef2ff" : "#fff",
                  }}
                >
                  <p style={metaStyle}>
                    {lead.status} · Score {lead.leadScore}
                  </p>

                  <p style={leadNameStyle}>{lead.name}</p>
                  <p>{lead.email}</p>

                  <p style={{ color: "#555" }}>
                    {lead.creatorType || "No creator type"} ·{" "}
                    {lead.readiness || "unknown"}
                  </p>

                  <p style={{ color: "#777" }}>
                    {new Date(lead.createdAt).toLocaleString("en-AU")}
                  </p>
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <h2>Lead Intelligence</h2>

          {selectedLead ? (
            <div key={selectedLead.id} style={editorCard}>
              <h3 style={{ marginTop: 0 }}>{selectedLead.name}</h3>
              <p style={{ margin: "8px 0", color: "#333" }}>{selectedLead.email}</p>

              <div style={leadSummaryStyle}>
                <LeadDetailRow label="Status" value={selectedLead.status} />
                <LeadDetailRow
                  label="Lead Score"
                  value={selectedLead.leadScore}
                />
                <LeadDetailRow label="Readiness" value={selectedLead.readiness} />
                <LeadDetailRow
                  label="Creator Type"
                  value={selectedLead.creatorType || "Not set"}
                />
                <LeadDetailRow
                  label="Niche"
                  value={selectedLead.niche || "Not set"}
                />
                <LeadDetailRow
                  label="Notes"
                  value={selectedLead.notes || "No notes yet"}
                />
              </div>

              {selectedLeadIntelligence && (
                <div style={intelligencePanelStyle}>
                  <IntelligenceRow
                    label="Priority"
                    value={selectedLeadIntelligence.priority}
                    valueStyle={{
                      color:
                        selectedLeadIntelligence.priority === "Hot"
                          ? "#22c55e"
                          : "#ffffff",
                      fontWeight: 800,
                      fontSize: "20px",
                    }}
                  />
                  <IntelligenceRow
                    label="Score"
                    value={selectedLeadIntelligence.score}
                    valueStyle={{
                      color: "#ffffff",
                      fontWeight: 800,
                      fontSize: "20px",
                    }}
                  />
                  <IntelligenceRow
                    label="Estimated Value"
                    value={`AUD ${selectedLeadIntelligence.estimatedValue.toLocaleString("en-AU")}`}
                    valueStyle={{
                      color: "#22c55e",
                      fontWeight: 800,
                      fontSize: "20px",
                    }}
                  />
                  <IntelligenceRow
                    label="Recommendation"
                    value={selectedLeadIntelligence.recommendation}
                    valueStyle={{
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "16px",
                    }}
                  />
                  <IntelligenceRow
                    label="Readiness"
                    value={selectedLeadIntelligence.readiness || "unknown"}
                    valueStyle={{
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "16px",
                    }}
                  />
                  <IntelligenceRow
                    label="Creator Type"
                    value={selectedLeadIntelligence.creatorType || "Not set"}
                    valueStyle={{
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "16px",
                    }}
                  />
                </div>
              )}

              <button
                type="button"
                disabled={emailLoading}
                onClick={generateNurtureEmail}
                style={{ ...buttonStyle, marginBottom: 16 }}
              >
                {emailLoading ? "Generating..." : "Generate Nurture Email"}
              </button>

              {generatedEmail && (
                <div style={generatedEmailStyle}>
                  <label>
                    Subject
                    <input
                      value={generatedEmail.subject || ""}
                      onChange={(e) =>
                        setGeneratedEmail({
                          ...generatedEmail,
                          subject: e.target.value,
                        })
                      }
                      style={inputStyle}
                    />
                  </label>

                  <label>
                    Body
                    <textarea
                      rows={12}
                      value={generatedEmail.body || ""}
                      onChange={(e) =>
                        setGeneratedEmail({
                          ...generatedEmail,
                          body: e.target.value,
                        })
                      }
                      style={inputStyle}
                    />
                  </label>
                </div>
              )}

              <button
                type="button"
                disabled={proposalLoading}
                onClick={generateProposal}
                style={{ ...buttonStyle, marginBottom: 16 }}
              >
                {proposalLoading ? "Generating Proposal..." : "Generate Proposal"}
              </button>

              {generatedProposal && (
                <div style={generatedProposalStyle}>
                  <ProposalField
                    label="Proposal Title"
                    value={generatedProposal.proposalTitle}
                  />
                  <ProposalField
                    label="Summary"
                    value={generatedProposal.summary}
                  />
                  <ProposalField
                    label="Recommended Offer"
                    value={generatedProposal.recommendedOffer}
                  />
                  <ProposalList label="Scope" items={generatedProposal.scope} />
                  <ProposalList
                    label="Deliverables"
                    items={generatedProposal.deliverables}
                  />
                  <ProposalField
                    label="Timeline"
                    value={generatedProposal.timeline}
                  />
                  <ProposalField
                    label="Investment AUD"
                    value={
                      typeof generatedProposal.investmentAud === "number"
                        ? `AUD ${generatedProposal.investmentAud.toLocaleString("en-AU")}`
                        : generatedProposal.investmentAud
                    }
                  />
                  <ProposalField
                    label="Next Step"
                    value={generatedProposal.nextStep}
                  />
                  <ProposalList label="Risks" items={generatedProposal.risks} />
                  <ProposalList
                    label="Success Outcomes"
                    items={generatedProposal.successOutcomes}
                  />
                </div>
              )}

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

              <button
                type="button"
                disabled={loading}
                onClick={updateLead}
                style={buttonStyle}
              >
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

function LeadDetailRow({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <p style={intelligenceLabelStyle}>{label}</p>
      <p style={{ margin: 0, color: "#111", fontWeight: 600 }}>{value}</p>
    </div>
  )
}

function IntelligenceRow({
  label,
  value,
  valueStyle,
}: {
  label: string
  value: string | number
  valueStyle: React.CSSProperties
}) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <p style={intelligenceLabelStyle}>{label}</p>
      <p style={{ margin: 0, ...valueStyle }}>{value}</p>
    </div>
  )
}

function ProposalField({
  label,
  value,
}: {
  label: string
  value?: string | number | null
}) {
  if (!value) return null

  return (
    <div style={{ marginBottom: "14px" }}>
      <p style={intelligenceLabelStyle}>{label}</p>
      <p style={{ margin: 0, color: "#111", fontWeight: 600, lineHeight: 1.6 }}>
        {value}
      </p>
    </div>
  )
}

function ProposalList({
  label,
  items,
}: {
  label: string
  items?: string[] | null
}) {
  if (!items?.length) return null

  return (
    <div style={{ marginBottom: "14px" }}>
      <p style={intelligenceLabelStyle}>{label}</p>
      <ul style={{ margin: "6px 0 0", paddingLeft: 20, color: "#111" }}>
        {items.map((item, index) => (
          <li key={`${label}-${index}`} style={{ marginBottom: 6, lineHeight: 1.5 }}>
            {item}
          </li>
        ))}
      </ul>
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
  background: "#111",
  border: "1px solid #333",
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
  display: "block",
  width: "100%",
  textAlign: "left",
  borderRadius: 18,
  padding: 22,
  cursor: "pointer",
  userSelect: "none",
  font: "inherit",
  color: "inherit",
}

const leadNameStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  margin: "8px 0",
}

const leadSummaryStyle: React.CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  marginBottom: 20,
}

const generatedEmailStyle: React.CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  marginBottom: 20,
}

const generatedProposalStyle: React.CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  marginBottom: 20,
}

const editorCard: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 24,
}

const intelligencePanelStyle: React.CSSProperties = {
  background: "#111",
  borderRadius: 14,
  padding: "20px",
  marginBottom: "20px",
}

const intelligenceLabelStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "#888",
  fontSize: 12,
  margin: "0 0 4px 0",
}

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "#aaa",
  fontSize: 13,
  margin: 0,
}