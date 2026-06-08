"use client"

import { useState } from "react"

type PlannerResult = {
  categoryCounts: Record<string, number>
  idea: {
    title: string
    excerpt: string
    reasoning: string
  }
  draft: {
    id: string
    title: string
    category: string
    status: string
  }
}

export function PlannerRunner() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PlannerResult | null>(null)

  async function runPlanner() {
    setLoading(true)

    const response = await fetch("/api/workers/weekly-planner")
    const data = await response.json()

    setLoading(false)

    if (!response.ok) {
      alert(data.error || "Planner failed")
      return
    }

    setResult(data)
  }

  return (
    <section style={cardStyle}>
      <h2>Run Weekly Planner</h2>

      <button onClick={runPlanner} disabled={loading} style={buttonStyle}>
        {loading ? "Planning..." : "Create Weekly Draft"}
      </button>

      {result && (
        <div style={{ marginTop: "20px" }}>
          <h3>Draft Created</h3>
          <p><strong>Title:</strong> {result.draft.title}</p>
          <p><strong>Category:</strong> {result.draft.category}</p>
          <p><strong>Status:</strong> {result.draft.status}</p>

          <h3>Reasoning</h3>
          <p>{result.idea.reasoning}</p>

          <h3>Category Balance</h3>
          <ul>
            {Object.entries(result.categoryCounts).map(([category, count]) => (
              <li key={category}>
                {category}: {count}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "20px",
}

const buttonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  fontWeight: "bold",
  cursor: "pointer",
}