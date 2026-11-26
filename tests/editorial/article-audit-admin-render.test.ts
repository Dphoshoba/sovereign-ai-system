import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  ArticleAuditPanel,
  canShowApprovalActions,
  scoreDisplayValue,
} from "../../app/admin/articles/ArticleAuditPanel";
import { RESEARCH_AUDIT_FINGERPRINT_ACTION } from "../../lib/research/article-audit-association";

vi.mock("../../app/admin/articles/PrepareForReviewButton", () => ({
  PrepareForReviewButton: ({ articleId }: { articleId: string }) =>
    createElement("button", { type: "button" }, `Prepare ${articleId}`),
}));

const article = {
  id: "article-1",
  title: "Governed workflows",
  status: "review-required",
  editorialScore: 88,
  editorialGrade: "approval-candidate",
  qualityScore: 80,
  qualityGrade: "review",
  seoScore: 70,
  seoGrade: "review",
  category: "ai-tools",
  researchAudits: [
    {
      id: "audit-current",
      createdAt: "2026-09-15T00:00:00.000Z",
      publicationRecommendation: "review",
      researchConfidence: 80,
      averageAuthorityScore: 80,
      averageTrustScore: 80,
      averageVerificationScore: 80,
      consensusScore: 80,
      sourceQualityScore: 80,
      sourceCount: 1,
      evidenceCount: 1,
      factCount: 1,
      verifiedCount: 1,
      partiallyVerifiedCount: 0,
      unverifiedCount: 0,
      sources: [{ url: "https://www.nist.gov/artificial-intelligence" }],
      evidence: [],
      facts: [],
      consensus: [],
    },
    {
      id: "audit-stale",
      createdAt: "2026-09-14T00:00:00.000Z",
      publicationRecommendation: "review",
    },
  ],
  reviewNotes: [
    {
      id: "note-human",
      action: "prepared-for-review",
      reviewer: "editor",
      note: "Ready for editorial judgment.",
      createdAt: "2026-09-15T00:00:00.000Z",
    },
    {
      id: "note-machine",
      action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
      reviewer: "system",
      note: '{"version":1,"auditId":"audit-current"}',
      createdAt: "2026-09-15T00:00:00.000Z",
    },
  ],
};

describe("rendered article audit admin output", () => {
  it("renders current, historical and human review-history states", () => {
    const html = renderToStaticMarkup(
      createElement(ArticleAuditPanel, {
        article,
        currentAudit: article.researchAudits[0],
        historicalAudits: [article.researchAudits[1]],
      }),
    );

    expect(html).toContain('data-audit-state="current"');
    expect(html).toContain("Current Research Audit");
    expect(html).toContain('data-audit-state="historical"');
    expect(html).toContain("Historical / stale");
    expect(html).toContain("Ready for editorial judgment.");
    expect(html).not.toContain(RESEARCH_AUDIT_FINGERPRINT_ACTION);
    expect(html).not.toContain('"auditId":"audit-current"');
  });

  it("renders human notes and the no-current-audit state when every audit is stale", () => {
    const html = renderToStaticMarkup(
      createElement(ArticleAuditPanel, {
        article,
        currentAudit: null,
        historicalAudits: article.researchAudits,
      }),
    );

    expect(html).toContain('data-audit-state="none"');
    expect(html).toContain("No Current Research Audit");
    expect(html).toContain("Ready for editorial judgment.");
    expect(html).toContain("Prepare article-1");
    expect(html).not.toContain(RESEARCH_AUDIT_FINGERPRINT_ACTION);
  });

  it("does not treat stored scores as current without a matching audit", () => {
    expect(scoreDisplayValue(true, 0, 95)).toBe(95);
    expect(scoreDisplayValue(true, 0, "approval-candidate")).toBe(
      "approval-candidate",
    );
    expect(scoreDisplayValue(false, 1, 95)).toBe("Not current");
    expect(scoreDisplayValue(false, 1, "approval-candidate")).toBe(
      "Not current",
    );
    expect(scoreDisplayValue(false, 0, null)).toBe("Not scored");
  });

  it("hides approval without a current audit", () => {
    expect(canShowApprovalActions("review-required", false)).toBe(false);
    expect(canShowApprovalActions("review-required", true)).toBe(true);
    expect(canShowApprovalActions("review", true)).toBe(true);
    expect(canShowApprovalActions("review", false)).toBe(false);
    expect(canShowApprovalActions("approved", true)).toBe(false);
    expect(canShowApprovalActions("scheduled", true)).toBe(false);
    expect(canShowApprovalActions("published", true)).toBe(false);
    expect(canShowApprovalActions("draft", true)).toBe(false);
  });

  it("renders stored scores as Not current when only historical audits remain", () => {
    const html = renderToStaticMarkup(
      createElement(ArticleAuditPanel, {
        article,
        currentAudit: null,
        historicalAudits: article.researchAudits,
      }),
    );

    expect(html).toContain("Not current");
    expect(html).not.toContain("approval-candidate");
    expect(html).not.toContain(">88<");
  });
});
