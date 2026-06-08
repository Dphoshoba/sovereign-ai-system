"use client"

import { useState } from "react"

type Strategy = {
  pillarTopics?: {
    title: string
    reason: string
  }[]
  articleIdeas?: {
    title: string
    category: string
    excerpt: string
    targetKeywords: string[]
    internalLinkTargets: string[]
  }[]
  contentGaps?: string[]
  nextBestArticle?: {
    title: string
    category: string
    reason: string
    targetKeywords: string[]
  }
}

export default function ContentStrategyPage() {
  const [loading, setLoading] = useState(false)
  const [strategy, setStrategy] = useState<Strategy | null>(null)

  async function generateStrategy() {
    setLoading(true)

    const response = await fetch("/api/ai/content-strategy", {
      method: "POST",
    })

    const result = await response.json()

    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to generate strategy")
      return
    }

    setStrategy(result.strategy)
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>AI Content Strategy Engine</h1>

      <p style={{ maxWidth: 760, color: "var(--muted)", lineHeight: 1.7 }}>
        Generate pillar topics, article ideas, keyword clusters, content gaps,
        and the next best article for Echoes & Visions.
      </p>

      <button onClick={generateStrategy} disabled={loading} style={buttonStyle}>
        {loading ? "Thinking..." : "Generate Content Strategy"}
      </button>

      {strategy ? (
        <section style={{ marginTop: 34, display: "grid", gap: 24 }}>
          {strategy.nextBestArticle ? (
            <div style={featuredCard}>
              <p style={labelStyle}>Next Best Article</p>
              <h2>{strategy.nextBestArticle.title}</h2>
              <p>{strategy.nextBestArticle.reason}</p>
              <p>
                <strong>Category:</strong> {strategy.nextBestArticle.category}
              </p>
              <p>
                <strong>Keywords:</strong>{" "}
                {strategy.nextBestArticle.targetKeywords?.join(", ")}
              </p>
            </div>
          ) : null}

          <div style={cardStyle}>
            <h2>Pillar Topics</h2>
            {strategy.pillarTopics?.map((topic, index) => (
              <div key={index} style={itemStyle}>
                <h3>{topic.title}</h3>
                <p>{topic.reason}</p>
              </div>
            ))}
          </div>

          <div style={cardStyle}>
            <h2>Article Ideas</h2>
            {strategy.articleIdeas?.map((idea, index) => (
              <div key={index} style={itemStyle}>
                <h3>{idea.title}</h3>
                <p>{idea.excerpt}</p>
                <p>
                  <strong>Category:</strong> {idea.category}
                </p>
                <p>
                  <strong>Keywords:</strong> {idea.targetKeywords?.join(", ")}
                </p>
                <p>
                  <strong>Internal links:</strong>{" "}
                  {idea.internalLinkTargets?.join(", ")}
                </p>
              </div>
            ))}
          </div>

          <div style={cardStyle}>
            <h2>Content Gaps</h2>
            <ul>
              {strategy.contentGaps?.map((gap, index) => (
                <li key={index} style={{ marginBottom: 8 }}>
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </main>
  )
}

const buttonStyle: React.CSSProperties = {
  marginTop: 20,
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  cursor: "pointer",
  fontWeight: "bold",
}

const cardStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const featuredCard: React.CSSProperties = {
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  borderRadius: 18,
  padding: 28,
}

const itemStyle: React.CSSProperties = {
  borderTop: "1px solid #eee",
  paddingTop: 16,
  marginTop: 16,
}

const labelStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "var(--muted)",
}