"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import {
  instantToAdelaideWallClock,
} from "../../../../../lib/publishing/adelaide-time"
import { AdelaideTimezoneHint } from "@/components/articles/AdelaideTimezoneHint"
import { FeaturedImagePromptPanel } from "../../FeaturedImagePromptPanel"
import { WithdrawForCorrectionPanel } from "../../WithdrawForCorrectionPanel"

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
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [imageGenerationError, setImageGenerationError] = useState("")
  const [isApproving, setIsApproving] = useState(false)
  const [approvalMessage, setApprovalMessage] = useState("")
  const [saveError, setSaveError] = useState("")
  const [correctionMessage, setCorrectionMessage] = useState("")

  useEffect(() => {
    async function loadArticle() {
      const response = await fetch("/api/articles")
      const result = await response.json()
      const found = result.articles.find((a: Article) => a.id === id)
      if (!found) {
        setArticle(null)
        setLoading(false)
        return
      }

      setArticle({
        ...found,
        scheduledFor: found.scheduledFor
          ? instantToAdelaideWallClock(found.scheduledFor)
          : null,
      })
      setLoading(false)
    }

    loadArticle()
  }, [id])

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()

    if (!article) return

    const editableStatus = ["draft", "review", "review-required"].includes(
      article.status
    )

    setSaveError("")
    const response = await fetch(`/api/articles/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: article.title,
        slug: article.slug,
        category: article.category,
        excerpt: article.excerpt,
        content: article.content,
        featuredImage: article.featuredImage,
        seoTitle: article.seoTitle,
        seoDescription: article.seoDescription,
        seoKeywords: article.seoKeywords,
        ...(editableStatus ? { status: article.status } : {}),
      }),
    })

    const result = await response.json()

    if (!result.ok) {
      setSaveError(result.error || "Failed to update article")
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

  async function handleApproveArticle() {
    if (!article) return

    setIsApproving(true)
    setApprovalMessage("")

    try {
      const response = await fetch("/api/articles/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: article.id,
          approvedBy: "admin",
          reviewNote: "Approved via admin edit panel.",
        }),
      })

      const result = await response.json()

      if (!result.ok) {
        setApprovalMessage(result.error || "Approval failed")
        return
      }

      setArticle({
        ...article,
        status: "approved",
      })
      setApprovalMessage("Article approved for publishing.")
    } catch (err) {
      setApprovalMessage(
        err instanceof Error ? err.message : "Approval request failed"
      )
    } finally {
      setIsApproving(false)
    }
  }

  async function handleGenerateFeaturedImage() {
    if (!article) return

    setIsGeneratingImage(true)
    setImageGenerationError("")

    try {
      const response = await fetch("/api/ai/generate-featured-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId: article.id }),
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        setImageGenerationError(
          [result.code, result.error || result.warning]
            .filter(Boolean)
            .join(": ") || "Image generation failed"
        )
        return
      }

      if (result.article) {
        setArticle(result.article)
      }
    } catch (err) {
      setImageGenerationError(
        err instanceof Error ? err.message : "Network error"
      )
    } finally {
      setIsGeneratingImage(false)
    }
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
              border: "1px solid var(--border)",
            }}
          />
        ) : null}

        <FeaturedImagePromptPanel
          articleId={article.id}
          featuredImage={article.featuredImage}
          generating={isGeneratingImage}
          generationError={imageGenerationError}
          onGenerate={handleGenerateFeaturedImage}
          onArticleUpdate={(next) =>
            setArticle({
              ...article,
              featuredImage:
                next.featuredImage !== undefined
                  ? next.featuredImage
                  : article.featuredImage,
            })
          }
        />

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
            value={article.scheduledFor || ""}
            disabled
            aria-label="Scheduled publish time in Australia/Adelaide"
            style={inputStyle}
          />
          <AdelaideTimezoneHint />
          <small>Use the governed scheduling action to change this value.</small>
        </label>

        <label>
          Status
          <select
            value={article.status}
            onChange={(e) =>
              setArticle({ ...article, status: e.target.value })
            }
            disabled={!["draft", "review", "review-required"].includes(
              article.status
            )}
            style={inputStyle}
          >
            <option value="draft">Draft</option>
            <option value="review">Review</option>
            <option value="review-required">Review Required</option>
            {!["draft", "review", "review-required"].includes(article.status) ? (
              <option value={article.status}>{article.status}</option>
            ) : null}
          </select>
        </label>

        {(article.status === "review-required" || article.status === "review") && (
          <div>
            <button
              type="button"
              onClick={handleApproveArticle}
              disabled={isApproving}
              style={approveButton}
            >
              {isApproving ? "Approving..." : "Approve Article"}
            </button>
            {approvalMessage && (
              <p style={{
                fontSize: "14px",
                marginTop: "8px",
                color: approvalMessage.includes("failed") || approvalMessage.includes("error")
                  ? "#cc0000" : "var(--hero-background)",
              }}>
                {approvalMessage}
              </p>
            )}
          </div>
        )}

        {article.status === "published" ? (
          <p style={{ fontSize: "14px", margin: 0 }}>
            Published audited content cannot be saved in place. Use Withdraw for
            Correction to take this article off the public site and return it to
            review-required.
          </p>
        ) : null}

        <WithdrawForCorrectionPanel
          articleId={article.id}
          status={article.status}
          changes={{
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
            category: article.category,
            seoTitle: article.seoTitle,
            seoDescription: article.seoDescription,
            seoKeywords: article.seoKeywords,
          }}
          onCorrected={(next) => {
            setArticle({
              ...article,
              status: next.status,
            })
            setCorrectionMessage(
              "Article withdrawn for correction. Status is now review-required. Prepare for Review is required before approval or publication.",
            )
            setSaveError("")
          }}
        />

        {correctionMessage ? (
          <p role="status" style={{ color: "#92400e", margin: 0 }}>
            {correctionMessage}
          </p>
        ) : null}

        {saveError ? (
          <p role="alert" style={{ color: "#b91c1c", margin: 0 }}>
            {saveError}
          </p>
        ) : null}

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
  border: "1px solid var(--border)",
  fontSize: "16px",
}

const saveButton: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "none",
  background: "var(--hero-background)",
  color: "var(--hero-foreground)",
  cursor: "pointer",
  fontWeight: "bold",
}

const deleteButton: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "none",
  background: "#cc0000",
  color: "var(--hero-foreground)",
  cursor: "pointer",
  fontWeight: "bold",
}

const approveButton: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "none",
  background: "#2e7d32",
  color: "var(--hero-foreground)",
  cursor: "pointer",
  fontWeight: "bold",
  width: "100%",
}