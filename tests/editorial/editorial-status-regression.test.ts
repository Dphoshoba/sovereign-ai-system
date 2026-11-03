import { describe, expect, it } from "vitest"
import { canShowApprovalActions } from "../../app/admin/articles/ArticleAuditPanel"
import { canShowPrepareForReviewAction } from "../../lib/publishing/article-action-visibility"
import {
  buildEditorialSavePayload,
  statusAfterPrepareForReview,
  type EditorialSaveArticle,
} from "../../lib/publishing/editorial-editor-save"

const article: EditorialSaveArticle = {
  title: "How to Start Using AI in Your Small Business Without Losing Human Control",
  slug: "how-to-start-using-ai-in-your-small-business-without-losing-human-control",
  category: "ai-automation",
  excerpt: "Start with one job, keep a named person responsible, and make sure someone can stop the system.",
  content: "AI can help a small business handle everyday work.",
  featuredImage: null,
  seoTitle: null,
  seoDescription: null,
  seoKeywords: null,
  status: "draft",
}

describe("editorial status regression", () => {
  it("does not send status on an unchanged save, so review-required is not demoted to draft", () => {
    const payload = buildEditorialSavePayload(
      { ...article, status: "draft" },
      { statusChanged: false },
    )

    expect(payload).not.toHaveProperty("status")
    expect(payload).toMatchObject({
      title: article.title,
      content: article.content,
      seoTitle: null,
    })
  })

  it("sends status only after the editor explicitly changes it", () => {
    const payload = buildEditorialSavePayload(
      { ...article, status: "draft" },
      { statusChanged: true },
    )

    expect(payload.status).toBe("draft")
  })

  it("synchronizes the editor status to the status returned by Prepare for Review", () => {
    expect(
      statusAfterPrepareForReview("draft", {
        article: { status: "review-required" },
      }),
    ).toBe("review-required")
    expect(statusAfterPrepareForReview("draft", { article: {} })).toBe("draft")
  })

  it("keeps article approval hidden for a draft and available after review-required", () => {
    expect(canShowApprovalActions("draft", true)).toBe(false)
    expect(canShowApprovalActions("review-required", true)).toBe(true)
    expect(canShowApprovalActions("review-required", false)).toBe(false)
    expect(
      canShowPrepareForReviewAction({
        status: "review-required",
        hasCurrentAudit: true,
      }),
    ).toBe(false)
  })
})
