"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AiGeneratorPage() {
  const router = useRouter()

  const [topic, setTopic] = useState("")
  const [category, setCategory] = useState("ai-automation")
  const [loading, setLoading] = useState(false)
  
  async function generateArticle(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)

    const response = await fetch("/api/ai/generate-article", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic,
        category,
      }),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to generate article")
      return
    }

    router.push("/admin/articles")
    router.refresh()
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>AI Auto-Publishing Workflow</h1>

      <p style={{ maxWidth: 760, color: "var(--muted)", lineHeight: 1.7 }}>
        Generate a full article with Markdown content, SEO metadata, and a
        research audit. Generated articles enter human review as
        review-required. They are not approved, scheduled, or published by this
        workflow.
      </p>

      <form onSubmit={generateArticle} style={formStyle}>
        <label>
          Article Topic
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            placeholder="Example: How AI agents help small businesses save time"
            style={inputStyle}
          />
        </label>

        <label>
          Category
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            style={inputStyle}
          />
        </label>

        <button disabled={loading} style={buttonStyle}>
          {loading ? "Generating..." : "Generate for Review"}
        </button>
      </form>
    </main>
  )
}

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: 16,
  maxWidth: 760,
  marginTop: 24,
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 6,
  padding: 12,
  borderRadius: 10,
  border: "1px solid var(--border)",
  fontSize: 16,
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
