"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type DailyBriefing = {
  date: string
  healthScore: number
  openingSummary: string
  urgentCount: number
  todayCount: number
  revenueSnapshot: {
    totalPipelineValue: number
    wonRevenue: number
    openPipeline: number
    totalInvoiced: number
    totalPaid: number
    outstandingRevenue: number
  }
  growthSnapshot: {
    totalSubscribers: number
    activeSubscribers: number
    monthlySubscribers: number
    growthRate: number
    leadMagnetSubscribers: number
    topLeadMagnet: string | null
  }
  contentSnapshot: {
    publishedArticles: number
    drafts: number
    reviewRequired: number
    scheduled: number
  }
  deliverySnapshot: {
    activeClients: number
    activeProjects: number
    completedProjects: number
    openTasks: number
    doneTasks: number
    overdueTasks: number
    deliveryHealthScore: number
    totalProjectValue: number
  }
  topPriorities: string[]
  risks: string[]
  wins: string[]
  recommendedActions: string[]
}

export default function DailyBriefingPage() {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [archiveLoading, setArchiveLoading] = useState(false)
  const [archiveMessage, setArchiveMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadBriefing() {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/executive/daily-briefing", {
        cache: "no-store",
      })
      const result = await response.json()

      setLoading(false)

      if (!result.ok) {
        setError(result.error || "Failed to load daily briefing")
        return
      }

      setBriefing(result.briefing)
    }

    loadBriefing()
  }, [])

  async function archiveBriefing() {
    setArchiveLoading(true)
    setArchiveMessage(null)

    const response = await fetch("/api/executive/daily-briefing/archive", {
      method: "POST",
    })
    const result = await response.json()

    setArchiveLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to archive briefing")
      return
    }

    setArchiveMessage("Today's briefing has been archived successfully.")
  }

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
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Daily Briefing</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          CEO-style summary of what matters today across Echoes & Visions.
        </p>
        <div style={linkRowStyle}>
          <Link href="/admin/executive-overview" style={linkStyle}>
            Executive Overview
          </Link>
          <Link href="/admin/executive-recommendations" style={linkStyle}>
            Executive Recommendations
          </Link>
          <Link href="/admin/operations" style={linkStyle}>
            Operations Center
          </Link>
        </div>

        <div style={actionRowStyle}>
          <button
            type="button"
            disabled={archiveLoading}
            onClick={archiveBriefing}
            style={primaryButtonStyle}
          >
            {archiveLoading ? "Archiving..." : "Archive Today's Briefing"}
          </button>
          <Link href="/admin/daily-briefing/history" style={secondaryLinkStyle}>
            View History
          </Link>
        </div>
      </section>

      {archiveMessage && (
        <p style={successMessageStyle}>{archiveMessage}</p>
      )}

      {loading && <p style={{ marginTop: 28 }}>Loading daily briefing...</p>}

      {error && (
        <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>
      )}

      {briefing && (
        <>
          <section style={metricsGrid}>
            <div style={{ ...metricCard, gridColumn: "1 / -1" }}>
              <p style={metaStyle}>Date</p>
              <h2 style={{ margin: "8px 0" }}>{briefing.date}</h2>
            </div>

            <div style={metricCard}>
              <p style={metaStyle}>Health Score</p>
              <h2 style={{ fontSize: 48, margin: "8px 0" }}>
                {briefing.healthScore}
              </h2>
              <p style={subMetaStyle}>{healthLabel(briefing.healthScore)}</p>
            </div>

            <div style={metricCard}>
              <p style={metaStyle}>Urgent Items</p>
              <h2>{briefing.urgentCount}</h2>
            </div>

            <div style={metricCard}>
              <p style={metaStyle}>Today Items</p>
              <h2>{briefing.todayCount}</h2>
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={panelTitleStyle}>Opening Summary</h2>
            <p style={{ lineHeight: 1.7, margin: 0 }}>{briefing.openingSummary}</p>
          </section>

          <section style={sectionStyle}>
            <h2>Revenue Snapshot</h2>
            <div style={metricsGrid}>
              <MetricCard label="Total Pipeline" value={formatAud(briefing.revenueSnapshot.totalPipelineValue)} />
              <MetricCard label="Won Revenue" value={formatAud(briefing.revenueSnapshot.wonRevenue)} />
              <MetricCard label="Open Pipeline" value={formatAud(briefing.revenueSnapshot.openPipeline)} />
              <MetricCard label="Total Invoiced" value={formatAud(briefing.revenueSnapshot.totalInvoiced)} />
              <MetricCard label="Total Paid" value={formatAud(briefing.revenueSnapshot.totalPaid)} />
              <MetricCard label="Outstanding" value={formatAud(briefing.revenueSnapshot.outstandingRevenue)} />
            </div>
          </section>

          <section style={sectionStyle}>
            <h2>Growth Snapshot</h2>
            <div style={metricsGrid}>
              <MetricCard label="Total Subscribers" value={briefing.growthSnapshot.totalSubscribers} />
              <MetricCard label="Active Subscribers" value={briefing.growthSnapshot.activeSubscribers} />
              <MetricCard label="Monthly Subscribers" value={briefing.growthSnapshot.monthlySubscribers} />
              <MetricCard label="Growth Rate" value={`${briefing.growthSnapshot.growthRate}%`} />
              <MetricCard label="Lead Magnet Subscribers" value={briefing.growthSnapshot.leadMagnetSubscribers} />
              <MetricCard label="Top Lead Magnet" value={briefing.growthSnapshot.topLeadMagnet || "None yet"} />
            </div>
          </section>

          <section style={sectionStyle}>
            <h2>Content Snapshot</h2>
            <div style={metricsGrid}>
              <MetricCard label="Published Articles" value={briefing.contentSnapshot.publishedArticles} />
              <MetricCard label="Drafts" value={briefing.contentSnapshot.drafts} />
              <MetricCard label="Review Required" value={briefing.contentSnapshot.reviewRequired} />
              <MetricCard label="Scheduled" value={briefing.contentSnapshot.scheduled} />
            </div>
          </section>

          <section style={sectionStyle}>
            <h2>Delivery Snapshot</h2>
            <div style={metricsGrid}>
              <MetricCard label="Active Clients" value={briefing.deliverySnapshot.activeClients} />
              <MetricCard label="Active Projects" value={briefing.deliverySnapshot.activeProjects} />
              <MetricCard label="Completed Projects" value={briefing.deliverySnapshot.completedProjects} />
              <MetricCard label="Open Tasks" value={briefing.deliverySnapshot.openTasks} />
              <MetricCard label="Done Tasks" value={briefing.deliverySnapshot.doneTasks} />
              <MetricCard label="Overdue Tasks" value={briefing.deliverySnapshot.overdueTasks} />
              <MetricCard label="Delivery Health" value={briefing.deliverySnapshot.deliveryHealthScore} />
              <MetricCard label="Project Value" value={formatAud(briefing.deliverySnapshot.totalProjectValue)} />
            </div>
          </section>

          <section style={panelGrid}>
            <BriefingListPanel title="Top Priorities" items={briefing.topPriorities} emptyText="No priorities flagged today." />
            <BriefingListPanel title="Risks" items={briefing.risks} emptyText="No major risks detected." itemStyle={riskItemStyle} />
            <BriefingListPanel title="Wins" items={briefing.wins} emptyText="No wins recorded yet." itemStyle={winItemStyle} />
            <BriefingListPanel title="Recommended Actions" items={briefing.recommendedActions} emptyText="No actions recommended." />
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

function BriefingListPanel({
  title,
  items,
  emptyText,
  itemStyle,
}: {
  title: string
  items: string[]
  emptyText: string
  itemStyle?: React.CSSProperties
}) {
  return (
    <article style={panelStyle}>
      <h2 style={panelTitleStyle}>{title}</h2>
      {items.length === 0 ? (
        <p style={emptyStyle}>{emptyText}</p>
      ) : (
        <ul style={listStyle}>
          {items.map((item) => (
            <li key={item} style={itemStyle}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </article>
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

const linkRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 20,
  flexWrap: "wrap",
  marginTop: 16,
}

const linkStyle: React.CSSProperties = {
  color: "var(--button-foreground)",
  fontWeight: 600,
}

const actionRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 16,
  flexWrap: "wrap",
  alignItems: "center",
  marginTop: 20,
}

const primaryButtonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  background: "var(--card-background)",
  color: "var(--foreground)",
  cursor: "pointer",
  fontWeight: 700,
}

const secondaryLinkStyle: React.CSSProperties = {
  color: "var(--button-foreground)",
  fontWeight: 600,
}

const successMessageStyle: React.CSSProperties = {
  marginTop: 28,
  padding: "12px 16px",
  borderRadius: 10,
  background: "#ecfdf5",
  border: "1px solid #6ee7b7",
  color: "#065f46",
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
  marginTop: 28,
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

const riskItemStyle: React.CSSProperties = {
  color: "#b91c1c",
  fontWeight: 600,
}

const winItemStyle: React.CSSProperties = {
  color: "#065f46",
  fontWeight: 600,
}
