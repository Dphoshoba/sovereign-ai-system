"use client"

import { useEffect, useState } from "react"
import {
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  PageShell,
  StatusBadge,
} from "@/components/executive-ui"

export default function KnowledgeGraphPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [question, setQuestion] = useState(
    "What is the most important institutional memory right now?"
  )
  const [queryResult, setQueryResult] = useState<any>(null)
  const [memoryTitle, setMemoryTitle] = useState("")
  const [memoryContent, setMemoryContent] = useState("")

  async function loadData() {
    const res = await fetch("/api/knowledge-graph")
    const result = await res.json()

    if (result.ok) setData(result)
  }

async function runSynthesis() {
  setLoading(true)

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120000)

    const res = await fetch("/api/knowledge-graph", {
      method: "POST",
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const result = await res.json()

    if (!result.ok) {
      alert(result.error || "Knowledge synthesis failed")
      return
    }

    await loadData()
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "Knowledge synthesis stopped unexpectedly"
    )
  } finally {
    setLoading(false)
  }
}

  async function queryMemory() {
    if (!question.trim()) return

    setLoading(true)

    const res = await fetch("/api/knowledge-graph/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Memory query failed")
      return
    }

    setQueryResult(result.result)
    await loadData()
  }

async function addMemory() {
  if (!memoryTitle.trim() || !memoryContent.trim()) return

  setLoading(true)

  try {
    const res = await fetch("/api/knowledge-graph/record", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: memoryTitle,
        content: memoryContent,
        recordType: "manual-memory",
        importance: 80,
        tags: ["manual", "institutional-memory"],
      }),
    })

    const result = await res.json()

    if (!result.ok) {
      alert(result.error || "Memory creation failed")
      return
    }

    setMemoryTitle("")
    setMemoryContent("")
    await loadData()
  } catch (error) {
    alert(error instanceof Error ? error.message : "Memory creation failed")
  } finally {
    setLoading(false)
  }
}

  useEffect(() => {
    loadData()
  }, [])

  const records = data?.records || []
  const indexes = data?.indexes || []
  const nodes = data?.nodes || []
  const edges = data?.edges || []
  const queries = data?.queries || []
  const latest = data?.runs?.[0]

  return (
    <PageShell
      eyebrow="Semantic Memory Fabric"
      title="Sovereign Knowledge Graph"
      description="Create tenant-scoped semantic memory, retrieval-ready knowledge records, graph nodes, relationships and institutional intelligence queries."
    >
      <ExecutiveGrid min={220}>
        <MetricCard label="Knowledge Records" value={records.length} />
        <MetricCard label="Vector Indexes" value={indexes.length} />
        <MetricCard label="Graph Nodes" value={nodes.length} />
        <MetricCard label="Graph Edges" value={edges.length} />
        <MetricCard label="Memory Queries" value={queries.length} />
        <MetricCard label="Graph Health" value={latest?.graphHealth || 0} />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Knowledge Graph Runtime" eyebrow="Memory synthesis">
            <button disabled={loading} onClick={runSynthesis} style={buttonStyle}>
              {loading ? "Synthesizing..." : "Run Knowledge Graph Synthesis"}
            </button>

            {latest ? (
              <div style={cardStyle}>
                <StatusBadge status={latest.status} />
                <h3>{latest.title}</h3>
                <p>{latest.summary}</p>
                <p style={{ color: "#666" }}>
                  Graph {latest.graphHealth}/100 · Memory {latest.memoryHealth}
                  /100 · Retrieval {latest.retrievalHealth}/100
                </p>
                <pre style={preStyle}>{JSON.stringify(latest.findings, null, 2)}</pre>
              </div>
            ) : null}
          </ExecutiveCard>

          <ExecutiveCard title="Add Manual Memory" eyebrow="Institutional memory">
            <input
              value={memoryTitle}
              onChange={(e) => setMemoryTitle(e.target.value)}
              placeholder="Memory title"
              style={inputStyle}
            />

            <textarea
              value={memoryContent}
              onChange={(e) => setMemoryContent(e.target.value)}
              placeholder="Memory content"
              rows={6}
              style={inputStyle}
            />

            <button disabled={loading} onClick={addMemory} style={buttonStyle}>
              Store Memory
            </button>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Query Semantic Memory" eyebrow="Institutional retrieval">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            style={inputStyle}
          />

          <button disabled={loading} onClick={queryMemory} style={buttonStyle}>
            Query Memory
          </button>

          {queryResult ? (
            <div style={cardStyle}>
              <h3>Answer</h3>
              <p style={{ lineHeight: 1.8 }}>{queryResult.answer}</p>
              <p style={{ color: "#666" }}>
                Confidence {Math.round((queryResult.confidence || 0) * 100)}%
              </p>

              <h4>Reasoning Path</h4>
              <ul style={{ lineHeight: 1.8 }}>
                {(queryResult.reasoningPath || []).map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>

              <h4>Matched Nodes</h4>
              <ul style={{ lineHeight: 1.8 }}>
                {(queryResult.matchedNodes || []).map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </ExecutiveCard>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Knowledge Records" eyebrow="Semantic memory">
            <div style={{ display: "grid", gap: 12 }}>
              {records.map((record: any) => (
                <div key={record.id} style={cardStyle}>
                  <StatusBadge status={record.recordType} />
                  <h3>{record.title}</h3>
                  <p>{record.content}</p>
                  <p style={{ color: "#666" }}>
                    {record.sourceLayer || "manual"} · Importance{" "}
                    {record.importance}/100
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Graph Nodes" eyebrow="Knowledge entities">
            <div style={{ display: "grid", gap: 12 }}>
              {nodes.map((node: any) => (
                <div key={node.id} style={cardStyle}>
                  <StatusBadge status={node.nodeType} />
                  <h3>{node.name}</h3>
                  <p>{node.summary}</p>
                  <p style={{ color: "#666" }}>
                    Importance {node.importance}/100
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Graph Edges" eyebrow="Knowledge relationships">
            <div style={{ display: "grid", gap: 12 }}>
              {edges.map((edge: any) => (
                <div key={edge.id} style={cardStyle}>
                  <StatusBadge status={edge.relationType} />
                  <p>{edge.summary}</p>
                  <p style={{ color: "#666" }}>
                    Strength {Math.round((edge.strength || 0) * 100)}%
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Vector Indexes" eyebrow="Retrieval scaffold">
            <div style={{ display: "grid", gap: 12 }}>
              {indexes.map((index: any) => (
                <div key={index.id} style={cardStyle}>
                  <StatusBadge status={index.status} />
                  <h3>{index.embeddingModel}</h3>
                  <p>{index.contentPreview}</p>
                  <p style={{ color: "#666" }}>
                    Dimensions {index.dimensions} · Hash{" "}
                    {index.vectorHash?.slice(0, 14)}...
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>
    </PageShell>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid #ddd",
  padding: 12,
  marginBottom: 12,
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 12,
  border: "none",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 16,
  padding: 18,
  background: "#fafafa",
}

const preStyle: React.CSSProperties = {
  background: "#111",
  color: "#fff",
  padding: 14,
  borderRadius: 14,
  overflowX: "auto",
  whiteSpace: "pre-wrap",
}