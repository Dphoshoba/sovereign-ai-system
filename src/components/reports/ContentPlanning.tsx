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
