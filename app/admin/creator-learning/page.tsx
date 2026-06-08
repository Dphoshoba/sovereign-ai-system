"use client"

import { useEffect, useMemo, useState } from "react"

type LearningMemory = {
  id: string
  type: string
  title: string
  insight: string
  confidence: number
  priority: string
  status: string
  createdAt: string
}

type LearningRun = {
  id: string
  summary: string | null
  status: string
  createdAt: string
}

export default function CreatorLearningPage() {
  const [memories, setMemories] = useState<LearningMemory[]>([])
  const [runs, setRuns] = useState<LearningRun[]>([])
  const [selected, setSelected] = useState<LearningMemory | null>(null)
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState("all")

  async function loadLearning() {
    const response = await fetch("/api/creator-learning")
    const result = await response.json()

    if (result.ok) {
      setMemories(result.memories)
      setRuns(result.runs)
    }
  }

  async function runLearning() {
    setLoading(true)

    const response = await fetch("/api/creator-learning", {
      method: "POST",
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Learning run failed")
      return
    }

    await loadLearning()
  }

  async function saveMemory() {
    if (!selected) return

    setLoading(true)

    const response = await fetch("/api/creator-learning/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(selected),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to update memory")
      return
    }

    await loadLearning()
    setSelected(result.memory)
  }

  useEffect(() => {
    loadLearning()
  }, [])

  const memoryTypes = Array.from(new Set(memories.map((memory) => memory.type)))

  const filteredMemories = useMemo(() => {
    if (typeFilter === "all") return memories
    return memories.filter((memory) => memory.type === typeFilter)
  }, [memories, typeFilter])

  const highPriority = memories.filter(
    (memory) => memory.priority === "high" && memory.status === "active"
  ).length

  const activeMemories = memories.filter(
    (memory) => memory.status === "active"
  ).length

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Recursive Intelligence</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Creator Learning + Strategic Memory
        </h1>

        <p style={{ color: "var(--hero-muted)", maxWidth: 880, lineHeight: 1.7 }}>
          Learn from leads, audits, proposals, revenue, automations and outcomes
          to build durable strategic memory for Echoes & Visions.
        </p>
      </section>

      <section style={metricsGrid}>
        <Metric label="Active Memories" value={activeMemories.toString()} />
        <Metric label="High Priority" value={highPriority.toString()} />
        <Metric label="Learning Runs" value={runs.length.toString()} />
      </section>

      <section style={toolbarStyle}>
        <button disabled={loading} onClick={runLearning} style={buttonStyle}>
          {loading ? "Learning..." : "Run Recursive Learning"}
        </button>

        <button disabled={loading} onClick={loadLearning} style={secondaryButton}>
          Refresh
        </button>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={inputStyle}
        >
          <option value="all">All Types</option>
          {memoryTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </section>

      <section style={gridTwo}>
        <section>
          <h2>Strategic Memories</h2>

          <div style={{ display: "grid", gap: 14 }}>
            {filteredMemories.map((memory) => (
              <button
                key={memory.id}
                onClick={() => setSelected(memory)}
                style={{
                  ...cardButton,
                  border:
                    selected?.id === memory.id
                      ? "2px solid #4f46e5"
                      : "1px solid #ddd",
                }}
              >
                <p style={metaStyle}>
                  {memory.type} · {memory.priority} · {memory.status}
                </p>

                <h3>{memory.title}</h3>

                <p style={{ lineHeight: 1.7, color: "var(--muted)" }}>
                  {memory.insight}
                </p>

                <p style={{ color: "var(--muted)" }}>
                  Confidence: {Math.round(memory.confidence * 100)}%
                </p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2>Memory Editor</h2>

          {selected ? (
            <div style={editorCard}>
              <label>
                Title
                <input
                  value={selected.title}
                  onChange={(e) =>
                    setSelected({ ...selected, title: e.target.value })
                  }
                  style={inputStyle}
                />
              </label>

              <label>
                Insight
                <textarea
                  rows={8}
                  value={selected.insight}
                  onChange={(e) =>
                    setSelected({ ...selected, insight: e.target.value })
                  }
                  style={inputStyle}
                />
              </label>

              <label>
                Priority
                <select
                  value={selected.priority}
                  onChange={(e) =>
                    setSelected({ ...selected, priority: e.target.value })
                  }
                  style={inputStyle}
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </label>

              <label>
                Status
                <select
                  value={selected.status}
                  onChange={(e) =>
                    setSelected({ ...selected, status: e.target.value })
                  }
                  style={inputStyle}
                >
                  <option value="active">active</option>
                  <option value="archived">archived</option>
                  <option value="rejected">rejected</option>
                </select>
              </label>

              <label>
                Confidence
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={selected.confidence}
                  onChange={(e) =>
                    setSelected({
                      ...selected,
                      confidence: Number(e.target.value),
                    })
                  }
                  style={inputStyle}
                />
              </label>

              <button disabled={loading} onClick={saveMemory} style={buttonStyle}>
                {loading ? "Saving..." : "Save Memory"}
              </button>
            </div>
          ) : (
            <div style={editorCard}>Select a memory to edit.</div>
          )}

          <h2 style={{ marginTop: 30 }}>Recent Learning Runs</h2>

          <div style={{ display: "grid", gap: 14 }}>
            {runs.map((run) => (
              <article key={run.id} style={cardStyle}>
                <p style={metaStyle}>{run.status}</p>
                <p style={{ lineHeight: 1.7 }}>{run.summary}</p>
                <p style={{ color: "var(--muted)" }}>
                  {new Date(run.createdAt).toLocaleString("en-AU")}
                </p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={metricCard}>
      <p style={metaStyle}>{label}</p>
      <h2>{value}</h2>
    </div>
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

const metricsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
  marginTop: 28,
}

const metricCard: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const toolbarStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto auto 1fr",
  gap: 12,
  marginTop: 28,
}

const gridTwo: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
  gap: 24,
  marginTop: 34,
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 6,
  marginBottom: 14,
  padding: 12,
  borderRadius: 10,
  border: "1px solid var(--border)",
  fontSize: 15,
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  cursor: "pointer",
  fontWeight: "bold",
}

const secondaryButton: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "1px solid #111",
  background: "var(--card-background)",
  color: "var(--foreground)",
  cursor: "pointer",
  fontWeight: "bold",
}

const cardButton: React.CSSProperties = {
  textAlign: "left",
  background: "var(--card-background)",
  borderRadius: 18,
  padding: 22,
  cursor: "pointer",
}

const editorCard: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const cardStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 22,
}

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "var(--muted)",
  fontSize: 13,
  margin: 0,
}