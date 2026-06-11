"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type AutomationAction = {
  id: string
  title: string
  category: string
  priority: "low" | "medium" | "high" | "critical"
  trigger: string
  rationale: string
  recommendedAction: string
  targetType: string
  targetId: string
  status: string
  safetyLevel: "safe_review" | "safe_create_task" | "approval_required" | "manual_only"
  requiresApproval: boolean
  link: string
}

type ExecutiveAutomation = {
  actions: AutomationAction[]
  summary: {
    total: number
    byPriority: Record<string, number>
    byCategory: Record<string, number>
    bySafetyLevel: Record<string, number>
    approvalRequired: number
    manualOnly: number
    highPriority: number
  }
  generatedAt: string
}

function formatSafetyLevel(level: string) {
  return level
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export default function AutomationActionsPage() {
  const [automation, setAutomation] = useState<ExecutiveAutomation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/executive/automation-actions", {
        cache: "no-store",
      })
      const result = await response.json()

      setLoading(false)

      if (!result.ok) {
        setError(result.error || "Failed to load automation actions")
        return
      }

      setAutomation(result.automation)
    }

    load()
  }, [])

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Automation Actions</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Safe, deterministic proposed actions generated from business, client,
          revenue, governance, and learning intelligence. Nothing executes
          without human review.
        </p>
        <div style={actionRowStyle}>
          <Link href="/admin/command-center" style={secondaryLinkStyle}>
            Command Center
          </Link>
          <Link href="/admin/operations" style={secondaryLinkStyle}>
            Operations Center
          </Link>
          <Link href="/admin/revenue-intelligence" style={secondaryLinkStyle}>
            Revenue Intelligence
          </Link>
          <Link href="/admin/client-intelligence" style={secondaryLinkStyle}>
            Client Intelligence
          </Link>
          <Link href="/admin/decision-packages" style={secondaryLinkStyle}>
            Decision Packages
          </Link>
        </div>
      </section>

      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}

      {loading && <p style={{ marginTop: 28 }}>Loading automation actions...</p>}

      {!loading && automation && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Total Actions</p>
              <h2>{automation.summary.total}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>High Priority</p>
              <h2>{automation.summary.highPriority}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Approval Required</p>
              <h2>{automation.summary.approvalRequired}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Manual Only</p>
              <h2>{automation.summary.manualOnly}</h2>
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>Category Breakdown</h2>
            <div style={breakdownGrid}>
              {Object.entries(automation.summary.byCategory)
                .filter(([, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => (
                  <div key={category} style={breakdownCard}>
                    <p style={metaStyle}>{category}</p>
                    <h3 style={{ margin: "6px 0 0" }}>{count}</h3>
                  </div>
                ))}
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={sectionHeadingStyle}>Priority Breakdown</h2>
            <div style={breakdownGrid}>
              {(["critical", "high", "medium", "low"] as const).map(
                (priority) => (
                  <div key={priority} style={breakdownCard}>
                    <p style={metaStyle}>{priority}</p>
                    <h3 style={{ margin: "6px 0 0" }}>
                      {automation.summary.byPriority[priority] ?? 0}
                    </h3>
                  </div>
                )
              )}
            </div>
          </section>

          <section style={{ marginTop: 28 }}>
            <h2>Proposed Actions</h2>
            {automation.actions.length === 0 ? (
              <p style={mutedText}>
                No actions proposed — all intelligence signals are clear.
              </p>
            ) : (
              <div style={cardsGrid}>
                {automation.actions.map((action) => (
                  <div key={action.id} style={actionCard}>
                    <div style={cardHeader}>
                      <h3 style={{ margin: 0, fontSize: 17 }}>{action.title}</h3>
                      <span style={priorityBadge(action.priority)}>
                        {action.priority}
                      </span>
                    </div>

                    <p style={{ ...metaStyle, marginTop: 10 }}>
                      {action.category} · {formatSafetyLevel(action.safetyLevel)}
                      {action.requiresApproval && " · Requires Approval"}
                    </p>

                    <p style={itemDetailStyle}>
                      <strong>Trigger:</strong> {action.trigger}
                    </p>
                    <p style={itemDetailStyle}>
                      <strong>Rationale:</strong> {action.rationale}
                    </p>
                    <p style={itemDetailStyle}>
                      <strong>Recommended:</strong> {action.recommendedAction}
                    </p>

                    <Link href={action.link} style={cardLinkStyle}>
                      Open {action.link}
                    </Link>
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

const breakdownGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
  gap: 12,
  marginTop: 12,
}

const breakdownCard: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 16,
}

const cardsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
  gap: 16,
  marginTop: 12,
}

const actionCard: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
  display: "flex",
  flexDirection: "column",
}

const cardHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
}

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "var(--muted)",
  fontSize: 13,
  margin: 0,
}

const panelStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
  marginTop: 28,
}

const sectionHeadingStyle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 18,
}

const mutedText: React.CSSProperties = {
  color: "var(--muted)",
}

const itemDetailStyle: React.CSSProperties = {
  margin: "10px 0 0",
  color: "var(--muted)",
  lineHeight: 1.6,
}

const cardLinkStyle: React.CSSProperties = {
  marginTop: 14,
  color: "var(--button-foreground)",
  fontWeight: 600,
  textDecoration: "underline",
}

function priorityBadge(
  priority: "low" | "medium" | "high" | "critical"
): React.CSSProperties {
  const palette = {
    low: { background: "#f3f4f6", color: "#4b5563" },
    medium: { background: "#dbeafe", color: "#1d4ed8" },
    high: { background: "#ffedd5", color: "#c2410c" },
    critical: { background: "#fee2e2", color: "#b91c1c" },
  }[priority]

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
