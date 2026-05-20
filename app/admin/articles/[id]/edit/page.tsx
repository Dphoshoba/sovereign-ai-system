"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"

type Article = {
  id: string
  title: string
  slug: string
  category: string
  excerpt: string | null
  content: string | null
  featuredImage: string | null
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
  scheduledFor: string | null
  status: string
}

export default function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { id } = use(params)

  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadArticle() {
      const response = await fetch("/api/articles")
      const result = await response.json()
      const found = result.articles.find((a: Article) => a.id === id)

      setArticle(found || null)
      setLoading(false)
    }

    loadArticle()
  }, [id])

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()

    if (!article) return

    const response = await fetch(`/api/articles/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(article),
    })

    const result = await response.json()

    if (!result.ok) {
      alert("Failed to update article")
      return
    }

    router.push("/admin/articles")
    router.refresh()
  }

  async function handleDelete() {
    if (!article) return
    if (!confirm("Delete this article?")) return

    const response = await fetch(`/api/articles/${article.id}`, {
      method: "DELETE",
    })

    const result = await response.json()

    if (!result.ok) {
      alert("Failed to delete article")
      return
    }

    router.push("/admin/articles")
    router.refresh()
  }

  if (loading) return <main style={{ padding: 40 }}>Loading...</main>
  if (!article) return <main style={{ padding: 40 }}>Article not found</main>

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Edit Article</h1>

      <form onSubmit={handleSave} style={formStyle}>
        <label>
          Title
          <input
            value={article.title}
            onChange={(e) => setArticle({ ...article, title: e.target.value })}
            style={inputStyle}
          />
        </label>

        <label>
          Slug
          <input
            value={article.slug}
            onChange={(e) => setArticle({ ...article, slug: e.target.value })}
            style={inputStyle}
          />
        </label>

        <label>
          Category
          <input
            value={article.category}
            onChange={(e) =>
              setArticle({ ...article, category: e.target.value })
            }
            style={inputStyle}
          />
        </label>

        <label>
          Featured Image URL
          <input
            value={article.featuredImage || ""}
            onChange={(e) =>
              setArticle({ ...article, featuredImage: e.target.value })
            }
            placeholder="https://..."
            style={inputStyle}
          />
        </label>

        {article.featuredImage &&
        (article.featuredImage.startsWith("/") ||
          article.featuredImage.startsWith("http")) ? (
          <img
            src={article.featuredImage}
            alt={article.title}
            style={{
              width: "100%",
              maxHeight: "320px",
              objectFit: "cover",
              borderRadius: "14px",
              border: "1px solid #ddd",
            }}
          />
        ) : null}

        <label>
          SEO Title
          <input
            value={article.seoTitle || ""}
            onChange={(e) =>
              setArticle({ ...article, seoTitle: e.target.value })
            }
            placeholder="SEO title for Google and social previews"
            style={inputStyle}
          />
        </label>

        <label>
          SEO Description
          <textarea
            rows={3}
            value={article.seoDescription || ""}
            onChange={(e) =>
              setArticle({ ...article, seoDescription: e.target.value })
            }
            placeholder="Short search description"
            style={inputStyle}
          />
        </label>

        <label>
          SEO Keywords
          <input
            value={article.seoKeywords || ""}
            onChange={(e) =>
              setArticle({ ...article, seoKeywords: e.target.value })
            }
            placeholder="ai automation, ai agents, workflow automation"
            style={inputStyle}
          />
        </label>

        <label>
          Excerpt
          <textarea
            rows={5}
            value={article.excerpt || ""}
            onChange={(e) =>
              setArticle({ ...article, excerpt: e.target.value })
            }
            style={inputStyle}
          />
        </label>

        <label>
          Full Article Content
          <textarea
            rows={14}
            value={article.content || ""}
            onChange={(e) =>
              setArticle({ ...article, content: e.target.value })
            }
            style={inputStyle}
          />
        </label>

        <label>
          Scheduled Publish Date
          <input
            type="datetime-local"
            value={
              article.scheduledFor
                ? new Date(article.scheduledFor).toISOString().slice(0, 16)
                : ""
            }
            onChange={(e) =>
              setArticle({
                ...article,
                scheduledFor: e.target.value || null,
                status: e.target.value ? "scheduled" : article.status,
              })
            }
            style={inputStyle}
          />
        </label>

        <label>
          Status
          <select
            value={article.status}
            onChange={(e) =>
              setArticle({
                ...article,
                status: e.target.value,
                scheduledFor:
                  e.target.value === "scheduled" ? article.scheduledFor : null,
              })
            }
            style={inputStyle}
          >
            <option value="draft">Draft</option>
            <option value="review">Review</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </select>
        </label>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button type="submit" style={saveButton}>
            Save Changes
          </button>

          <button type="button" onClick={handleDelete} style={deleteButton}>
            Delete Article
          </button>
        </div>
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
  border: "1px solid #ccc",
  fontSize: "16px",
}

const saveButton: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "none",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
}

const deleteButton: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "none",
  background: "#cc0000",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
}