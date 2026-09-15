import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("admin article audit currency labels", () => {
  it("labels the matching audit as current and old revisions as historical", () => {
    const detailPage = read("app/admin/articles/ArticleAuditPanel.tsx");
    const listPage = read("app/admin/articles/page.tsx");

    expect(detailPage).toContain('data-audit-state="current"');
    expect(detailPage).toContain('data-audit-state="historical"');
    expect(detailPage).toContain("No Current Research Audit");
    expect(detailPage).toContain("isResearchAuditFingerprintNote");
    expect(detailPage).toContain("humanReviewNotes.map");
    expect(listPage).toContain('data-audit-state="current"');
    expect(listPage).toContain('data-audit-state="historical"');
    expect(listPage).toContain("canShowApprovalActions");
  });
});
