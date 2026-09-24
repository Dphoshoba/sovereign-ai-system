"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdelaideTimezoneHint } from "@/components/articles/AdelaideTimezoneHint"
import { FeaturedImagePromptPanel } from "../../FeaturedImagePromptPanel"
import { WithdrawForCorrectionPanel } from "../../WithdrawForCorrectionPanel"
import { PrepareForReviewButton } from "../../PrepareForReviewButton"
import { PublishPackageButton } from "../../PublishPackageButton"
import {
  canShowApprovalActions,
  scoreDisplayValue,
} from "../../ArticleAuditPanel"
import {
  canShowImmediatePublishAction,
  canShowPrepareForReviewAction,
  publicationReadinessMessage,
} from "../../../../../lib/publishing/article-action-visibility"

export type EditArticleFormArticle = {
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
  approvedAt?: string | null
  approvedBy?: string | null
  editorialScore?: number | null
  editorialGrade?: string | null
  editorialWarnings?: unknown
  qualityScore?: number | null
  qualityGrade?: string | null
  seoScore?: number | null
  seoGrade?: string | null
}

export function EditArticleForm({
  initialArticle,
  hasCurrentAudit: initialHasCurrentAudit,
  historicalAuditCount: initialHistoricalAuditCount,
}: {
  initialArticle: EditArticleFormArticle
  hasCurrentAudit: boolean
  historicalAuditCount: number
}) {
  const router = useRouter()
  const [article, setArticle] = useState<EditArticleFormArticle>(initialArticle)
  const [hasCurrentAudit, setHasCurrentAudit] = useState(initialHasCurrentAudit)
  const [historicalAuditCount, setHistoricalAuditCount] = useState(
    initialHistoricalAuditCount,
  )
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [imageGenerationError, setImageGenerationError] = useState("")
  const [isApproving, setIsApproving] = useState(false)
  const [approvalMessage, setApprovalMessage] = useState("")
  const [saveError, setSaveError] = useState("")
  const [correctionMessage, setCorrectionMessage] = useState("")

  const showApproval = canShowApprovalActions(article.status, hasCurrentAudit)
  const canPrepareForReview = canShowPrepareForReviewAction({
    status: article.status,
    hasCurrentAudit,
  })
  const hasFeaturedImage = Boolean(article.featuredImage?.trim())
  const showImmediatePublish = canShowImmediatePublishAction({
    status: article.status,
    hasCurrentAudit,
    approvedAt: article.approvedAt,
    approvedBy: article.approvedBy,
    hasFeaturedImage,
  })
  const readinessMessage = publicationReadinessMessage({
    status: article.status,
    hasCurrentAudit,
    approvedAt: article.approvedAt,
    approvedBy: article.approvedBy,
    hasFeaturedImage,
  })
  const editorialGradeDisplay = scoreDisplayValue(
    hasCurrentAudit,
    historicalAuditCount,
    article.editorialGrade,
  )

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()

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
        approvedAt: new Date().toISOString(),
        approvedBy: "admin",
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
        setArticle({
          ...article,
          ...result.article,
        })
      }
    } catch (err) {
      setImageGenerationError(
        err instanceof Error ? err.message : "Network error"
      )
    } finally {
      setIsGeneratingImage(false)
    }
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Edit Article</h1>

      <div
        data-score-currency={hasCurrentAudit ? "current" : "not-current"}
        data-editorial-grade={String(editorialGradeDisplay ?? "")}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "10px",
          marginTop: "16px",
        }}
      >
        <div>
          <strong>Editorial Score</strong>
          <div>
            {scoreDisplayValue(
              hasCurrentAudit,
              historicalAuditCount,
              article.editorialScore,
            )}
          </div>
        </div>
        <div>
          <strong>Editorial Grade</strong>
          <div>{editorialGradeDisplay}</div>
        </div>
        <div>
          <strong>Quality Score</strong>
          <div>
            {scoreDisplayValue(
              hasCurrentAudit,
              historicalAuditCount,
              article.qualityScore,
            )}
          </div>
        </div>
        <div>
          <strong>SEO Score</strong>
          <div>
            {scoreDisplayValue(
              hasCurrentAudit,
              historicalAuditCount,
              article.seoScore,
            )}
          </div>
        </div>
      </div>

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

        {showApproval && (
          <div data-approval-visible="true">
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

        {canPrepareForReview ? (
          <div data-current-audit-required="true">
            <p style={{ fontSize: "14px", margin: "0 0 8px" }}>
              A current research audit is required before approval.
            </p>
            <PrepareForReviewButton articleId={article.id} />
          </div>
        ) : null}

        {showImmediatePublish ? (
          <div data-immediate-publish-visible="true">
            <PublishPackageButton articleId={article.id} />
          </div>
        ) : null}

        {readinessMessage ? (
          <p role="status" style={{ fontSize: "14px", color: "#92400e", margin: 0 }}>
            {readinessMessage}
          </p>
        ) : null}

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
            setHasCurrentAudit(false)
            setHistoricalAuditCount((count) => Math.max(count, 1))
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
