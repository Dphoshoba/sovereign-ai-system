import { describe, expect, it } from "vitest";
import {
  RESEARCH_AUDIT_FINGERPRINT_ACTION,
  parseArticleAuditAssociation,
  partitionAssociatedArticleAudits,
  serializeArticleAuditAssociation,
} from "../../lib/research/article-audit-association";
import { computeArticleAuditFingerprint } from "../../lib/research/article-audit-fingerprint";

const article = {
  id: "article-1",
  title: "AI as infrastructure",
  excerpt: "A governed operating layer.",
  content: "Evidence-backed body.",
  category: "ai-tools",
  seoTitle: "AI infrastructure",
  seoDescription: "Build governed AI workflows.",
  seoKeywords: "AI infrastructure, governance",
};

const sources = ["https://www.nist.gov/itl/ai-risk-management-framework"];
const fingerprint = computeArticleAuditFingerprint(article, sources);

function associationNote(
  auditId: string,
  value = fingerprint,
  createdAt = new Date("2026-09-15T00:00:00.000Z"),
) {
  return {
    action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
    note: serializeArticleAuditAssociation({
      auditId,
      contentFingerprint: value,
      createdAt,
    }),
  };
}

describe("article audit associations", () => {
  it("round-trips the strict machine-readable payload", () => {
    expect(
      parseArticleAuditAssociation(associationNote("audit-current")),
    ).toEqual({
      version: 1,
      auditId: "audit-current",
      contentFingerprint: fingerprint,
      algorithm: "sha256",
      createdAt: "2026-09-15T00:00:00.000Z",
    });
  });

  it.each([
    ["malformed JSON", "not-json"],
    ["missing key", JSON.stringify({ version: 1 })],
    [
      "extra key",
      JSON.stringify({
        version: 1,
        auditId: "audit-current",
        contentFingerprint: fingerprint,
        algorithm: "sha256",
        createdAt: "2026-09-15T00:00:00.000Z",
        extra: true,
      }),
    ],
    [
      "wrong algorithm",
      JSON.stringify({
        version: 1,
        auditId: "audit-current",
        contentFingerprint: fingerprint,
        algorithm: "sha1",
        createdAt: "2026-09-15T00:00:00.000Z",
      }),
    ],
    [
      "wrong version",
      JSON.stringify({
        version: 2,
        auditId: "audit-current",
        contentFingerprint: fingerprint,
        algorithm: "sha256",
        createdAt: "2026-09-15T00:00:00.000Z",
      }),
    ],
    [
      "blank audit ID",
      JSON.stringify({
        version: 1,
        auditId: " ",
        contentFingerprint: fingerprint,
        algorithm: "sha256",
        createdAt: "2026-09-15T00:00:00.000Z",
      }),
    ],
    [
      "invalid fingerprint",
      JSON.stringify({
        version: 1,
        auditId: "audit-current",
        contentFingerprint: "not-a-sha256",
        algorithm: "sha256",
        createdAt: "2026-09-15T00:00:00.000Z",
      }),
    ],
    [
      "invalid timestamp",
      JSON.stringify({
        version: 1,
        auditId: "audit-current",
        contentFingerprint: fingerprint,
        algorithm: "sha256",
        createdAt: "yesterday",
      }),
    ],
  ])("rejects %s as historical", (_label, note) => {
    expect(
      parseArticleAuditAssociation({
        action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
        note,
      }),
    ).toBeNull();
  });

  it("ignores ordinary human review notes", () => {
    expect(
      parseArticleAuditAssociation({
        action: "approved",
        note: associationNote("audit-current").note,
      }),
    ).toBeNull();
  });

  it("selects only the audit whose ID and fingerprint both match", () => {
    const current = {
      id: "audit-current",
      articleId: article.id,
      createdAt: new Date("2026-09-15T00:00:00.000Z"),
    };
    const stale = {
      id: "audit-stale",
      articleId: article.id,
      createdAt: new Date("2026-09-14T00:00:00.000Z"),
    };
    const legacy = {
      id: "audit-legacy",
      articleId: article.id,
      createdAt: new Date("2026-09-13T00:00:00.000Z"),
    };

    expect(
      partitionAssociatedArticleAudits(
        article,
        sources,
        [stale, current, legacy],
        [
          associationNote("audit-stale", "a".repeat(64)),
          associationNote("wrong-audit"),
          associationNote("audit-stale"),
          associationNote("audit-current"),
        ],
      ),
    ).toEqual({
      current,
      historical: [stale, legacy],
    });
  });

  it("treats legacy audits and wrong-audit associations as historical", () => {
    const legacy = {
      id: "audit-legacy",
      articleId: article.id,
      createdAt: new Date("2026-09-13T00:00:00.000Z"),
    };
    expect(
      partitionAssociatedArticleAudits(
        article,
        sources,
        [legacy],
        [associationNote("missing-audit")],
      ),
    ).toEqual({ current: null, historical: [legacy] });
  });

  it("rejects an audit associated to another article", () => {
    const foreignAudit = {
      id: "audit-foreign",
      articleId: "article-2",
      createdAt: new Date("2026-09-15T00:00:00.000Z"),
    };

    expect(
      partitionAssociatedArticleAudits(
        article,
        sources,
        [foreignAudit],
        [associationNote(foreignAudit.id)],
      ),
    ).toEqual({ current: null, historical: [foreignAudit] });
  });

  it("does not let a newer unmatched audit hide a valid matching audit", () => {
    const matching = {
      id: "audit-matching",
      articleId: article.id,
      createdAt: new Date("2026-09-14T00:00:00.000Z"),
    };
    const newerUnrelated = {
      id: "audit-newer",
      articleId: article.id,
      createdAt: new Date("2026-09-15T00:00:00.000Z"),
    };

    expect(
      partitionAssociatedArticleAudits(
        article,
        sources,
        [matching, newerUnrelated],
        [associationNote(matching.id, fingerprint, matching.createdAt)],
      ),
    ).toEqual({ current: matching, historical: [newerUnrelated] });
  });

  it("does not let a newer malformed association hide a valid matching audit", () => {
    const matching = {
      id: "audit-matching",
      articleId: article.id,
      createdAt: new Date("2026-09-14T00:00:00.000Z"),
    };
    const newer = {
      id: "audit-newer",
      articleId: article.id,
      createdAt: new Date("2026-09-15T00:00:00.000Z"),
    };

    expect(
      partitionAssociatedArticleAudits(
        article,
        sources,
        [matching, newer],
        [
          associationNote(matching.id, fingerprint, matching.createdAt),
          {
            action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
            note: "not-json",
          },
        ],
      ),
    ).toEqual({ current: matching, historical: [newer] });
  });

  it("rejects an association timestamp that differs from its audit", () => {
    const audit = {
      id: "audit-current",
      articleId: article.id,
      createdAt: new Date("2026-09-15T00:00:00.000Z"),
    };

    expect(
      partitionAssociatedArticleAudits(article, sources, [audit], [
        associationNote(
          audit.id,
          fingerprint,
          new Date("2026-09-15T00:00:00.001Z"),
        ),
      ]),
    ).toEqual({ current: null, historical: [audit] });
  });
});
