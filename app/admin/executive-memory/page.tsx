"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { ExecutiveMemory } from "@/lib/executive/memory"

export default function ExecutiveMemoryPage() {
  const [memory, setMemory] = useState<ExecutiveMemory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadMemory() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/executive/memory", {
          cache: "no-store",
        })
        const result = await response.json()

        setLoading(false)

        if (!result.ok) {
          setError(result.error || "Failed to load executive memory")
          return
        }

        setMemory(result.memory)
      } catch {
        setLoading(false)
        setError("Failed to load executive memory")
      }
    }

    loadMemory()
  }, [])

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Memory · Phase 21.4</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Executive Memory</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          The platform&apos;s long-term memory — knowledge graph structure,
          executive history, and the decisions, lessons, risks, and
          opportunities that recur across operating cycles.
        </p>
        <div style={actionRowStyle}>
          <Link href="/admin/command-center" style={primaryLinkStyle}>
            Command Center
          </Link>
          <Link href="/admin/executive-timeline" style={secondaryLinkStyle}>
            Executive Timeline
          </Link>
          <Link href="/admin/knowledge-graph" style={secondaryLinkStyle}>
            Knowledge Graph
          </Link>
        </div>
      </section>

      {loading && <p style={{ marginTop: 28 }}>Loading executive memory...</p>}
      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}

      {memory && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Graph Nodes</p>
              <h2 style={{ fontSize: 36 }}>{memory.graph.totalNodes}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Graph Edges</p>
              <h2 style={{ fontSize: 36 }}>{memory.graph.totalEdges}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Relationship Density</p>
              <h2 style={{ fontSize: 36 }}>
                {memory.graph.relationshipDensity}
              </h2>
              <p style={subMetaStyle}>edges per node</p>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Entity Types</p>
              <h2 style={{ fontSize: 36 }}>
                {Object.keys(memory.graph.nodeCountsByType).length}
              </h2>
            </div>
          </section>

          <section style={twoColumnGrid}>
            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Most Connected Entities</h2>
              {memory.graph.mostConnected.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No graph connections yet.
                </p>
              ) : (
                <ul style={listStyle}>
                  {memory.graph.mostConnected.map((entity) => (
                    <li key={`${entity.entityType}-${entity.title}`}>
                      <strong>{entity.title}</strong>
                      <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                        {entity.entityType} — {entity.connections} connection
                        {entity.connections === 1 ? "" : "s"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Nodes by Type</h2>
              <ul style={listStyle}>
                {Object.entries(memory.graph.nodeCountsByType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <li key={type}>
                      {type}: <strong>{count}</strong>
                    </li>
                  ))}
              </ul>
            </div>
          </section>

          <section style={threeColumnGrid}>
            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Boardroom Sessions</h2>
              {memory.history.boardroomSessions.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No sessions yet.
                </p>
              ) : (
                <ul style={listStyle}>
                  {memory.history.boardroomSessions.map((item) => (
                    <li key={item.id}>
                      <strong>{item.title}</strong>
                      <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                        {formatDate(item.createdAt)}
                        {item.healthScore !== null
                          ? ` — health ${item.healthScore}/100`
                          : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Quarterly Reviews</h2>
              {memory.history.quarterlyReviews.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No reviews yet.
                </p>
              ) : (
                <ul style={listStyle}>
                  {memory.history.quarterlyReviews.map((item) => (
                    <li key={item.id}>
                      <strong>{item.title}</strong>
                      <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                        {formatDate(item.createdAt)}
                        {item.healthScore !== null
                          ? ` — health ${item.healthScore}/100`
                          : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Planning Cycles</h2>
              {memory.history.planningCycles.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No planning cycles yet.
                </p>
              ) : (
                <ul style={listStyle}>
                  {memory.history.planningCycles.map((item) => (
                    <li key={item.id}>
                      <strong>{item.title}</strong>
                      <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                        {formatDate(item.createdAt)}
                        {item.healthScore !== null
                          ? ` — health ${item.healthScore}/100`
                          : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section style={twoColumnGrid}>
            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Most Effective Decisions</h2>
              {memory.strategicMemory.mostEffectiveDecisions.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No decisions tracked yet.
                </p>
              ) : (
                <ul style={listStyle}>
                  {memory.strategicMemory.mostEffectiveDecisions.map((item) => (
                    <li key={item.decision}>
                      <strong>{item.decision}</strong>
                      <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                        {item.impactArea} — impact {item.impactScore}/100
                        (confidence {Math.round(item.confidence * 100)}%)
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Most Effective Lessons</h2>
              {memory.strategicMemory.mostEffectiveLessons.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No lessons recorded yet.
                </p>
              ) : (
                <ul style={listStyle}>
                  {memory.strategicMemory.mostEffectiveLessons.map((item) => (
                    <li key={item.title}>
                      <strong>{item.title}</strong>
                      <p style={{ margin: "4px 0 0", lineHeight: 1.5 }}>
                        {item.lesson}
                      </p>
                      <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                        {item.impactArea ?? "General"}
                        {item.effectiveness !== null
                          ? ` — effectiveness ${item.effectiveness}`
                          : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section style={twoColumnGrid}>
            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Recurring Risks</h2>
              {memory.strategicMemory.recurringRisks.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No recurring risks detected.
                </p>
              ) : (
                <ul style={listStyle}>
                  {memory.strategicMemory.recurringRisks.map((item) => (
                    <li key={item.text}>
                      {item.text}{" "}
                      <span style={{ color: "var(--muted)" }}>
                        ×{item.occurrences}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Recurring Opportunities</h2>
              {memory.strategicMemory.recurringOpportunities.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No recurring opportunities detected.
                </p>
              ) : (
                <ul style={listStyle}>
                  {memory.strategicMemory.recurringOpportunities.map((item) => (
                    <li key={item.text}>
                      {item.text}{" "}
                      <span style={{ color: "var(--muted)" }}>
                        ×{item.occurrences}
                      </span>
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

