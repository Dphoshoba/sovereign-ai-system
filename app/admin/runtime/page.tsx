"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type {
  SovereignRuntimeResult,
  SovereignRuntimeSystem,
} from "@/lib/executive/runtime"

export default function RuntimePage() {
  const [runtime, setRuntime] = useState<SovereignRuntimeResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadRuntime() {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/executive/runtime", {
        cache: "no-store",
      })
      const result = await response.json()

      setLoading(false)

      if (!result.ok) {
        setError(result.error || "Failed to load sovereign runtime")
        return
      }

      setRuntime(result.runtime)
    }

    loadRuntime()
  }, [])

  function statusColor(status: SovereignRuntimeResult["executiveStatus"]) {
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

  function systemStatusColor(status: SovereignRuntimeSystem["status"]) {
    if (status === "active") {
      return "#15803d"
    }

    if (status === "available") {
      return "#1d4ed8"
    }

    if (status === "needs-attention") {
      return "#b45309"
    }

    return "var(--muted)"
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Sovereign Runtime</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Top-level executive orchestration layer coordinating forecast,
          boardroom, learning, knowledge graph, planning, strategy, and
          execution — safe review actions only, no automatic publishing or
          destructive operations.
        </p>
        <div style={actionRowStyle}>
          <Link href="/admin/command-center" style={secondaryLinkStyle}>
            Command Center
          </Link>
          <Link href="/admin/boardroom" style={secondaryLinkStyle}>
            Boardroom
          </Link>
          <Link href="/admin/strategic-plan" style={secondaryLinkStyle}>
            Strategic Plan
          </Link>
          <Link href="/admin/planning-cycles" style={secondaryLinkStyle}>
            Planning Cycles
          </Link>
          <Link href="/admin/operations" style={secondaryLinkStyle}>
            Operations Center
          </Link>
        </div>
      </section>

      {loading && <p style={{ marginTop: 28 }}>Running sovereign runtime...</p>}
      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}

      {runtime && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Runtime Health</p>
              <h2 style={{ fontSize: 36 }}>{runtime.runtimeHealth}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Executive Status</p>
              <h2 style={{ color: statusColor(runtime.executiveStatus) }}>
                {runtime.executiveStatus}
              </h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Active Risks</p>
              <h2>{runtime.activeRisks.length}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Active Opportunities</p>
              <h2>{runtime.activeOpportunities.length}</h2>
            </div>
          </section>

          <section style={twoColumnGrid}>
            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Active Risks</h2>
              {runtime.activeRisks.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No active risks detected.
                </p>
              ) : (
                <ul style={listStyle}>
                  {runtime.activeRisks.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Active Opportunities</h2>
              {runtime.activeOpportunities.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No active opportunities detected.
                </p>
              ) : (
                <ul style={listStyle}>
                  {runtime.activeOpportunities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Current Priorities</h2>
            {runtime.priorities.length === 0 ? (
              <p style={{ color: "var(--muted)", margin: 0 }}>
                No priorities aggregated.
              </p>
            ) : (
              <ul style={listStyle}>
                {runtime.priorities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Recommendations</h2>
            {runtime.recommendations.length === 0 ? (
              <p style={{ color: "var(--muted)", margin: 0 }}>
                No recommendations generated.
              </p>
            ) : (
              <ul style={listStyle}>
                {runtime.recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Next Actions</h2>
            <p style={subMetaStyle}>
              Safe review and generation actions only — no automatic publishing,
              emailing, or destructive changes.
            </p>
            {runtime.nextActions.length === 0 ? (
              <p style={{ color: "var(--muted)", margin: 0 }}>
                No next actions suggested.
              </p>
            ) : (
              <ul style={actionListStyle}>
                {runtime.nextActions.map((action) => (
                  <li key={action.actionType} style={actionItemStyle}>
                    <strong>{action.title}</strong>
                    <p style={{ margin: "6px 0 8px", lineHeight: 1.6 }}>
                      {action.description}
                    </p>
                    <Link href={action.link} style={actionLinkStyle}>
                      Open
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Connected Systems</h2>
            <div style={systemsGrid}>
              {runtime.systems.map((system) => (
                <Link
                  key={system.id}
                  href={system.link}
                  style={systemCardStyle}
                >
                  <div style={systemHeaderStyle}>
                    <strong>{system.name}</strong>
                    <span
                      style={{
                        color: systemStatusColor(system.status),
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      {system.status.replace("-", " ")}
                    </span>
                  </div>
                  <p style={{ margin: "8px 0 0", lineHeight: 1.6, fontSize: 14 }}>
                    {system.summary}
                  </p>
                  {system.healthScore !== null && (
                    <p style={subMetaStyle}>Health {system.healthScore}/100</p>
                  )}
                </Link>
              ))}
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

const listStyle: React.CSSProperties = {
  margin: "12px 0 0",
  paddingLeft: 20,
  lineHeight: 1.7,
}

const actionListStyle: React.CSSProperties = {
  margin: "12px 0 0",
  paddingLeft: 0,
  listStyle: "none",
  lineHeight: 1.7,
}

const actionItemStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: 16,
  marginBottom: 12,
}

const actionLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  padding: "8px 14px",
  borderRadius: 8,
  background: "var(--button-background)",
  color: "var(--button-foreground)",
  fontWeight: 600,
  textDecoration: "none",
  fontSize: 14,
}

const systemsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 12,
  marginTop: 12,
}

const systemCardStyle: React.CSSProperties = {
  display: "block",
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: 16,
  textDecoration: "none",
  color: "inherit",
}

const systemHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
  alignItems: "flex-start",
}
