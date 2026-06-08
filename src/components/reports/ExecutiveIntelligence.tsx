"use client"

import { useEffect, useState } from "react"

type Intelligence = {
  growthScore: number
  momentum?: string
  summary: string
  strengths: string[]
  risks: string[]
  opportunities?: string[]
  recommendations: string[]
}

export default function ExecutiveIntelligence() {
  const [data, setData] = useState<Intelligence | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/reports/executive-intelligence")
      .then((res) => res.json())
      .then((result) => {
        setData(result.intelligence)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <section style={cardStyle}>
        <h2>Executive Intelligence</h2>
        <p>Analyzing platform performance...</p>
      </section>
    )
  }

  if (!data) {
    return (
      <section style={cardStyle}>
        <h2>Executive Intelligence</h2>
        <p>Unable to load analysis.</p>
      </section>
    )
  }

  return (
    <section style={cardStyle}>
      <h2>Executive Intelligence</h2>

      <div style={scoreStyle}>
        Growth Score: {data.growthScore}/100
      </div>

      {data.momentum && (
        <p>
          <strong>Momentum:</strong> {data.momentum}
        </p>
      )}

      <p>{data.summary}</p>

      <h3>Strengths</h3>
      <ul>
        {data.strengths.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      <h3>Risks</h3>
      <ul>
        {data.risks.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      {data.opportunities && data.opportunities.length > 0 && (
        <>
          <h3>Opportunities</h3>
          <ul>
            {data.opportunities.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </>
      )}

      <h3>Recommendations</h3>
      <ol>
        {data.recommendations.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ol>
    </section>
  )
}

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "20px",
  marginBottom: "20px",
}

const scoreStyle: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: "bold",
  marginBottom: "16px",
}