"use client"

import { useEffect, useState } from "react"

type PlanningResponse = {
  categories: Record<string, number>
  plan: {
    nextArticleTitle: string
    nextNewsletterTopic: string
    underrepresentedCategory: string
    recommendedContentPillar: string
    reasoning: string
  }
}

export default function ContentPlanning() {
  const [data, setData] = useState<PlanningResponse | null>(null)

  useEffect(() => {
    fetch("/api/planning")
      .then((res) => res.json())
      .then((result) => setData(result))
  }, [])

  if (!data) return null

  async function createDraft() {
    if (!data) return

    const response = await fetch("/api/planning/create-draft", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: data.plan.nextArticleTitle,
        category: data.plan.underrepresentedCategory,
        excerpt: data.plan.reasoning,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      alert(result.error || "Draft creation failed")
      return
    }

    alert("Draft created successfully.")
  }

  return (
    <section style={cardStyle}>
      <h2>Content Planning AI</h2>

      <p>
        <strong>Next Article:</strong> {data.plan.nextArticleTitle}
      </p>

      <p>
        <strong>Next Newsletter:</strong> {data.plan.nextNewsletterTopic}
      </p>

      <p>
        <strong>Category Gap:</strong>{" "}
        {data.plan.underrepresentedCategory}
      </p>

      <p>
        <strong>Recommended Pillar:</strong>{" "}
        {data.plan.recommendedContentPillar}
      </p>

      <p>
        <strong>Reasoning:</strong> {data.plan.reasoning}
      </p>

      <button onClick={createDraft} style={buttonStyle}>
        Create Draft From Plan
      </button>

      <h3>Category Balance</h3>

      <ul>
        {Object.entries(data.categories).map(([category, count]) => (
          <li key={category}>
            {category}: {count}
          </li>
        ))}
      </ul>
    </section>
  )
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "20px",
  marginBottom: "20px",
}

const buttonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#111",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: "12px",
}
