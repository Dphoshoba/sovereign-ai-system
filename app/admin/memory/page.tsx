"use client"

import { useEffect, useState } from "react"

type AiMemory = {
  id: string
  type: string
  title: string
  content: string
  source: string | null
  tags: string | null
  createdAt: string
}

export default function AiMemoryPage() {
  const [memories, setMemories] = useState<AiMemory[]>([])
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    type: "strategy",
    title: "",
    content: "",
    source: "manual",
    tags: "",
  })

  async function loadMemories() {
    const response = await fetch("/api/ai/memory")
    const result = await response.json()

    if (result.ok) {
      setMemories(result.memories)
    }
  }

  async function saveMemory(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)

    const response = await fetch("/api/ai/memory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to save memory")
      return
    }

    setForm({
      type: "strategy",
      title: "",
      content: "",
      source: "manual",
      tags: "",
    })

    loadMemories()
  }

  useEffect(() => {
    loadMemories()
  }, [])

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>Persistent AI Memory</h1>

      <p style={{ maxWidth: 760, color: "#555", lineHeight: 1.7 }}>
        Store long-term instructions, strategy notes, brand decisions, audience
        insights and publishing memory for Echoes & Visions.
      </p>

      <form onSubmit={saveMemory} style={formStyle}>
        <label>
          Type
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            style={inputStyle}
          >
            <option value="strategy">Strategy</option>
            <option value="voice">Voice</option>
            <option value="audience">Audience</option>
            <option value="publishing">Publishing</option>
            <option value="product">Product</option>
            <option value="ministry">Ministry</option>
            <option value="general">General</option>
          </select>
        </label>

        <label>
          Title
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            style={inputStyle}
          />
        </label>

        <label>
          Content
          <textarea
            rows={6}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
            style={inputStyle}
          />
        </label>

        <label>
          Tags
          <input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="ai, publishing, echo-visions"
            style={inputStyle}
          />
        </label>

        <button disabled={loading} style={buttonStyle}>
          {loading ? "Saving..." : "Save Memory"}
        </button>
      </form>

      <section style={{ marginTop: 34 }}>
        <h2>Stored Memories</h2>

        <div style={{ display: "grid", gap: 16 }}>
          {memories.map((memory) => (
            <div key={memory.id} style={cardStyle}>
              <p style={metaStyle}>{memory.type}</p>
              <h3>{memory.title}</h3>

              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                {memory.content}
              </p>

              {memory.tags ? (
                <p>
                  <strong>Tags:</strong> {memory.tags}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>
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

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "#777",
  fontSize: 13,
}