"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function NewArticlePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    title: "",
    slug: "",
    category: "ai-automation",
    excerpt: "",
    content: "",
    featuredImage: "",
    status: "draft",
  })

  function updateField(field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "title"
        ? {
            slug: value
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, ""),
          }
        : {}),
    }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)

    const response = await fetch("/api/articles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert("Failed to create article")
      return
    }

    router.push("/admin/articles")
    router.refresh()
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Create New Article</h1>

      <form onSubmit={handleSubmit} style={formStyle}>
        <label>
          Title
          <input
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            required
            style={inputStyle}
          />
        </label>

        <label>
          Slug
          <input
            value={form.slug}
            onChange={(e) => updateField("slug", e.target.value)}
            required
            style={inputStyle}
          />
        </label>

        <label>
          Category
          <input
            value={form.category}
            onChange={(e) => updateField("category", e.target.value)}
            required
            style={inputStyle}
          />
        </label>

        <label>
          Featured Image URL
          <input
            value={form.featuredImage}
            onChange={(e) => updateField("featuredImage", e.target.value)}
            placeholder="https://..."
            style={inputStyle}
          />
        </label>

        <label>
          Excerpt
          <textarea
            value={form.excerpt}
            onChange={(e) => updateField("excerpt", e.target.value)}
            rows={5}
            style={inputStyle}
          />
        </label>

        <label>
          Full Article Content
          <textarea
            value={form.content}
            onChange={(e) => updateField("content", e.target.value)}
            rows={14}
            style={inputStyle}
            placeholder="Write the full article here..."
          />
        </label>

        <label>
          Status
          <select
            value={form.status}
            onChange={(e) => updateField("status", e.target.value)}
            style={inputStyle}
          >
            <option value="draft">Draft</option>
            <option value="review">Review</option>
            <option value="published">Published</option>
          </select>
        </label>

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Creating..." : "Create Article"}
        </button>
      </form>
    </main>
  )
}

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: "16px",
  maxWidth: "800px",
  marginTop: "24px",
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: "6px",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid var(--border)",
  fontSize: "16px",
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "none",
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  cursor: "pointer",
  fontWeight: "bold",
}