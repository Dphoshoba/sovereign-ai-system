"use client"

import { useEffect, useMemo, useState } from "react"

type Proposal = {
  id: string
  title: string
  description: string | null
  packageType: string | null
  status: string
  estimatedValue: number | null
  implementationWeeks: number | null
  proposalContent: string | null
  aiSummary: string | null
  createdAt: string
}

type Invoice = {
  id: string
  invoiceNumber: string
  amount: number
  status: string
  paymentLink: string | null
  createdAt: string
}

type RevenueEvent = {
  id: string
  type: string
  title: string
  amount: number | null
  status: string
  createdAt: string
}

type Audit = {
  id: string
  name: string
  email: string
  creatorType: string | null
  opportunityScore: number
}

export default function CreatorRevenuePage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [events, setEvents] = useState<RevenueEvent[]>([])
  const [audits, setAudits] = useState<Audit[]>([])
  const [selectedAudit, setSelectedAudit] = useState("")
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const [revenueResponse, auditResponse] = await Promise.all([
      fetch("/api/creator-revenue"),
      fetch("/api/creator-audit"),
    ])

    const revenueResult = await revenueResponse.json()
    const auditResult = await auditResponse.json()

    if (revenueResult.ok) {
      setProposals(revenueResult.proposals)
      setInvoices(revenueResult.invoices)
      setEvents(revenueResult.revenueEvents)
    }

    if (auditResult.ok) {
      setAudits(auditResult.audits)

      if (!selectedAudit && auditResult.audits.length > 0) {
        setSelectedAudit(auditResult.audits[0].id)
      }
    }
  }

  async function generateProposal() {
    if (!selectedAudit) return

    setLoading(true)

    const response = await fetch("/api/creator-revenue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auditId: selectedAudit,
      }),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to generate proposal")
      return
    }

    await loadData()
  }

  async function generateInvoice(proposalId: string) {
    setLoading(true)

    const response = await fetch("/api/creator-revenue/invoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        proposalId,
      }),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to generate invoice")
      return
    }

    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  const projectedRevenue = proposals.reduce(
    (sum, proposal) => sum + (proposal.estimatedValue || 0),
    0
  )

  const invoicedRevenue = invoices.reduce(
    (sum, invoice) => sum + invoice.amount,
    0
  )

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Revenue Operations</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Proposal-to-Payment System
        </h1>

        <p style={{ color: "#ddd", maxWidth: 860, lineHeight: 1.7 }}>
          Generate creator proposals, invoices, revenue intelligence and
          automation implementation opportunities from creator audits.
        </p>
      </section>

      <section style={metricsGrid}>
        <Metric
          label="Projected Revenue"
          value={`AUD ${projectedRevenue.toLocaleString("en-AU")}`}
        />

        <Metric
          label="Invoiced Revenue"
          value={`AUD ${invoicedRevenue.toLocaleString("en-AU")}`}
        />

        <Metric
          label="Proposals"
          value={proposals.length.toString()}
        />
      </section>

      <section style={toolbarStyle}>
        <select
          value={selectedAudit}
          onChange={(e) => setSelectedAudit(e.target.value)}
          style={inputStyle}
        >
          {audits.map((audit) => (
            <option key={audit.id} value={audit.id}>
              {audit.name} · Score {audit.opportunityScore}
            </option>
          ))}
        </select>

        <button disabled={loading} onClick={generateProposal} style={buttonStyle}>
          {loading ? "Generating..." : "Generate Proposal"}
        </button>

        <button disabled={loading} onClick={loadData} style={secondaryButton}>
          Refresh
        </button>
      </section>

      <section style={gridTwo}>
        <section>
          <h2>Proposals</h2>

          <div style={{ display: "grid", gap: 16 }}>
            {proposals.map((proposal) => (
              <article key={proposal.id} style={cardStyle}>
                <p style={metaStyle}>
                  {proposal.status} · {proposal.packageType || "Package"}
                </p>

                <h3>{proposal.title}</h3>

                {proposal.description ? (
                  <p style={{ color: "#555", lineHeight: 1.7 }}>
                    {proposal.description}
                  </p>
                ) : null}

                <p>
                  <strong>Estimated Value:</strong>{" "}
                  AUD {(proposal.estimatedValue || 0).toLocaleString("en-AU")}
                </p>

                <p>
                  <strong>Implementation:</strong>{" "}
                  {proposal.implementationWeeks || 0} weeks
                </p>

                {proposal.aiSummary ? (
                  <div style={summaryBox}>
                    <strong>AI Summary</strong>
                    <p>{proposal.aiSummary}</p>
                  </div>
                ) : null}

                <button
                  disabled={loading}
                  onClick={() => generateInvoice(proposal.id)}
                  style={buttonStyle}
                >
                  Generate Invoice
                </button>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2>Invoices</h2>

          <div style={{ display: "grid", gap: 16 }}>
            {invoices.map((invoice) => (
              <article key={invoice.id} style={cardStyle}>
                <p style={metaStyle}>
                  {invoice.status}
                </p>

                <h3>{invoice.invoiceNumber}</h3>

                <p>
                  <strong>Amount:</strong> AUD{" "}
                  {invoice.amount.toLocaleString("en-AU")}
                </p>

                <p style={{ color: "#777" }}>
                  Created:{" "}
                  {new Date(invoice.createdAt).toLocaleString("en-AU")}
                </p>

                {invoice.paymentLink ? (
                  <a
                    href={invoice.paymentLink}
                    style={{
                      color: "#4f46e5",
                      fontWeight: "bold",
                    }}
                  >
                    Payment Link
                  </a>
                ) : null}
              </article>
            ))}
          </div>

          <h2 style={{ marginTop: 30 }}>Revenue Events</h2>

          <div style={{ display: "grid", gap: 14 }}>
            {events.map((event) => (
              <article key={event.id} style={cardStyle}>
                <p style={metaStyle}>
                  {event.type} · {event.status}
                </p>

                <h3>{event.title}</h3>

                {event.amount ? (
                  <p>
                    <strong>Amount:</strong> AUD{" "}
                    {event.amount.toLocaleString("en-AU")}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
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
  gridTemplateColumns: "2fr auto auto",
  gap: 12,
  marginTop: 28,
}

const inputStyle: React.CSSProperties = {
  width: "100%",
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

const secondaryButton: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "1px solid #111",
  background: "#fff",
  color: "#111",
  cursor: "pointer",
  fontWeight: "bold",
}

const gridTwo: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
  gap: 24,
  marginTop: 34,
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
}

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "#777",
  fontSize: 13,
  margin: 0,
}