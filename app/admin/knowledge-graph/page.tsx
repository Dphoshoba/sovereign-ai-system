"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"

type KnowledgeNodeRecord = {
  id: string
  entityType: string
  entityId: string
  title: string
  summary: string | null
  category: string | null
  createdAt: string
}

type KnowledgeEdgeRecord = {
  id: string
  fromNodeId: string
  toNodeId: string
  relation: string
  weight: number
  createdAt: string
}

type KnowledgeGraphSummary = {
  totalNodes: number
  totalEdges: number
  nodeCountsByType: Record<string, number>
  edgeCountsByRelation: Record<string, number>
  recentNodes: KnowledgeNodeRecord[]
  recentEdges: KnowledgeEdgeRecord[]
}

type KnowledgeSearchEdge = KnowledgeEdgeRecord & {
  direction: "outgoing" | "incoming"
  connectedNodeId: string
  connectedNodeTitle: string
  connectedNodeType: string
}

type KnowledgeSearchResult = {
  node: KnowledgeNodeRecord
  connectedEdges: KnowledgeSearchEdge[]
}

export default function KnowledgeGraphPage() {
  const [summary, setSummary] = useState<KnowledgeGraphSummary | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<KnowledgeSearchResult[]>(
    []
  )
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [searching, setSearching] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadSummary = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await fetch("/api/executive/knowledge-graph", {
      cache: "no-store",
    })
    const result = await response.json()

    setLoading(false)

    if (!result.ok) {
      setError(result.error || "Failed to load knowledge graph")
      return
    }

    setSummary(result.summary)
  }, [])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  async function syncGraph() {
    setSyncing(true)
    setError(null)
    setMessage(null)

    const response = await fetch("/api/executive/knowledge-graph", {
      method: "POST",
    })
    const result = await response.json()

    setSyncing(false)

    if (!result.ok) {
      setError(result.error || "Failed to sync knowledge graph")
      return
    }

    setSummary(result.summary)
    setMessage(
      `Synced graph: ${result.result.nodesCreated} nodes created, ${result.result.nodesUpdated} updated, ${result.result.edgesCreated} edges created.`
    )
  }

  async function runSearch(event?: React.FormEvent) {
    event?.preventDefault()

    const query = searchQuery.trim()

    if (!query) {
      setSearchResults([])
      return
    }

    setSearching(true)
    setError(null)

    const response = await fetch(
      `/api/executive/knowledge-graph/search?q=${encodeURIComponent(query)}`,
      { cache: "no-store" }
    )
    const result = await response.json()

    setSearching(false)

    if (!result.ok) {
      setError(result.error || "Failed to search knowledge graph")
      return
    }

    setSearchResults(result.results ?? [])
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString("en-AU", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  function formatCounts(counts: Record<string, number>) {
    const entries = Object.entries(counts).sort(
      (left, right) => right[1] - left[1] || left[0].localeCompare(right[0])
    )

    if (entries.length === 0) {
      return null
    }

    return entries
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Executive Command</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Executive Knowledge Graph</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 820, lineHeight: 1.7 }}>
          Searchable graph connecting decisions, lessons, goals, initiatives,
          projects, clients, revenue, and outcomes across the executive stack.
        </p>
        <div style={actionRowStyle}>
          <button
            type="button"
            style={primaryButtonStyle}
            disabled={syncing}
            onClick={syncGraph}
          >
            {syncing ? "Syncing..." : "Sync Knowledge Graph"}
          </button>
          <Link href="/admin/executive-learning" style={secondaryLinkStyle}>
            Executive Learning
          </Link>
          <Link href="/admin/decision-memory" style={secondaryLinkStyle}>
            Decision Memory
          </Link>
          <Link href="/admin/boardroom" style={secondaryLinkStyle}>
            Executive Boardroom
          </Link>
          <Link href="/admin/operations" style={secondaryLinkStyle}>
            Operations Center
          </Link>
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <form onSubmit={runSearch} style={searchFormStyle}>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search nodes by title, summary, category, or type..."
            style={searchInputStyle}
          />
          <button type="submit" style={primaryButtonStyle} disabled={searching}>
            {searching ? "Searching..." : "Search"}
          </button>
        </form>
      </section>

      {message && <p style={successMessageStyle}>{message}</p>}
      {error && <p style={{ marginTop: 28, color: "#b91c1c" }}>{error}</p>}

      {loading && <p style={{ marginTop: 28 }}>Loading knowledge graph...</p>}

      {!loading && summary && (
        <>
          <section style={metricsGrid}>
            <div style={metricCard}>
              <p style={metaStyle}>Total Nodes</p>
              <h2>{summary.totalNodes}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Total Edges</p>
              <h2>{summary.totalEdges}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Entity Types</p>
              <h2>{Object.keys(summary.nodeCountsByType).length}</h2>
            </div>
            <div style={metricCard}>
              <p style={metaStyle}>Relation Types</p>
              <h2>{Object.keys(summary.edgeCountsByRelation).length}</h2>
            </div>
          </section>

          <section style={panelGridStyle}>
            <div style={panelStyle}>
              <h2 style={sectionHeadingStyle}>Node Counts by Type</h2>
              {formatCounts(summary.nodeCountsByType) ? (
                <ul style={listStyle}>
                  {formatCounts(summary.nodeCountsByType)?.map(([type, count]) => (
                    <li key={type}>
                      <strong>{type}</strong> — {count}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={mutedText}>No nodes synced yet.</p>
              )}
            </div>

            <div style={panelStyle}>
              <h2 style={sectionHeadingStyle}>Edge Counts by Relation</h2>
              {formatCounts(summary.edgeCountsByRelation) ? (
                <ul style={listStyle}>
                  {formatCounts(summary.edgeCountsByRelation)?.map(
                    ([relation, count]) => (
                      <li key={relation}>
                        <strong>{relation}</strong> — {count}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p style={mutedText}>No edges synced yet.</p>
              )}
            </div>
          </section>

          <section style={panelGridStyle}>
            <div style={panelStyle}>
              <h2 style={sectionHeadingStyle}>Recent Nodes</h2>
              {summary.recentNodes.length === 0 ? (
                <p style={mutedText}>No nodes yet. Run a sync to build the graph.</p>
              ) : (
                <ul style={listStyle}>
                  {summary.recentNodes.map((node) => (
                    <li key={node.id}>
                      <strong>{node.title}</strong> ({node.entityType})
                      {node.category && ` — ${node.category}`}
                      <p style={itemDetailStyle}>
                        {node.summary ?? "No summary recorded."}
                      </p>
                      <p style={itemMetaStyle}>{formatDate(node.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={panelStyle}>
              <h2 style={sectionHeadingStyle}>Recent Edges</h2>
              {summary.recentEdges.length === 0 ? (
                <p style={mutedText}>No edges yet. Run a sync to build the graph.</p>
              ) : (
                <ul style={listStyle}>
                  {summary.recentEdges.map((edge) => (
                    <li key={edge.id}>
                      <strong>{edge.relation}</strong>
                      <p style={itemDetailStyle}>
                        {edge.fromNodeId.slice(0, 8)}... →{" "}
                        {edge.toNodeId.slice(0, 8)}...
                      </p>
                      <p style={itemMetaStyle}>{formatDate(edge.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}

      {searchResults.length > 0 && (
        <section style={{ marginTop: 28 }}>
          <h2>Search Results</h2>
          <div style={resultsGridStyle}>
            {searchResults.map((result) => (
              <article key={result.node.id} style={resultCardStyle}>
                <h3 style={resultTitleStyle}>{result.node.title}</h3>
                <p style={itemDetailStyle}>
                  <strong>Entity type:</strong> {result.node.entityType}
                </p>
                <p style={itemDetailStyle}>
                  <strong>Category:</strong> {result.node.category ?? "—"}
                </p>
                <p style={itemDetailStyle}>
                  <strong>Summary:</strong>{" "}
                  {result.node.summary ?? "No summary recorded."}
                </p>

                <div style={{ marginTop: 12 }}>
                  <strong>Connected Relations</strong>
                  {result.connectedEdges.length === 0 ? (
                    <p style={mutedText}>No connected edges found.</p>
                  ) : (
                    <ul style={listStyle}>
                      {result.connectedEdges.map((edge) => (
                        <li key={edge.id}>
                          {edge.direction === "outgoing" ? "→" : "←"}{" "}
                          <strong>{edge.relation}</strong> —{" "}
                          {edge.connectedNodeTitle} ({edge.connectedNodeType})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {!searching && searchQuery.trim() && searchResults.length === 0 && (
        <p style={{ marginTop: 28, color: "var(--muted)" }}>
          No nodes matched your search.
        </p>
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
  display: "inline-flex",
  alignItems: "center",
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  background: "var(--button-background)",
  color: "var(--button-foreground)",
  fontWeight: 600,
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
}

const searchFormStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
}

const searchInputStyle: React.CSSProperties = {
  flex: "1 1 280px",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--card-background)",
  fontSize: 14,
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
  margin: "8px 0 0",
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

const itemMetaStyle: React.CSSProperties = {
  margin: "4px 0 0",
  color: "var(--muted)",
  fontSize: 12,
}

const resultsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 16,
  marginTop: 16,
}

const resultCardStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 20,
}

const resultTitleStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 18,
}
