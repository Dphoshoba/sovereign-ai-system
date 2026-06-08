"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type ExecutiveOverview = {
  content: {
    publishedArticles: number
    drafts: number
    reviewRequired: number
    scheduled: number
  }
  growth: {
    totalSubscribers: number
    activeSubscribers: number
    monthlySubscribers: number
    growthRate: number
    leadMagnetSubscribers: number
    topLeadMagnet: string | null
  }
  crm: {
    totalLeads: number
    hotLeads: number
    wonLeads: number
    proposalReadyLeads: number
  }
  revenue: {
    totalPipelineValue: number
    wonRevenue: number
    openPipeline: number
    totalInvoiced: number
    totalPaid: number
    outstandingRevenue: number
  }
  delivery: {
    activeClients: number
    activeProjects: number
    openTasks: number
    doneTasks: number
    overdueTasks: number
    totalProjectValue: number
    deliveryHealthScore: number
  }
  executiveSummary: {
    overallHealthScore: number
    alerts: string[]
    priorities: string[]
    opportunities: string[]
  }
}

export default function ExecutiveOverviewPage() {
  const [overview, setOverview] = useState<ExecutiveOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadOverview() {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/executive/overview", {
        cache: "no-store",
      })
      const result = await response.json()

      setLoading(false)

      if (!result.ok) {
        setError(result.error || "Failed to load executive overview")
        return
      }

      setOverview(result.overview)
    }

    loadOverview()
  }, [])

  function formatAud(value: number) {
    return `AUD ${(value || 0).toLocaleString("en-AU")}`
  }

  function healthLabel(score: number) {
    if (score >= 80) return "Healthy"
    if (score >= 50) return "Needs Attention"
    return "At Risk"
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Executive Business Overview
        </h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          One dashboard for content, growth, CRM, revenue, and client delivery
          across Echoes & Visions.
        </p>
        <Link href="/admin/operations" style={linkStyle}>
          ← Back to Operations
        </Link>
        <Link href="/admin/executive-recommendations" style={linkStyle}>
          Executive Recommendations
        </Link>
        <Link href="/admin/daily-briefing" style={linkStyle}>
          Daily Briefing
        </Link>
        <Link href="/admin/weekly-review" style={linkStyle}>
          Weekly Review
        </Link>
      </section>

      {loading && <p style={{ marginTop: 28 }}>Loading overview...</p>}

      {error && (
        <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>
      )}

      {overview && (
        <>
          <section style={metricsGrid}>
            <div style={{ ...metricCard, gridColumn: "1 / -1" }}>
              <p style={metaStyle}>Overall Health Score</p>
              <h2 style={{ fontSize: 48, margin: "8px 0" }}>
                {overview.executiveSummary.overallHealthScore}
              </h2>
              <p style={subMetaStyle}>
                {healthLabel(overview.executiveSummary.overallHealthScore)}
              </p>
            </div>
          </section>

          <section style={sectionStyle}>
            <h2>Content</h2>
            <div style={metricsGrid}>
              <MetricCard label="Published Articles" value={overview.content.publishedArticles} />
              <MetricCard label="Drafts" value={overview.content.drafts} />
              <MetricCard label="Review Required" value={overview.content.reviewRequired} />
              <MetricCard label="Scheduled" value={overview.content.scheduled} />
            </div>
          </section>

          <section style={sectionStyle}>
            <h2>Growth</h2>
            <div style={metricsGrid}>
              <MetricCard label="Total Subscribers" value={overview.growth.totalSubscribers} />
              <MetricCard label="Active Subscribers" value={overview.growth.activeSubscribers} />
              <MetricCard label="Monthly Subscribers" value={overview.growth.monthlySubscribers} />
              <MetricCard label="Growth Rate" value={`${overview.growth.growthRate}%`} />
              <MetricCard label="Lead Magnet Subscribers" value={overview.growth.leadMagnetSubscribers} />
              <MetricCard
                label="Top Lead Magnet"
                value={overview.growth.topLeadMagnet || "None yet"}
              />
            </div>
          </section>

          <section style={sectionStyle}>
            <h2>CRM</h2>
            <div style={metricsGrid}>
              <MetricCard label="Total Leads" value={overview.crm.totalLeads} />
              <MetricCard label="Hot Leads" value={overview.crm.hotLeads} />
              <MetricCard label="Won Leads" value={overview.crm.wonLeads} />
              <MetricCard label="Proposal Ready Leads" value={overview.crm.proposalReadyLeads} />
            </div>
          </section>

          <section style={sectionStyle}>
            <h2>Revenue</h2>
            <div style={metricsGrid}>
              <MetricCard label="Total Pipeline Value" value={formatAud(overview.revenue.totalPipelineValue)} />
              <MetricCard label="Won Revenue" value={formatAud(overview.revenue.wonRevenue)} />
              <MetricCard label="Open Pipeline" value={formatAud(overview.revenue.openPipeline)} />
              <MetricCard label="Total Invoiced" value={formatAud(overview.revenue.totalInvoiced)} />
              <MetricCard label="Total Paid" value={formatAud(overview.revenue.totalPaid)} />
              <MetricCard label="Outstanding Revenue" value={formatAud(overview.revenue.outstandingRevenue)} />
            </div>
          </section>

          <section style={sectionStyle}>
            <h2>Delivery</h2>
            <div style={metricsGrid}>
              <MetricCard label="Active Clients" value={overview.delivery.activeClients} />
              <MetricCard label="Active Projects" value={overview.delivery.activeProjects} />
              <MetricCard label="Open Tasks" value={overview.delivery.openTasks} />
              <MetricCard label="Done Tasks" value={overview.delivery.doneTasks} />
              <MetricCard label="Overdue Tasks" value={overview.delivery.overdueTasks} />
              <MetricCard label="Total Project Value" value={formatAud(overview.delivery.totalProjectValue)} />
              <MetricCard label="Delivery Health Score" value={overview.delivery.deliveryHealthScore} />
            </div>
          </section>

          <section style={panelGrid}>
            <article style={panelStyle}>
              <h2 style={panelTitleStyle}>Alerts</h2>
              {overview.executiveSummary.alerts.length === 0 ? (
                <p style={emptyStyle}>No urgent alerts.</p>
              ) : (
                <ul style={listStyle}>
                  {overview.executiveSummary.alerts.map((item) => (
                    <li key={item} style={alertItemStyle}>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article style={panelStyle}>
              <h2 style={panelTitleStyle}>Priorities</h2>
              {overview.executiveSummary.priorities.length === 0 ? (
                <p style={emptyStyle}>No priorities flagged.</p>
              ) : (
                <ul style={listStyle}>
                  {overview.executiveSummary.priorities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </article>

            <article style={panelStyle}>
              <h2 style={panelTitleStyle}>Opportunities</h2>
              <ul style={listStyle}>
                {overview.executiveSummary.opportunities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </section>
        </>
      )}
    </main>
  )
}

function MetricCard({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div style={metricCard}>
      <p style={metaStyle}>{label}</p>
      <h2 style={{ margin: "8px 0 0", fontSize: 28 }}>{value}</h2>
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

const linkStyle: React.CSSProperties = {
  display: "inline-block",
  marginTop: 16,
  marginRight: 20,
  color: "var(--button-foreground)",
  fontWeight: 600,
}

const sectionStyle: React.CSSProperties = {
  marginTop: 32,
}

const metricsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
  marginTop: 16,
}

const metricCard: React.CSSProperties = {
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

const subMetaStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "var(--muted)",
  fontSize: 14,
}

const panelGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 16,
  marginTop: 32,
}

const panelStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const panelTitleStyle: React.CSSProperties = {
  marginTop: 0,
}

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  lineHeight: 1.7,
}

const emptyStyle: React.CSSProperties = {
  color: "var(--muted)",
  margin: 0,
}

const alertItemStyle: React.CSSProperties = {
  color: "#b91c1c",
  fontWeight: 600,
}
