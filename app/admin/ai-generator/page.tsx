"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AiGeneratorPage() {
  const router = useRouter()

  const [topic, setTopic] = useState("")
  const [category, setCategory] = useState("ai-automation")
  const [publishNow, setPublishNow] = useState(false)
  const [scheduledFor, setScheduledFor] = useState("")
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
        publishNow,
        status: publishNow ? "published" : "draft",
        scheduledFor,
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

      <p style={{ maxWidth: 760, color: "#555", lineHeight: 1.7 }}>
        Generate a full article with Markdown content, SEO title, SEO
        description, keywords, slug, and publishing status. Use draft mode for
        review, or publish immediately.
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

        <div className="space-y-2">
          <label className="text-sm font-medium">Schedule Publish Time</label>

          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
          />
        </div>

        <label style={{ display: "flex", gap: "8px", alignItems: "center", color: "#111827" }}>
          <input
            type="checkbox"
            checked={publishNow}
            onChange={(e) => setPublishNow(e.target.checked)}
          />
          Publish immediately
        </label>

        <button disabled={loading} style={buttonStyle}>
          {loading
            ? "Generating..."
            : publishNow
              ? "Generate & Publish"
              : "Generate Draft"}
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
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 24,
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 6,
  padding: 12,
  borderRadius: 10,
  border: "1px solid #ccc",
  fontSize: 16,
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
}