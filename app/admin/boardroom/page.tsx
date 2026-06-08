"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"

type BoardroomAgentReport = {
  role: string
  assessment: string
  concerns: string[]
  opportunities: string[]
  recommendations: string[]
  learningApplied?: string[]
}

type BoardroomLearningSummary = {
  lessonsUsed: string[]
  strongPatternsApplied: string[]
  weakPatternsFlagged: string[]
}

type BoardroomSession = {
  id: string
  sessionType: string
  healthScore: number | null
  summary: string | null
  executiveSummary: string | null
  agents: BoardroomAgentReport[]
  keyDecisions: string[]
  topPriorities: string[]
  majorRisks: string[]
  majorOpportunities: string[]
  learningSummary?: BoardroomLearningSummary
  createdAt: string
}

const EMPTY_LEARNING_SUMMARY: BoardroomLearningSummary = {
  lessonsUsed: [],
  strongPatternsApplied: [],
  weakPatternsFlagged: [],
}

const AGENT_ORDER = [
  "CEO",
  "COO",
  "CFO",
  "CMO",
  "Content Director",
  "Growth Director",
  "Delivery Director",
]

export default function BoardroomPage() {
  const [sessions, setSessions] = useState<BoardroomSession[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const loadSessions = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await fetch("/api/executive/boardroom", {
      cache: "no-store",
    })
    const result = await response.json()

    setLoading(false)

    if (!result.ok) {
      setError(result.error || "Failed to load boardroom sessions")
      return
    }

    setSessions(result.sessions)
    setSelectedId((current) => current ?? result.sessions[0]?.id ?? null)
  }, [])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const latestSession = sessions[0] ?? null
  const activeSession =
    sessions.find((session) => session.id === selectedId) ?? latestSession

  const summary = useMemo(() => {
    return {
      sessions: sessions.length,
      healthScore: latestSession?.healthScore ?? null,
      priorities: latestSession?.topPriorities.length ?? 0,
      risks: latestSession?.majorRisks.length ?? 0,
    }
  }, [sessions, latestSession])

  async function runBoardroomSession() {
    setRunning(true)
    setMessage(null)
    setError(null)

    const response = await fetch("/api/executive/boardroom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionType: "weekly" }),
    })
    const result = await response.json()

    setRunning(false)

    if (!result.ok) {
      setError(result.error || "Failed to run boardroom session")
      return
    }

    setMessage("Executive boardroom session completed.")
    setSelectedId(result.session.id)
    await loadSessions()
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString("en-AU", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function healthColor(score: number | null) {
    if (score === null) {
      return "var(--foreground)"
    }

    if (score >= 80) {
      return "#15803d"
    }

    if (score >= 60) {
      return "var(--foreground)"
    }

    return "#b91c1c"
  }

  function sortAgents(agents: BoardroomAgentReport[]) {
    return [...agents].sort(
      (left, right) =>
        AGENT_ORDER.indexOf(left.role) - AGENT_ORDER.indexOf(right.role)
    )
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Executive Boardroom</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Virtual executive boardroom where CEO, COO, CFO, CMO, and functional
          directors independently analyze the business and produce consensus
          recommendations.
        </p>
        <div style={actionRowStyle}>
          <button
            type="button"
            disabled={running}
            onClick={runBoardroomSession}
            style={primaryButtonStyle}
          >
            {running ? "Running Session..." : "Run Boardroom Session"}
          </button>
          <Link href="/admin/planning-cycles" style={secondaryLinkStyle}>
            Planning Cycles
          </Link>
          <Link href="/admin/strategic-plan" style={secondaryLinkStyle}>
            Strategic Plan
          </Link>
          <Link href="/admin/executive-overview" style={secondaryLinkStyle}>
            Executive Overview
          </Link>
          <Link href="/admin/operations" style={secondaryLinkStyle}>
            Operations Center
          </Link>
          <Link href="/admin/decision-memory" style={secondaryLinkStyle}>
            Decision Memory
          </Link>
          <Link href="/admin/decision-outcomes" style={secondaryLinkStyle}>
            Decision Outcomes
          </Link>
          <Link href="/admin/executive-learning" style={secondaryLinkStyle}>
            Executive Learning
          </Link>
          <Link href="/admin/knowledge-graph" style={secondaryLinkStyle}>
            Knowledge Graph
          </Link>
        </div>
      </section>

      {message && <p style={successMessageStyle}>{message}</p>}
      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}

      {loading && <p style={{ marginTop: 28 }}>Loading boardroom sessions...</p>}

      {!loading && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Sessions</p>
              <h2>{summary.sessions}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Current Health Score</p>
              <h2 style={{ color: healthColor(summary.healthScore) }}>
                {summary.healthScore ?? "—"}
              </h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Priorities</p>
              <h2>{summary.priorities}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Risks</p>
              <h2>{summary.risks}</h2>
            </div>
          </section>

          {sessions.length === 0 ? (
            <p style={{ marginTop: 28, color: "var(--muted)" }}>
              No boardroom sessions yet. Run a session to gather executive agent
              analysis.
            </p>
          ) : (
            <>
              {sessions.length > 1 && (
                <section style={{ marginTop: 28 }}>
                  <h2>Session History</h2>
                  <div style={historyRowStyle}>
                    {sessions.map((session) => (
                      <button
                        key={session.id}
                        type="button"
                        style={{
                          ...historyButtonStyle,
                          ...(selectedId === session.id
                            ? historyButtonActiveStyle
                            : {}),
                        }}
                        onClick={() => setSelectedId(session.id)}
                      >
                        {session.sessionType} · {formatDate(session.createdAt)}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {activeSession && (
                <section style={{ marginTop: 28 }}>
                  <div style={sessionHeaderStyle}>
                    <h2 style={{ margin: 0 }}>
                      {activeSession.sessionType} Session
                    </h2>
                    <p style={metaLineStyle}>{formatDate(activeSession.createdAt)}</p>
                  </div>

                  <section style={panelStyle}>
                    <h3 style={sectionHeadingStyle}>Executive Summary</h3>
                    <p style={summaryTextStyle}>
                      {activeSession.executiveSummary ||
                        activeSession.summary ||
                        "No summary available."}
                    </p>
                  </section>

                  <section style={panelStyle}>
                    <h3 style={sectionHeadingStyle}>Learning Summary</h3>
                    {(() => {
                      const learningSummary =
                        activeSession.learningSummary ?? EMPTY_LEARNING_SUMMARY

                      return (
                        <>
                          <div style={learningGridStyle}>
                            <div>
                              <strong>Lessons Used</strong>
                              {learningSummary.lessonsUsed.length === 0 ? (
                                <p style={mutedText}>
                                  No executive lessons applied in this session.
                                </p>
                              ) : (
                                <ul style={listStyle}>
                                  {learningSummary.lessonsUsed.map((item) => (
                                    <li key={item}>{item}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <div>
                              <strong>Strong Patterns Applied</strong>
                              {learningSummary.strongPatternsApplied.length ===
                              0 ? (
                                <p style={mutedText}>
                                  No strong patterns matched recommendations.
                                </p>
                              ) : (
                                <ul style={listStyle}>
                                  {learningSummary.strongPatternsApplied.map(
                                    (item) => (
                                      <li key={item}>{item}</li>
                                    )
                                  )}
                                </ul>
                              )}
                            </div>
                            <div>
                              <strong>Weak Patterns Flagged</strong>
                              {learningSummary.weakPatternsFlagged.length ===
                              0 ? (
                                <p style={mutedText}>
                                  No weak patterns flagged in recommendations.
                                </p>
                              ) : (
                                <ul style={listStyle}>
                                  {learningSummary.weakPatternsFlagged.map(
                                    (item) => (
                                      <li key={item}>{item}</li>
                                    )
                                  )}
                                </ul>
                              )}
                            </div>
                          </div>
                        </>
                      )
                    })()}
                  </section>

                  <section style={{ marginTop: 28 }}>
                    <h2>Agent Panels</h2>
                    <div style={agentGridStyle}>
                      {sortAgents(activeSession.agents).map((agent) => (
                        <article key={agent.role} style={agentCardStyle}>
                          <h3 style={agentHeadingStyle}>{agent.role}</h3>
                          <p style={assessmentStyle}>
                            <strong>Assessment:</strong> {agent.assessment}
                          </p>

                          {agent.concerns.length > 0 && (
                            <div style={agentSectionStyle}>
                              <strong>Concerns</strong>
                              <ul style={listStyle}>
                                {agent.concerns.map((item) => (
                                  <li key={item}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {agent.opportunities.length > 0 && (
                            <div style={agentSectionStyle}>
                              <strong>Opportunities</strong>
                              <ul style={listStyle}>
                                {agent.opportunities.map((item) => (
                                  <li key={item}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {agent.recommendations.length > 0 && (
                            <div style={agentSectionStyle}>
                              <strong>Recommendations</strong>
                              <ul style={listStyle}>
                                {agent.recommendations.map((item) => (
                                  <li key={item}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {agent.learningApplied &&
                            agent.learningApplied.length > 0 && (
                              <div style={agentSectionStyle}>
                                <strong>Learning Applied</strong>
                                <ul style={listStyle}>
                                  {agent.learningApplied.map((item) => (
                                    <li key={item}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                        </article>
                      ))}
                    </div>
                  </section>

                  <section style={consensusGridStyle}>
                    <div style={panelStyle}>
                      <h3 style={sectionHeadingStyle}>Key Decisions</h3>
                      {activeSession.keyDecisions.length === 0 ? (
                        <p style={mutedText}>No consensus decisions recorded.</p>
                      ) : (
                        <ul style={listStyle}>
                          {activeSession.keyDecisions.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div style={panelStyle}>
                      <h3 style={sectionHeadingStyle}>Top Priorities</h3>
                      {activeSession.topPriorities.length === 0 ? (
                        <p style={mutedText}>No priorities recorded.</p>
                      ) : (
                        <ul style={listStyle}>
                          {activeSession.topPriorities.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div style={panelStyle}>
                      <h3 style={sectionHeadingStyle}>Major Risks</h3>
                      {activeSession.majorRisks.length === 0 ? (
                        <p style={mutedText}>No major risks recorded.</p>
                      ) : (
                        <ul style={listStyle}>
                          {activeSession.majorRisks.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div style={panelStyle}>
                      <h3 style={sectionHeadingStyle}>Major Opportunities</h3>
                      {activeSession.majorOpportunities.length === 0 ? (
                        <p style={mutedText}>No major opportunities recorded.</p>
                      ) : (
                        <ul style={listStyle}>
                          {activeSession.majorOpportunities.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </section>
                </section>
              )}
            </>
          )}
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

const primaryButtonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  background: "var(--button-background)",
  color: "var(--button-foreground)",
  fontWeight: 700,
  cursor: "pointer",
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

const successMessageStyle: React.CSSProperties = {
  marginTop: 28,
  color: "#15803d",
  fontWeight: 600,
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

const panelStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
  marginTop: 20,
}

const sectionHeadingStyle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 18,
}

const summaryTextStyle: React.CSSProperties = {
  margin: 0,
  lineHeight: 1.7,
}

const mutedText: React.CSSProperties = {
  margin: 0,
  color: "var(--muted)",
}

const sessionHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  alignItems: "baseline",
}

const metaLineStyle: React.CSSProperties = {
  margin: 0,
  color: "var(--muted)",
}

const historyRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 12,
}

const historyButtonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--card-background)",
  cursor: "pointer",
  fontSize: 13,
}

const historyButtonActiveStyle: React.CSSProperties = {
  background: "var(--button-background)",
  color: "var(--button-foreground)",
  fontWeight: 600,
}

const agentGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 16,
  marginTop: 16,
}

const agentCardStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 20,
}

const agentHeadingStyle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 18,
}

const assessmentStyle: React.CSSProperties = {
  margin: "0 0 12px",
  lineHeight: 1.6,
  fontSize: 14,
}

const agentSectionStyle: React.CSSProperties = {
  marginTop: 12,
  fontSize: 14,
}

const listStyle: React.CSSProperties = {
  margin: "8px 0 0",
  paddingLeft: 20,
  lineHeight: 1.6,
}

const learningGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
}

const consensusGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
  marginTop: 28,
}
