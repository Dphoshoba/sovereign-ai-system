"use client"

import { useEffect, useState } from "react"
import {
  PageShell,
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  StatusBadge,
} from "@/components/executive-ui"

type Entity = {
  id: string
  entityType: string
  name: string
  summary: string | null
  importance: number
  status: string
}

type Relation = {
  id: string
  relationType: string
  strength: number
  summary: string | null
}

type Run = {
  id: string
  title: string
  status: string
  summary: string | null
  graphHealth: number
  findings: any
  createdAt: string
}

type Insight = {
  id: string
  title: string
  insight: string
  insightType: string
  priority: string
  confidence: number
}

type QueryResult = {
  answer: string
  keyEntities: string[]
  relationships: string[]
  risks: string[]
  recommendedNextSteps: string[]
}

export default function CognitiveFabricPage() {
  const [entities, setEntities] = useState<Entity[]>([])
  const [relations, setRelations] = useState<Relation[]>([])
  const [runs, setRuns] = useState<Run[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [question, setQuestion] = useState("What causal chains are most important right now?")
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const res = await fetch("/api/cognitive-fabric")
    const result = await res.json()

    if (result.ok) {
      setEntities(result.entities)
      setRelations(result.relations)
      setRuns(result.runs)
      setInsights(result.insights)
    }
  }

  async function runSynthesis() {
    setLoading(true)

    const res = await fetch("/api/cognitive-fabric", {
      method: "POST",
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Cognitive synthesis failed")
      return
    }

    await loadData()
  }

  async function queryGraph() {
    if (!question.trim()) return

    setLoading(true)

    const res = await fetch("/api/cognitive-fabric/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Graph query failed")
      return
    }

    setQueryResult(result.result)
  }

  useEffect(() => {
    loadData()
  }, [])

  const latestRun = runs[0]
  const highImportance = entities.filter((e) => e.importance >= 80).length
  const strongRelations = relations.filter((r) => r.strength >= 0.75).length
  const highInsights = insights.filter((i) => i.priority === "high").length

  return (
    <PageShell
      eyebrow="Collective Organizational Cognition"
      title="Unified Cognitive Fabric"
      description="Build a semantic intelligence graph across events, workflows, strategy, signals, governance, memory and operational systems."
    >
      <ExecutiveGrid min={220}>
        <MetricCard label="Entities" value={entities.length} />
        <MetricCard label="Relations" value={relations.length} />
        <MetricCard label="High Importance" value={highImportance} />
        <MetricCard label="Strong Relations" value={strongRelations} />
        <MetricCard label="High Insights" value={highInsights} />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Cognitive Synthesis Control" eyebrow="Graph builder">
          <button disabled={loading} onClick={runSynthesis} style={buttonStyle}>
            {loading ? "Synthesizing..." : "Run Cognitive Synthesis"}
          </button>

          {latestRun ? (
            <div style={cardStyle}>
              <StatusBadge status={latestRun.status} />
              <h3>{latestRun.title}</h3>
              <p>{latestRun.summary}</p>
              <p style={{ color: "#777", fontSize: 12 }}>
                Graph Health {latestRun.graphHealth}/100 ·{" "}
                {new Date(latestRun.createdAt).toLocaleString("en-AU")}
              </p>
            </div>
          ) : null}
        </ExecutiveCard>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Ask the Cognitive Graph" eyebrow="Cross-system reasoning">
            <textarea
              rows={5}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              style={inputStyle}
            />

            <button disabled={loading} onClick={queryGraph} style={buttonStyle}>
              {loading ? "Querying..." : "Query Cognitive Graph"}
            </button>

            {queryResult ? (
              <div style={cardStyle}>
                <h3>Answer</h3>
                <p style={{ lineHeight: 1.8 }}>{queryResult.answer}</p>

                <Section title="Key Entities" items={queryResult.keyEntities} />
                <Section title="Relationships" items={queryResult.relationships} />
                <Section title="Risks" items={queryResult.risks} />
                <Section
                  title="Recommended Next Steps"
                  items={queryResult.recommendedNextSteps}
                />
              </div>
            ) : null}
          </ExecutiveCard>

          <ExecutiveCard title="Cognitive Insights" eyebrow="Synthesis outputs">
            <div style={{ display: "grid", gap: 12 }}>
              {insights.map((insight) => (
                <div key={insight.id} style={cardStyle}>
                  <StatusBadge status={insight.priority} />
                  <h3>{insight.title}</h3>
                  <p>{insight.insight}</p>
                  <p style={{ color: "#666" }}>
                    {insight.insightType} · Confidence{" "}
                    {Math.round(insight.confidence * 100)}%
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Cognitive Entities" eyebrow="Semantic nodes">
            <div style={{ display: "grid", gap: 12 }}>
              {entities.map((entity) => (
                <div key={entity.id} style={cardStyle}>
                  <StatusBadge status={entity.entityType} />
                  <h3>{entity.name}</h3>
                  <p>{entity.summary}</p>
                  <p style={{ color: "#666" }}>
                    Importance {entity.importance}/100
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Cognitive Relations" eyebrow="Semantic edges">
            <div style={{ display: "grid", gap: 12 }}>
              {relations.map((relation) => (
                <div key={relation.id} style={cardStyle}>
                  <StatusBadge status={relation.relationType} />
                  <p>{relation.summary}</p>
                  <p style={{ color: "#666" }}>
                    Strength {Math.round(relation.strength * 100)}%
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

function Section({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null

  return (
    <>
      <h4>{title}</h4>
      <ul style={{ lineHeight: 1.8 }}>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid #ddd",
  padding: 12,
  marginBottom: 12,
  fontFamily: "inherit",
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
  marginTop: 14,
  background: "#fafafa",
}