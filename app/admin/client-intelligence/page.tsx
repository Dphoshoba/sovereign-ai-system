"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type ClientRecord = {
  clientId: string
  clientName: string
  healthScore: number
  riskScore: number
  opportunityScore: number
  revenueGenerated: number
  outstandingRevenue: number
  activeProjects: number
  completedProjects: number
  invoiceStatus: string
  projectStatus: string
  relationshipStatus: "Healthy" | "Growing" | "At Risk" | "Dormant"
  nextBestAction: string
}

type ClientIntelligence = {
  clients: ClientRecord[]
  summary: {
    totalClients: number
    healthyClients: number
    atRiskClients: number
    dormantClients: number
    totalRevenue: number
    totalOutstanding: number
  }
  generatedAt: string
}

function formatAud(value: number) {
  return `$${value.toLocaleString()} AUD`
}

export default function ClientIntelligencePage() {
  const [intelligence, setIntelligence] = useState<ClientIntelligence | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/executive/client-intelligence", {
        cache: "no-store",
      })
      const result = await response.json()

      setLoading(false)

      if (!result.ok) {
        setError(result.error || "Failed to load client intelligence")
        return
      }

      setIntelligence(result.intelligence)
    }

    load()
  }, [])

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Client Intelligence</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Executive intelligence for every client — health, risk, opportunity,
          relationship status, and the next best action.
        </p>
        <div style={actionRowStyle}>
          <Link href="/admin/revenue-intelligence" style={secondaryLinkStyle}>
            Revenue Intelligence
          </Link>
          <Link href="/admin/business-memory" style={secondaryLinkStyle}>
            Business Memory
          </Link>
          <Link href="/admin/command-center" style={secondaryLinkStyle}>
            Command Center
          </Link>
          <Link href="/admin/operations" style={secondaryLinkStyle}>
            Operations Center
          </Link>
          <Link href="/admin/automation-actions" style={secondaryLinkStyle}>
            Automation Actions
          </Link>
          <Link href="/admin/cfo" style={secondaryLinkStyle}>
            CFO Intelligence
          </Link>
          <Link href="/admin/coo" style={secondaryLinkStyle}>
            COO Intelligence
          </Link>
          <Link href="/admin/clients" style={secondaryLinkStyle}>
            Clients
          </Link>
        </div>
      </section>

      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}

      {loading && <p style={{ marginTop: 28 }}>Loading client intelligence...</p>}

      {!loading && intelligence && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Healthy Clients</p>
              <h2>
                {intelligence.summary.healthyClients}/
                {intelligence.summary.totalClients}
              </h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>At Risk Clients</p>
              <h2>{intelligence.summary.atRiskClients}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Dormant Clients</p>
              <h2>{intelligence.summary.dormantClients}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Total Revenue</p>
              <h2>{formatAud(intelligence.summary.totalRevenue)}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Outstanding Revenue</p>
              <h2>{formatAud(intelligence.summary.totalOutstanding)}</h2>
            </div>
          </section>

          <section style={{ marginTop: 28 }}>
            <h2>Client Cards</h2>
            {intelligence.clients.length === 0 ? (
              <p style={mutedText}>No clients on record yet.</p>
            ) : (
              <div style={cardsGrid}>
                {intelligence.clients.map((client) => (
                  <div key={client.clientId} style={clientCard}>
                    <div style={cardHeader}>
                      <h3 style={{ margin: 0 }}>{client.clientName}</h3>
                      <span style={statusBadge(client.relationshipStatus)}>
                        {client.relationshipStatus}
                      </span>
                    </div>

                    <div style={scoreRow}>
                      <div>
                        <p style={metaStyle}>Health</p>
                        <strong>{client.healthScore}</strong>
                      </div>
                      <div>
                        <p style={metaStyle}>Risk</p>
                        <strong>{client.riskScore}</strong>
                      </div>
                      <div>
                        <p style={metaStyle}>Opportunity</p>
                        <strong>{client.opportunityScore}</strong>
                      </div>
                    </div>

                    <div style={scoreRow}>
                      <div>
                        <p style={metaStyle}>Revenue</p>
                        <strong>{formatAud(client.revenueGenerated)}</strong>
                      </div>
                      <div>
                        <p style={metaStyle}>Outstanding</p>
                        <strong>{formatAud(client.outstandingRevenue)}</strong>
                      </div>
                    </div>

                    <p style={itemDetailStyle}>
                      Invoices: {client.invoiceStatus}
                    </p>
                    <p style={itemDetailStyle}>
                      Projects: {client.projectStatus}
                    </p>

                    <div style={actionBox}>
                      <p style={metaStyle}>Next Best Action</p>
                      <p style={{ margin: "6px 0 0", lineHeight: 1.6 }}>
                        {client.nextBestAction}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
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

const actionRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 20,
}

const secondaryLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "12px 18px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  color: "var(--button-foreground)",
  fontWeight: 600,
  textDecoration: "none",
}

const metricsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 16,
  marginTop: 28,
}

const metricCard: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const cardsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
  gap: 16,
  marginTop: 12,
}

const clientCard: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const cardHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
}

const scoreRow: React.CSSProperties = {
  display: "flex",
  gap: 24,
  marginTop: 16,
}

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "var(--muted)",
  fontSize: 13,
  margin: 0,
}

const mutedText: React.CSSProperties = {
  color: "var(--muted)",
}

const itemDetailStyle: React.CSSProperties = {
  margin: "12px 0 0",
  color: "var(--muted)",
}

const actionBox: React.CSSProperties = {
  marginTop: 16,
  padding: 14,
  borderRadius: 12,
  border: "1px solid var(--border)",
}

function statusBadge(
  status: "Healthy" | "Growing" | "At Risk" | "Dormant"
): React.CSSProperties {
  const palette = {
    Healthy: { background: "#dcfce7", color: "#15803d" },
    Growing: { background: "#dbeafe", color: "#1d4ed8" },
    "At Risk": { background: "#fee2e2", color: "#b91c1c" },
    Dormant: { background: "#f3f4f6", color: "#4b5563" },
  }[status]

  return {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    whiteSpace: "nowrap",
    ...palette,
  }
}
