import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  canShowImmediatePublishAction,
  canShowPrepareForReviewAction,
  canShowScheduleAction,
  publicationReadinessMessage,
} from "../../lib/publishing/article-action-visibility";
import { canShowApprovalActions } from "../../app/admin/articles/ArticleAuditPanel";
import { canShowWithdrawForCorrection } from "../../app/admin/articles/WithdrawForCorrectionPanel";
import { ARTICLE_3_TITLE } from "../fixtures/research-audit/article-3";
import { CURRENT_RESEARCH_AUDIT_ENGINE_REVISION } from "../../lib/research/research-audit-engine-revision";

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const approvedReady = {
  status: "approved",
  hasCurrentAudit: true,
  approvedAt: "2026-09-24T00:00:00.000Z",
  approvedBy: "editor@example.com",
  hasFeaturedImage: true,
};

describe("admin article action visibility", () => {
  it("shows Prepare for Review and hides Approve, Publish, and Schedule when review-required has no current audit", () => {
    const input = {
      status: "review-required",
      hasCurrentAudit: false,
      approvedAt: null,
      approvedBy: null,
      hasFeaturedImage: true,
    };

    expect(canShowPrepareForReviewAction(input)).toBe(true);
    expect(canShowApprovalActions(input.status, input.hasCurrentAudit)).toBe(
      false,
    );
    expect(canShowImmediatePublishAction(input)).toBe(false);
    expect(canShowScheduleAction(input)).toBe(false);
  });

  it("shows Approve and hides Publish and Schedule when review-required has a current audit", () => {
    const input = {
      status: "review-required",
      hasCurrentAudit: true,
      approvedAt: null,
      approvedBy: null,
      hasFeaturedImage: true,
    };

    expect(canShowPrepareForReviewAction(input)).toBe(false);
    expect(canShowApprovalActions(input.status, input.hasCurrentAudit)).toBe(
      true,
    );
    expect(canShowImmediatePublishAction(input)).toBe(false);
    expect(canShowScheduleAction(input)).toBe(false);
  });

  it("shows Publish and Schedule for an approved article with a current audit, approval metadata, and featured image", () => {
    expect(canShowImmediatePublishAction(approvedReady)).toBe(true);
    expect(canShowScheduleAction(approvedReady)).toBe(true);
    expect(canShowApprovalActions(approvedReady.status, true)).toBe(false);
    expect(canShowPrepareForReviewAction(approvedReady)).toBe(false);
    expect(publicationReadinessMessage(approvedReady)).toBeNull();
  });

  it("hides Publish and Schedule and explains the gap when an approved article has no current audit", () => {
    const input = {
      ...approvedReady,
      hasCurrentAudit: false,
    };

    expect(canShowImmediatePublishAction(input)).toBe(false);
    expect(canShowScheduleAction(input)).toBe(false);
    expect(publicationReadinessMessage(input)).toContain(
      "current research audit",
    );
  });

  it("hides Publish when an approved article is missing a featured image", () => {
    const input = {
      ...approvedReady,
      hasFeaturedImage: false,
    };

    expect(canShowImmediatePublishAction(input)).toBe(false);
    expect(canShowScheduleAction(input)).toBe(true);
    expect(publicationReadinessMessage(input)).toContain("featured image");
  });

  it("preserves scheduled controls without adding immediate publication", () => {
    const input = {
      status: "scheduled",
      hasCurrentAudit: true,
      approvedAt: approvedReady.approvedAt,
      approvedBy: approvedReady.approvedBy,
      hasFeaturedImage: true,
    };

    expect(canShowImmediatePublishAction(input)).toBe(false);
    expect(canShowScheduleAction(input)).toBe(false);
    expect(canShowApprovalActions(input.status, true)).toBe(false);
    expect(canShowPrepareForReviewAction(input)).toBe(false);
    expect(canShowWithdrawForCorrection(input.status)).toBe(false);
  });

  it("hides Publish and Schedule for published articles and keeps correction controls", () => {
    const input = {
      status: "published",
      hasCurrentAudit: true,
      approvedAt: approvedReady.approvedAt,
      approvedBy: approvedReady.approvedBy,
      hasFeaturedImage: true,
    };

    expect(canShowImmediatePublishAction(input)).toBe(false);
    expect(canShowScheduleAction(input)).toBe(false);
    expect(canShowWithdrawForCorrection(input.status)).toBe(true);
    expect(canShowApprovalActions(input.status, true)).toBe(false);
    expect(canShowPrepareForReviewAction(input)).toBe(false);
  });

  it("treats the Article 3 fixture as an approved current-audit candidate without runtime hardcoding", () => {
    expect(CURRENT_RESEARCH_AUDIT_ENGINE_REVISION).toBe("article-grounded-v6");

    const article3Fixture = {
      title: ARTICLE_3_TITLE,
      status: "approved",
      hasCurrentAudit: true,
      engineRevision: CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
      approvedAt: "2026-01-01T00:00:00.000Z",
      approvedBy: "editor@example.com",
      hasFeaturedImage: true,
    };

    expect(article3Fixture.title).toBe(ARTICLE_3_TITLE);
    expect(article3Fixture.engineRevision).toBe(
      CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
    );
    expect(canShowImmediatePublishAction(article3Fixture)).toBe(true);
    expect(canShowScheduleAction(article3Fixture)).toBe(true);
    expect(canShowApprovalActions(article3Fixture.status, true)).toBe(false);
    expect(canShowPrepareForReviewAction(article3Fixture)).toBe(false);
    expect(article3Fixture).not.toHaveProperty("id");
    expect(article3Fixture).not.toHaveProperty("slug");
  });

  it("wires list and edit surfaces to the shared visibility helper and official publish control", () => {
    const listPage = read("app/admin/articles/page.tsx");
    const editForm = read("app/admin/articles/[id]/edit/EditArticleForm.tsx");
    const articleActions = read("src/components/articles/ArticleActions.tsx");

    expect(listPage).toContain("canShowImmediatePublishAction");
    expect(listPage).toContain("canShowScheduleAction");
    expect(listPage).toContain("canShowPrepareForReviewAction");
    expect(listPage).toContain("PublishPackageButton");
    expect(listPage).toContain("publicationReadinessMessage");
    expect(editForm).toContain("canShowImmediatePublishAction");
    expect(editForm).toContain("PublishPackageButton");
    expect(articleActions).not.toContain("Publish Package");
    expect(articleActions).not.toContain("/api/articles/publish-package");
    expect(articleActions).not.toContain("Schedule Package");
  });
});
