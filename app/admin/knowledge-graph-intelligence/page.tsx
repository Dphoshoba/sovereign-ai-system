"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"

type GraphNodeInsight = {
  id: string
  entityType: string
  entityId: string
  title: string
  edgeCount: number
  category: string | null
  summary: string | null
}

type GraphLinkInsight = {
  decisionId: string
  decisionTitle: string
  lessonId: string
  lessonTitle: string
  relation: string
}

type KnowledgeGraphIntelligence = {
  totalNodes: number
  totalEdges: number
  mostConnectedNodes: GraphNodeInsight[]
  isolatedNodes: GraphNodeInsight[]
  revenueConnections: GraphNodeInsight[]
  deliveryConnections: GraphNodeInsight[]
  goalGaps: GraphNodeInsight[]
  decisionLessonLinks: GraphLinkInsight[]
  riskAreas: GraphNodeInsight[]
  opportunityAreas: GraphNodeInsight[]
  insights: string[]
  recommendations: string[]
}

export default function KnowledgeGraphIntelligencePage() {
  const [intelligence, setIntelligence] =
    useState<KnowledgeGraphIntelligence | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadIntelligence = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await fetch("/api/executive/knowledge-graph/intelligence", {
      cache: "no-store",
    })
    const result = await response.json()

    setLoading(false)

    if (!result.ok) {
      setError(result.error || "Failed to load knowledge graph intelligence")
      return
    }

    setIntelligence(result.intelligence)
  }, [])

  useEffect(() => {
    loadIntelligence()
  }, [loadIntelligence])

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Knowledge Graph Intelligence
        </h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Rule-based analysis of the executive knowledge graph — connection
          patterns, gaps, risks, and opportunities across the operating stack.
        </p>
        <div style={actionRowStyle}>
          <Link href="/admin/knowledge-graph" style={secondaryLinkStyle}>
            Knowledge Graph
          </Link>
          <Link href="/admin/boardroom" style={secondaryLinkStyle}>
            Executive Boardroom
          </Link>
          <Link href="/admin/decision-memory" style={secondaryLinkStyle}>
            Decision Memory
          </Link>
          <Link href="/admin/operations" style={secondaryLinkStyle}>
            Operations Center
          </Link>
        </div>
      </section>

      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}

      {loading && (
        <p style={{ marginTop: 28 }}>Loading knowledge graph intelligence...</p>
      )}

      {!loading && intelligence && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Total Nodes</p>
              <h2>{intelligence.totalNodes}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Total Edges</p>
              <h2>{intelligence.totalEdges}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Isolated Nodes</p>
              <h2>{intelligence.isolatedNodes.length}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Goal Gaps</p>
              <h2>{intelligence.goalGaps.length}</h2>
            </div>
          </section>

          <section style={panelGridStyle}>
            <div style={panelStyle}>
              <h2 style={sectionHeadingStyle}>Most Connected Nodes</h2>
              {renderNodeList(intelligence.mostConnectedNodes, true)}
            </div>

            <div style={panelStyle}>
              <h2 style={sectionHeadingStyle}>Isolated Nodes</h2>
              {renderNodeList(intelligence.isolatedNodes, false)}
            </div>
          </section>

          <section style={panelGridStyle}>
            <div style={panelStyle}>
              <h2 style={sectionHeadingStyle}>Revenue Connections</h2>
              {renderNodeList(intelligence.revenueConnections, true)}
            </div>

            <div style={panelStyle}>
              <h2 style={sectionHeadingStyle}>Delivery Connections</h2>
              {renderNodeList(intelligence.deliveryConnections, true)}
            </div>
          </section>

          <section style={panelGridStyle}>
            <div style={panelStyle}>
              <h2 style={sectionHeadingStyle}>Goal Gaps</h2>
              {renderNodeList(intelligence.goalGaps, false)}
            </div>

            <div style={panelStyle}>
              <h2 style={sectionHeadingStyle}>Decision Lesson Links</h2>
              {intelligence.decisionLessonLinks.length === 0 ? (
                <p style={mutedText}>No decision-to-lesson links in the graph.</p>
              ) : (
                <ul style={listStyle}>
                  {intelligence.decisionLessonLinks.map((link) => (
                    <li key={`${link.decisionId}-${link.lessonId}`}>
                      <strong>{link.decisionTitle}</strong> → {link.lessonTitle}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section style={panelGridStyle}>
            <div style={panelStyle}>
              <h2 style={sectionHeadingStyle}>Risk Areas</h2>
              {renderNodeList(intelligence.riskAreas, true)}
            </div>

            <div style={panelStyle}>
              <h2 style={sectionHeadingStyle}>Opportunity Areas</h2>
              {renderNodeList(intelligence.opportunityAreas, true)}
            </div>
          </section>

          <section style={panelGridStyle}>
            <div style={panelStyle}>
              <h2 style={sectionHeadingStyle}>Insights</h2>
              {intelligence.insights.length === 0 ? (
                <p style={mutedText}>No insights available yet.</p>
              ) : (
                <ul style={listStyle}>
                  {intelligence.insights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div style={panelStyle}>
              <h2 style={sectionHeadingStyle}>Recommendations</h2>
              {intelligence.recommendations.length === 0 ? (
                <p style={mutedText}>No recommendations available yet.</p>
              ) : (
                <ul style={listStyle}>
                  {intelligence.recommendations.map((item) => (
                    <li key={item}>{item}</li>
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

function renderNodeList(nodes: GraphNodeInsight[], showEdgeCount: boolean) {
  if (nodes.length === 0) {
    return <p style={mutedText}>None identified in the current graph.</p>
  }

  return (
    <ul style={listStyle}>
      {nodes.map((node) => (
        <li key={node.id}>
          <strong>{node.title}</strong> ({node.entityType})
          {showEdgeCount && ` — ${node.edgeCount} edge${node.edgeCount === 1 ? "" : "s"}`}
          {node.category && (
            <p style={itemDetailStyle}>Category: {node.category}</p>
          )}
          {node.summary && <p style={itemDetailStyle}>{node.summary}</p>}
        </li>
      ))}
    </ul>
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

const panelGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 16,
  marginTop: 28,
}

const panelStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const sectionHeadingStyle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 18,
}

const mutedText: React.CSSProperties = {
  color: "var(--muted)",
  margin: 0,
}

const listStyle: React.CSSProperties = {
  margin: "12px 0 0",
  paddingLeft: 20,
  lineHeight: 1.7,
}

const itemDetailStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "var(--muted)",
}
