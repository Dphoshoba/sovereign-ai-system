"use client"

import { useState } from "react"

export default function AutonomousPipelinePage() {
  const [topic, setTopic] = useState("")
  const [category, setCategory] = useState("ai-automation")
  const [mode, setMode] = useState("draft")
  const [scheduledFor, setScheduledFor] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function runPipeline(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setResult(null)

    const response = await fetch("/api/ai/autonomous-pipeline", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic,
        category,
        mode,
        scheduledFor,
      }),
    })

    const data = await response.json()
    setLoading(false)

    if (!data.ok) {
      alert(data.error || "Pipeline failed")
      return
    }

    setResult(data)
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>Autonomous Publishing Pipeline</h1>

      <p style={{ maxWidth: 780, color: "#555", lineHeight: 1.7 }}>
        Generate a complete publishing package: article, SEO metadata, thumbnail
        idea, social posts and newsletter copy. Keep it as a draft, publish now
        or schedule it.
      </p>

      <form onSubmit={runPipeline} style={formStyle}>
        <label>
          Topic
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            placeholder="Example: How AI agents help churches communicate better"
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

        <label>
          Publishing Mode
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            style={inputStyle}
          >
            <option value="draft">Save as Draft</option>
            <option value="publish">Publish Immediately</option>
            <option value="schedule">Schedule for Later</option>
          </select>
        </label>

        {mode === "schedule" ? (
          <label>
            Scheduled Date
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              required
              style={inputStyle}
            />
          </label>
        ) : null}

        <button disabled={loading} style={buttonStyle}>
          {loading ? "Pipeline Running..." : "Run Pipeline"}
        </button>
      </form>

      {result ? (
        <section style={{ marginTop: 34, display: "grid", gap: 22 }}>
          <div style={cardStyle}>
            <h2>Article Created</h2>
            <p>
              <strong>Title:</strong> {result.article.title}
            </p>
            <p>
              <strong>Status:</strong> {result.article.status}
            </p>
            <p>
              <strong>Slug:</strong> /blog/{result.article.slug}
            </p>
          </div>

          <div style={cardStyle}>
            <h2>Thumbnail</h2>
            <p>
              <strong>Text:</strong> {result.assets.thumbnailText}
            </p>
            <p style={{ whiteSpace: "pre-wrap" }}>
              <strong>Prompt:</strong> {result.assets.thumbnailPrompt}
            </p>
          </div>

          <div style={cardStyle}>
            <h2>Social Posts</h2>
            {result.assets.socialPosts?.map((post: string, index: number) => (
              <div key={index} style={itemStyle}>
                {post}
              </div>
            ))}
          </div>

          <div style={cardStyle}>
            <h2>Newsletter</h2>
            <p>
              <strong>Subject:</strong> {result.assets.newsletterSubject}
            </p>
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
              {result.assets.newsletterBody}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  )
}

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: 16,
  maxWidth: 780,
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

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 24,
}

const itemStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 12,
  background: "#f7f7f7",
  marginBottom: 12,
  whiteSpace: "pre-wrap",
  lineHeight: 1.7,
}