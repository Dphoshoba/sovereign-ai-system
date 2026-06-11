"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { ExecutiveCommandCenter } from "@/lib/executive/command-center"
import type { ExecutiveIntelligenceRecommendation } from "@/lib/executive/recommendations"
import type { ExecutiveOpportunity } from "@/lib/executive/opportunities"
import type { ExecutiveRisk } from "@/lib/executive/risks"

type ExecutiveBriefing = {
  health: number
  generatedAt: string
  topOpportunities: ExecutiveOpportunity[]
  topRisks: ExecutiveRisk[]
  recommendations: ExecutiveIntelligenceRecommendation[]
  nextActions: string[]
  totals: {
    recommendations: number
    opportunities: number
    risks: number
  }
}

export default function CommandCenterPage() {
  const [center, setCenter] = useState<ExecutiveCommandCenter | null>(null)
  const [briefing, setBriefing] = useState<ExecutiveBriefing | null>(null)
  const [briefingError, setBriefingError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadCenter() {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/executive/command-center", {
        cache: "no-store",
      })
      const result = await response.json()

      setLoading(false)

      if (!result.ok) {
        setError(result.error || "Failed to load executive command center")
        return
      }

      setCenter(result.center)
    }

    async function loadBriefing() {
      setBriefingError(null)

      try {
        const response = await fetch("/api/executive/briefing", {
          cache: "no-store",
        })
        const result = await response.json()

        if (!result.ok) {
          setBriefingError(result.error || "Failed to load executive briefing")
          return
        }

        setBriefing(result.briefing)
      } catch {
        setBriefingError("Failed to load executive briefing")
      }
    }

    loadCenter()
    loadBriefing()
  }, [])

  function statusColor(status: ExecutiveCommandCenter["executiveStatus"]) {
    if (status === "Excellent") {
      return "#15803d"
    }

    if (status === "Good") {
      return "#166534"
    }

    if (status === "Needs Attention") {
      return "#b45309"
    }

    return "#b91c1c"
  }

  function formatAud(value: number) {
    return value.toLocaleString("en-AU", {
      style: "currency",
      currency: "AUD",
      maximumFractionDigits: 0,
    })
  }

  function levelColor(level: string) {
    if (level === "critical") {
      return "#b91c1c"
    }

    if (level === "high") {
      return "#c2410c"
    }

    if (level === "medium") {
      return "#b45309"
    }

    return "#15803d"
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command · V1 Primary</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Command Center</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Unified executive cockpit for the Sovereign AI platform — health,
          alerts, priorities, and live signals across strategy, execution,
          learning, and boardroom systems.
        </p>
        <div style={actionRowStyle}>
          <Link href="/admin/runtime" style={primaryLinkStyle}>
            Sovereign Runtime
          </Link>
          <Link href="/admin/boardroom" style={secondaryLinkStyle}>
            Boardroom
          </Link>
          <Link href="/admin/strategic-plan" style={secondaryLinkStyle}>
            Strategic Plan
          </Link>
          <Link href="/admin/quarterly-review" style={secondaryLinkStyle}>
            Quarterly Review
          </Link>
          <Link href="/admin/strategy-adjustments" style={secondaryLinkStyle}>
            Strategy Adjustments
          </Link>
          <Link href="/admin/recommendation-improvement" style={secondaryLinkStyle}>
            Recommendation Improvement
          </Link>
          <Link href="/admin/business-memory" style={secondaryLinkStyle}>
            Business Memory
          </Link>
          <Link href="/admin/revenue-intelligence" style={secondaryLinkStyle}>
            Revenue Intelligence
          </Link>
          <Link href="/admin/client-intelligence" style={secondaryLinkStyle}>
            Client Intelligence
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
          <Link href="/admin/operations" style={secondaryLinkStyle}>
            Operations Center
          </Link>
          <Link href="/admin/executive-timeline" style={secondaryLinkStyle}>
            Executive Timeline
          </Link>
        </div>
      </section>

      {loading && <p style={{ marginTop: 28 }}>Loading command center...</p>}
      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}

      {center && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Health Score</p>
              <h2 style={{ fontSize: 36 }}>{center.healthScore}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Executive Status</p>
              <h2 style={{ color: statusColor(center.executiveStatus) }}>
                {center.executiveStatus}
              </h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Active Alerts</p>
              <h2>{center.alerts.length}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Priority Actions</p>
              <h2>{center.priorities.length}</h2>
            </div>
          </section>

          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Revenue</p>
              <h2>{formatAud(center.revenue.wonRevenue)}</h2>
              <p style={subMetaStyle}>
                Outstanding {formatAud(center.revenue.outstandingRevenue)}
              </p>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Growth</p>
              <h2>{center.growth.totalSubscribers}</h2>
              <p style={subMetaStyle}>
                {center.growth.growthRate}% monthly growth
              </p>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Delivery</p>
              <h2>{center.delivery.deliveryHealthScore}/100</h2>
              <p style={subMetaStyle}>
                {center.delivery.overdueTasks} overdue task
                {center.delivery.overdueTasks === 1 ? "" : "s"}
              </p>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Content</p>
              <h2>{center.content.publishedArticles}</h2>
              <p style={subMetaStyle}>
                {center.content.reviewRequired} in review
              </p>
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Executive Briefing</h2>
            {briefingError && (
              <p style={{ color: "#b91c1c", margin: 0 }}>{briefingError}</p>
            )}
            {!briefing && !briefingError && (
              <p style={{ color: "var(--muted)", margin: 0 }}>
                Generating executive briefing...
              </p>
            )}
            {briefing && (
              <>
                <p style={subMetaStyle}>
                  Intelligence health {briefing.health}/100 —{" "}
                  {briefing.totals.recommendations} recommendation
                  {briefing.totals.recommendations === 1 ? "" : "s"},{" "}
                  {briefing.totals.opportunities} opportunit
                  {briefing.totals.opportunities === 1 ? "y" : "ies"},{" "}
                  {briefing.totals.risks} risk
                  {briefing.totals.risks === 1 ? "" : "s"} · generated{" "}
                  {new Date(briefing.generatedAt).toLocaleString("en-AU")}
                </p>
                {briefing.nextActions.length === 0 ? (
                  <p style={{ color: "var(--muted)", margin: "12px 0 0" }}>
                    No next actions — systems are on track.
                  </p>
                ) : (
                  <ul style={listStyle}>
                    {briefing.nextActions.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>

          {briefing && (
            <>
              <section style={twoColumnGrid}>
                <div style={panelStyle}>
                  <h2 style={{ marginTop: 0 }}>Executive Recommendations</h2>
                  {briefing.recommendations.length === 0 ? (
                    <p style={{ color: "var(--muted)", margin: 0 }}>
                      No recommendations generated.
                    </p>
                  ) : (
                    <ul style={listStyle}>
                      {briefing.recommendations.map((item) => (
                        <li key={item.title}>
                          <strong>{item.title}</strong>{" "}
                          <span
                            style={{
                              color: levelColor(item.priority),
                              fontWeight: 700,
                              fontSize: 13,
                              textTransform: "uppercase",
                            }}
                          >
                            {item.priority}
                          </span>
                          <p style={{ margin: "4px 0 0" }}>{item.rationale}</p>
                          <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                            {item.action} (confidence{" "}
                            {Math.round(item.confidence * 100)}%)
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div style={panelStyle}>
                  <h2 style={{ marginTop: 0 }}>Top Opportunities</h2>
                  {briefing.topOpportunities.length === 0 ? (
                    <p style={{ color: "var(--muted)", margin: 0 }}>
                      No opportunities generated.
                    </p>
                  ) : (
                    <ul style={listStyle}>
                      {briefing.topOpportunities.map((item) => (
                        <li key={item.title}>
                          <strong>{item.title}</strong>
                          <p style={{ margin: "4px 0 0" }}>
                            Score {item.score}/100
                            {item.potentialValue > 0
                              ? ` — potential ${formatAud(item.potentialValue)}`
                              : ""}
                          </p>
                          <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                            {item.nextAction}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              <section style={panelStyle}>
                <h2 style={{ marginTop: 0 }}>Top Risks</h2>
                {briefing.topRisks.length === 0 ? (
                  <p style={{ color: "var(--muted)", margin: 0 }}>
                    No risks detected.
                  </p>
                ) : (
                  <ul style={listStyle}>
                    {briefing.topRisks.map((item) => (
                      <li key={item.title}>
                        <strong>{item.title}</strong>{" "}
                        <span
                          style={{
                            color: levelColor(item.severity),
                            fontWeight: 700,
                            fontSize: 13,
                            textTransform: "uppercase",
                          }}
                        >
                          {item.severity}
                        </span>
                        <p style={{ margin: "4px 0 0" }}>{item.impact}</p>
                        <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                          Mitigation: {item.mitigation}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}

          <section style={twoColumnGrid}>
            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Executive Alerts</h2>
              {center.alerts.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No active alerts detected.
                </p>
              ) : (
                <ul style={listStyle}>
                  {center.alerts.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Priority Actions</h2>
              {center.priorities.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No priority actions identified.
                </p>
              ) : (
                <ul style={listStyle}>
                  {center.priorities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Opportunities</h2>
            {center.opportunities.length === 0 ? (
              <p style={{ color: "var(--muted)", margin: 0 }}>
                No opportunities identified.
              </p>
            ) : (
              <ul style={listStyle}>
                {center.opportunities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>

          <section style={twoColumnGrid}>
            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Boardroom Summary</h2>
              <p style={subMetaStyle}>
                {center.boardroom.sessionCount} session
                {center.boardroom.sessionCount === 1 ? "" : "s"}
                {center.boardroom.latestHealthScore !== null
                  ? ` — latest health ${center.boardroom.latestHealthScore}/100`
                  : ""}
              </p>
              {center.boardroom.latestSummary ? (
                <p style={{ lineHeight: 1.6 }}>{center.boardroom.latestSummary}</p>
              ) : (
                <p style={{ color: "var(--muted)" }}>No boardroom sessions yet.</p>
              )}
              {center.boardroom.topPriorities.length > 0 && (
                <ul style={listStyle}>
                  {center.boardroom.topPriorities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Learning Summary</h2>
              <p style={subMetaStyle}>
                {center.learning.totalLessons} lesson
                {center.learning.totalLessons === 1 ? "" : "s"} — avg effectiveness{" "}
                {center.learning.averageEffectiveness}/100
              </p>
              <ul style={listStyle}>
                {center.learning.strongestImpactArea && (
                  <li>Strongest: {center.learning.strongestImpactArea}</li>
                )}
                {center.learning.weakestImpactArea && (
                  <li>Weakest: {center.learning.weakestImpactArea}</li>
                )}
                {center.learning.topPractices.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <section style={twoColumnGrid}>
            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Strategy Summary</h2>
              <p style={subMetaStyle}>
                Strategic health {center.strategy.strategicHealth}/100 —{" "}
                {center.strategy.planningPeriod}
              </p>
              <p style={{ lineHeight: 1.6 }}>{center.strategy.executiveSummary}</p>
              <ul style={listStyle}>
                {center.strategy.quarterlyReviewQuarter && (
                  <li>
                    Quarterly review: {center.strategy.quarterlyReviewQuarter}{" "}
                    {center.strategy.quarterlyReviewYear}
                    {center.strategy.quarterlyReviewHealth !== null
                      ? ` (${center.strategy.quarterlyReviewHealth}/100)`
                      : ""}
                  </li>
                )}
                <li>
                  Strategy adjustments: {center.strategy.proposedAdjustments}{" "}
                  proposed, {center.strategy.approvedAdjustments} approved
                </li>
                <li>Forecast confidence: {center.strategy.forecastConfidence}</li>
              </ul>
            </div>

            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Execution Summary</h2>
              <p style={subMetaStyle}>
                {center.execution.quarter} {center.execution.year}
              </p>
              <ul style={listStyle}>
                <li>
                  Goals: {center.execution.completedGoals}/
                  {center.execution.totalGoals} completed (
                  {center.execution.goalCompletionRate}%)
                </li>
                <li>
                  Initiatives: {center.execution.completedInitiatives}/
                  {center.execution.totalInitiatives} completed (
                  {center.execution.initiativeCompletionRate}%) —{" "}
                  {center.execution.initiativeHealth}
                </li>
                <li>Blocked initiatives: {center.execution.blockedInitiatives}</li>
                {center.execution.latestPlanningCycleSummary && (
                  <li>{center.execution.latestPlanningCycleSummary}</li>
                )}
              </ul>
            </div>
          </section>

          <section style={threeColumnGrid}>
            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Recent Decisions</h2>
              {center.recentDecisions.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>No decisions.</p>
              ) : (
                <ul style={listStyle}>
                  {center.recentDecisions.map((item) => (
                    <li key={item.id}>
                      <strong>{item.title}</strong>
                      <p style={{ margin: "4px 0 0" }}>
                        {item.status}
                        {item.effectiveness !== null
                          ? ` — ${item.effectiveness}/100`
                          : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Recent Adjustments</h2>
              {center.recentAdjustments.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No adjustments.
                </p>
              ) : (
                <ul style={listStyle}>
                  {center.recentAdjustments.map((item) => (
                    <li key={item.id}>
                      <strong>{item.title}</strong>
                      <p style={{ margin: "4px 0 0" }}>
                        {item.status} — {item.priority}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Recent Simulations</h2>
              {center.recentSimulations.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No simulations.
                </p>
              ) : (
                <ul style={listStyle}>
                  {center.recentSimulations.map((item) => (
                    <li key={item.id}>
                      <strong>{item.title}</strong>
                      <p style={{ margin: "4px 0 0" }}>
                        {item.status}
                        {item.impactScore !== null
                          ? ` — impact ${item.impactScore}/100`
                          : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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

const primaryLinkStyle: React.CSSProperties = {
  ...secondaryLinkStyle,
  background: "var(--button-background)",
  border: "none",
  fontWeight: 700,
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

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "var(--muted)",
  fontSize: 13,
  margin: 0,
}

const subMetaStyle: React.CSSProperties = {
  color: "var(--muted)",
  margin: "8px 0 0",
  fontSize: 14,
  lineHeight: 1.5,
}

const panelStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
  marginTop: 28,
}

const twoColumnGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 16,
}

const threeColumnGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
}

const listStyle: React.CSSProperties = {
  margin: "12px 0 0",
  paddingLeft: 20,
  lineHeight: 1.7,
}
