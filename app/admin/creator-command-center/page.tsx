"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type CommandData = {
  metrics: any
  leads: any[]
  audits: any[]
  nurtureEvents: any[]
  automationActions: any[]
  proposals: any[]
  invoices: any[]
}

type Intelligence = {
  executiveSummary?: string
  urgentPriorities?: string[]
  growthOpportunities?: string[]
  operationalWarnings?: string[]
  revenueRecommendations?: string[]
  nextBestActions?: string[]
}

export default function CreatorCommandCenterPage() {
  const [data, setData] = useState<CommandData | null>(null)
  const [intelligence, setIntelligence] = useState<Intelligence | null>(null)
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const response = await fetch("/api/creator-command-center")
    const result = await response.json()

    if (result.ok) {
      setData(result)
    }
  }

  async function generateIntelligence() {
    setLoading(true)

    const response = await fetch("/api/creator-command-center", {
      method: "POST",
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to generate executive intelligence")
      return
    }

    setIntelligence(result.intelligence)
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Operations</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Creator Command Center
        </h1>

        <p style={{ color: "var(--hero-muted)", maxWidth: 880, lineHeight: 1.7 }}>
          Unified visibility across leads, nurturing, audits, automations,
          proposals, invoices and AI executive intelligence.
        </p>
      </section>

      <section style={toolbarStyle}>
        <button disabled={loading} onClick={loadData} style={secondaryButton}>
          Refresh
        </button>

        <button disabled={loading} onClick={generateIntelligence} style={buttonStyle}>
          {loading ? "Thinking..." : "Generate Executive Intelligence"}
        </button>
      </section>

      {data ? (
        <>
          <section style={metricsGrid}>
            <Metric label="Total Leads" value={data.metrics.totalLeads} />
            <Metric label="Hot Leads" value={data.metrics.hotLeads} />
            <Metric label="Open Audits" value={data.metrics.openAudits} />
            <Metric label="Nurture Drafts" value={data.metrics.nurtureDrafts} />
            <Metric label="Pending Automations" value={data.metrics.pendingAutomations} />
            <Metric label="Proposals" value={data.metrics.proposals} />
            <Metric
              label="Projected Revenue"
              value={`AUD ${data.metrics.projectedRevenue.toLocaleString("en-AU")}`}
            />
            <Metric
              label="Invoiced Revenue"
              value={`AUD ${data.metrics.invoicedRevenue.toLocaleString("en-AU")}`}
            />
          </section>

          {intelligence ? (
            <section style={intelligenceStyle}>
              <h2>Executive Brain Feed</h2>
              <p style={{ lineHeight: 1.7 }}>{intelligence.executiveSummary}</p>

              <div style={gridThree}>
                <List title="Urgent Priorities" items={intelligence.urgentPriorities} />
                <List title="Growth Opportunities" items={intelligence.growthOpportunities} />
                <List title="Operational Warnings" items={intelligence.operationalWarnings} />
                <List title="Revenue Recommendations" items={intelligence.revenueRecommendations} />
                <List title="Next Best Actions" items={intelligence.nextBestActions} />
              </div>
            </section>
          ) : null}

          <section style={gridTwo}>
            <Panel title="Hot Leads" href="/admin/creator-leads">
              {data.leads
                .filter(
                  (lead) =>
                    lead.leadScore >= 75 ||
                    ["ready", "urgent"].includes(lead.readiness)
                )
                .slice(0, 6)
                .map((lead) => (
                  <Card key={lead.id}>
                    <p style={metaStyle}>
                      Score {lead.leadScore} · {lead.readiness}
                    </p>
                    <h3>{lead.name}</h3>
                    <p>{lead.email}</p>
                  </Card>
                ))}
            </Panel>

            <Panel title="Open Audits" href="/admin/creator-audits">
              {data.audits
                .filter((audit) => audit.status !== "closed")
                .slice(0, 6)
                .map((audit) => (
                  <Card key={audit.id}>
                    <p style={metaStyle}>
                      {audit.status} · Score {audit.opportunityScore}
                    </p>
                    <h3>{audit.name}</h3>
                    <p>{audit.email}</p>
                  </Card>
                ))}
            </Panel>
          </section>

          <section style={gridTwo}>
            <Panel title="Pending Automations" href="/admin/creator-automation-engine">
              {data.automationActions
                .filter((action) => action.status === "pending")
                .slice(0, 6)
                .map((action) => (
                  <Card key={action.id}>
                    <p style={metaStyle}>
                      {action.priority} · {action.actionType}
                    </p>
                    <h3>{action.title}</h3>
                    <p>{action.description}</p>
                  </Card>
                ))}
            </Panel>

            <Panel title="Revenue Pipeline" href="/admin/creator-revenue">
              {data.proposals.slice(0, 6).map((proposal) => (
                <Card key={proposal.id}>
                  <p style={metaStyle}>{proposal.status}</p>
                  <h3>{proposal.title}</h3>
                  <p>
                    AUD {(proposal.estimatedValue || 0).toLocaleString("en-AU")}
                  </p>
                </Card>
              ))}
            </Panel>
          </section>
        </>
      ) : null}
    </main>
  )
}

function Metric({ label, value }: { label: string; value: any }) {
  return (
    <div style={metricCard}>
      <p style={metaStyle}>{label}</p>
      <h2>{value}</h2>
    </div>
  )
}

function Panel({
  title,
  href,
  children,
}: {
  title: string
  href: string
  children: React.ReactNode
}) {
  return (
    <section style={panelStyle}>
      <div style={panelHeader}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <Link href={href} style={plainLink}>
          Open →
        </Link>
      </div>

      <div style={{ display: "grid", gap: 14 }}>{children}</div>
    </section>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <article style={cardStyle}>{children}</article>
}

function List({ title, items }: { title: string; items?: string[] }) {
  return (
    <div style={cardStyle}>
      <h3>{title}</h3>
      <ul style={{ lineHeight: 1.8, paddingLeft: 20 }}>
        {(items || []).map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
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
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 28,
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

const metricsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 16,
  marginTop: 28,
}

const metricCard: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const intelligenceStyle: React.CSSProperties = {
  marginTop: 30,
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const gridTwo: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
  gap: 24,
  marginTop: 30,
}

const gridThree: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
  marginTop: 20,
}

const panelStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const panelHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 16,
}

const cardStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: 18,
}

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "var(--muted)",
  fontSize: 13,
  margin: 0,
}

const plainLink: React.CSSProperties = {
  color: "var(--foreground)",
  fontWeight: "bold",
  textDecoration: "none",
}