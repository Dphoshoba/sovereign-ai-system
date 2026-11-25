import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  EditArticleForm,
  type EditArticleFormArticle,
} from "../../app/admin/articles/[id]/edit/EditArticleForm";
import { canShowApprovalActions } from "../../app/admin/articles/ArticleAuditPanel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("../../app/admin/articles/PrepareForReviewButton", () => ({
  PrepareForReviewButton: ({ articleId }: { articleId: string }) =>
    createElement("button", { type: "button" }, `Prepare ${articleId}`),
}));

vi.mock("../../app/admin/articles/FeaturedImagePromptPanel", () => ({
  FeaturedImagePromptPanel: () => createElement("div", null, "Featured image"),
}));

vi.mock("../../app/admin/articles/WithdrawForCorrectionPanel", () => ({
  WithdrawForCorrectionPanel: ({ status }: { status: string }) =>
    createElement("div", { "data-withdraw-status": status }, "Withdraw"),
}));

vi.mock("../../app/admin/articles/PublishPackageButton", () => ({
  PublishPackageButton: ({ articleId }: { articleId: string }) =>
    createElement("button", { type: "button" }, `Publish ${articleId}`),
}));

vi.mock("@/components/articles/AdelaideTimezoneHint", () => ({
  AdelaideTimezoneHint: () => createElement("span", null, "Adelaide"),
}));

const scoredArticle: EditArticleFormArticle = {
  id: "article-1",
  title: "Governed workflows",
  slug: "governed-workflows",
  category: "ai-tools",
  excerpt: "Evidence-backed operations.",
  content: "See NIST.",
  featuredImage: null,
  seoTitle: "Governed workflows",
  seoDescription: "Build accountable AI workflows.",
  seoKeywords: "AI governance",
  scheduledFor: null,
  status: "review-required",
  editorialScore: 95,
  editorialGrade: "approval-candidate",
  editorialWarnings: [],
  qualityScore: 80,
  qualityGrade: "good",
  seoScore: 90,
  seoGrade: "excellent",
};

function renderForm(
  overrides: Partial<EditArticleFormArticle> = {},
  audit: { hasCurrentAudit: boolean; historicalAuditCount: number } = {
    hasCurrentAudit: true,
    historicalAuditCount: 0,
  },
) {
  return renderToStaticMarkup(
    createElement(EditArticleForm, {
      initialArticle: { ...scoredArticle, ...overrides },
      hasCurrentAudit: audit.hasCurrentAudit,
      historicalAuditCount: audit.historicalAuditCount,
    }),
  );
}

describe("edit-page approval visibility", () => {
  it("shows Approve Article for review-required with a current audit", () => {
    const html = renderForm({ status: "review-required" }, {
      hasCurrentAudit: true,
      historicalAuditCount: 0,
    });
    expect(html).toContain("Approve Article");
    expect(html).toContain('data-approval-visible="true"');
    expect(html).not.toContain("A current research audit is required");
    expect(html).not.toContain("Publish article-1");
    expect(canShowApprovalActions("review-required", true)).toBe(true);
  });

  it("hides Approve Article for review-required without a current audit", () => {
    const html = renderForm({ status: "review-required" }, {
      hasCurrentAudit: false,
      historicalAuditCount: 0,
    });
    expect(html).not.toContain("Approve Article");
    expect(html).toContain("A current research audit is required");
    expect(html).toContain("Prepare article-1");
    expect(canShowApprovalActions("review-required", false)).toBe(false);
  });

  it("hides Approve Article when only a historical audit remains", () => {
    const html = renderForm({ status: "review-required" }, {
      hasCurrentAudit: false,
      historicalAuditCount: 1,
    });
    expect(html).not.toContain("Approve Article");
    expect(html).toContain("Not current");
    expect(html).not.toContain("approval-candidate");
    expect(html).toContain("A current research audit is required");
  });

  it("shows Approve Article for review when a current audit exists", () => {
    const html = renderForm({ status: "review" }, {
      hasCurrentAudit: true,
      historicalAuditCount: 0,
    });
    expect(html).toContain("Approve Article");
    expect(canShowApprovalActions("review", true)).toBe(true);
  });

  it("does not show Approve Article for published, approved, or scheduled", () => {
    for (const status of ["published", "approved", "scheduled"] as const) {
      const html = renderForm({ status }, {
        hasCurrentAudit: true,
        historicalAuditCount: 0,
      });
      expect(html).not.toContain("Approve Article");
      expect(canShowApprovalActions(status, true)).toBe(false);
    }
  });

  it("shows immediate Publish on the edit page for an approved article that is publication-ready", () => {
    const html = renderForm(
      {
        status: "approved",
        approvedAt: "2026-09-24T00:00:00.000Z",
        approvedBy: "editor@example.com",
        featuredImage: "/generated/article-fixture.png",
      },
      { hasCurrentAudit: true, historicalAuditCount: 0 },
    );
    expect(html).toContain("Publish article-1");
    expect(html).toContain('data-immediate-publish-visible="true"');
    expect(html).not.toContain("Approve Article");
    expect(html).not.toContain("Prepare article-1");
  });

  it("hides immediate Publish on the edit page when an approved article has no current audit", () => {
    const html = renderForm(
      {
        status: "approved",
        approvedAt: "2026-09-24T00:00:00.000Z",
        approvedBy: "editor@example.com",
        featuredImage: "/generated/article-fixture.png",
      },
      { hasCurrentAudit: false, historicalAuditCount: 1 },
    );
    expect(html).not.toContain("Publish article-1");
    expect(html).toContain("current research audit");
  });

  it("hides immediate Publish on the edit page when the featured image is missing", () => {
    const html = renderForm(
      {
        status: "approved",
        approvedAt: "2026-09-24T00:00:00.000Z",
        approvedBy: "editor@example.com",
        featuredImage: null,
      },
      { hasCurrentAudit: true, historicalAuditCount: 0 },
    );
    expect(html).not.toContain("Publish article-1");
    expect(html).toContain("featured image");
  });

  it("preserves Withdraw for Correction and hides Publish for a published article", () => {
    const html = renderForm(
      {
        status: "published",
        approvedAt: "2026-09-24T00:00:00.000Z",
        approvedBy: "editor@example.com",
        featuredImage: "/generated/article-fixture.png",
      },
      { hasCurrentAudit: true, historicalAuditCount: 0 },
    );
    expect(html).toContain("Withdraw");
    expect(html).toContain('data-withdraw-status="published"');
    expect(html).not.toContain("Publish article-1");
    expect(html).not.toContain("Approve Article");
  });

  it("renders stale stored scores as Not current and does not expose approval", () => {
    const html = renderForm(
      {
        status: "review-required",
        editorialScore: 95,
        editorialGrade: "approval-candidate",
      },
      { hasCurrentAudit: false, historicalAuditCount: 2 },
    );
    expect(html).toContain('data-score-currency="not-current"');
    expect(html).toContain("Not current");
    expect(html).not.toContain("approval-candidate");
    expect(html).not.toContain("Approve Article");
  });
});
