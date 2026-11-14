import { describe, expect, it } from "vitest";
import { publicationGuard, researchPublicationBlockReason } from "../../lib/publishing/publication-guard";
import {
  ARTICLE_AUDIT_FINGERPRINT_BOUNDARY,
  computeArticleAuditFingerprint,
} from "../../lib/research/article-audit-fingerprint";
import {
  parseArticleAuditAssociation,
  partitionAssociatedArticleAudits,
  serializeArticleAuditAssociation,
} from "../../lib/research/article-audit-association";
import {
  ADOPTED_AUDIT_SPECIFICATION_VERSION,
  auditSpecificationSemantics,
  versionedDisputeMetadataProblem,
} from "../../lib/research/audit-specification-compatibility";
import {
  PUBLISH_READY_CONSENSUS_SCORE,
  PUBLISH_READY_SOURCE_QUALITY_SCORE,
} from "../../lib/research/consensus-engine";
import {
  CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
  VERSIONED_RESEARCH_AUDIT_ENGINE_REVISION,
  isCurrentResearchAuditEngineRevision,
} from "../../lib/research/research-audit-engine-revision";

const article = {
  id: "article-1",
  title: "Governed AI workflows",
  excerpt: "Evidence-backed operations.",
  content: "The reviewed article keeps its saved wording.",
  category: "ai-tools",
  seoTitle: "Governed AI workflows",
  seoDescription: "Build accountable AI workflows.",
  seoKeywords: "AI governance",
};
const sourceUrls = ["https://learn.microsoft.com/power-platform/copilot/availability"];
const createdAt = new Date("2026-11-14T09:00:00.000Z");

const favourable = {
  consensusScore: 90,
  sourceQualityScore: 90,
  publicationRecommendation: "publish-ready" as const,
  unverifiedCount: 0,
};

function association(auditId: string, engineRevision?: string) {
  return {
    action: "research-audit-fingerprint",
    note: serializeArticleAuditAssociation({
      auditId,
      contentFingerprint: computeArticleAuditFingerprint(article, sourceUrls),
      createdAt,
      engineRevision,
    }),
  };
}

describe("versioned audit compatibility", () => {
  it("keeps an article-grounded-v14 association current", () => {
    const audit = { id: "audit-v14", articleId: article.id, createdAt };
    const result = partitionAssociatedArticleAudits(article, sourceUrls, [audit], [
      association("audit-v14"),
    ]);

    expect(CURRENT_RESEARCH_AUDIT_ENGINE_REVISION).toBe("article-grounded-v14");
    expect(result.current).toBe(audit);
    expect(result.historical).toEqual([]);
  });

  it("accepts the versioned engine revision without replacing v14", () => {
    const audit = { id: "audit-versioned", articleId: article.id, createdAt };
    const result = partitionAssociatedArticleAudits(article, sourceUrls, [audit], [
      association("audit-versioned", VERSIONED_RESEARCH_AUDIT_ENGINE_REVISION),
    ]);

    expect(isCurrentResearchAuditEngineRevision("article-grounded-v14")).toBe(true);
    expect(isCurrentResearchAuditEngineRevision(VERSIONED_RESEARCH_AUDIT_ENGINE_REVISION)).toBe(true);
    expect(isCurrentResearchAuditEngineRevision("article-grounded-v13")).toBe(false);
    expect(result.current).toBe(audit);
  });

  it("selects baseline semantics when specificationVersion is null or absent", () => {
    expect(auditSpecificationSemantics({ specificationVersion: null })).toBe("baseline");
    expect(auditSpecificationSemantics({})).toBe("baseline");
    expect(versionedDisputeMetadataProblem({})).toBeNull();
  });

  it("does not treat versioned metadata as a baseline audit", () => {
    expect(
      auditSpecificationSemantics({
        specificationVersion: ADOPTED_AUDIT_SPECIFICATION_VERSION,
      }),
    ).toBe("versioned");
  });

  it("fails closed when a versioned audit omits an explicit disputes array", () => {
    const versioned = { specificationVersion: ADOPTED_AUDIT_SPECIFICATION_VERSION };
    expect(versionedDisputeMetadataProblem(versioned)).toBe(
      "Versioned audit dispute metadata is missing.",
    );
    expect(versionedDisputeMetadataProblem({ ...versioned, disputes: null })).toBe(
      "Versioned audit dispute metadata is missing.",
    );
    expect(versionedDisputeMetadataProblem({ ...versioned, disputes: {} })).toBe(
      "Versioned audit dispute metadata is missing.",
    );
    expect(versionedDisputeMetadataProblem({ ...versioned, disputes: [] })).toBeNull();
    expect(
      versionedDisputeMetadataProblem({ specificationVersion: "EV-REG-SPEC-0.9.0", disputes: [] }),
    ).toBe("Versioned audit specification is not the adopted contract.");
  });

  it("keeps existing article fingerprints free of specification and passage-checksum fields", () => {
    const fingerprint = computeArticleAuditFingerprint(article, sourceUrls);

    expect(fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(computeArticleAuditFingerprint(article, sourceUrls)).toBe(fingerprint);
    expect(ARTICLE_AUDIT_FINGERPRINT_BOUNDARY.included).toEqual([
      "title",
      "excerpt",
      "content",
      "category",
      "seoTitle",
      "seoDescription",
      "seoKeywords",
      "ctaType",
      "ctaContent",
      "ctaDestination",
      "sourceUrls",
    ]);
  });

  it("keeps the six-key review-note association and rejects an added specification field", () => {
    const parsed = parseArticleAuditAssociation(association("audit-v14"));
    expect(parsed?.engineRevision).toBe("article-grounded-v14");
    expect(Object.keys(JSON.parse(association("audit-v14").note)).sort()).toEqual([
      "algorithm",
      "auditId",
      "contentFingerprint",
      "createdAt",
      "engineRevision",
      "version",
    ]);

    const withSpecification = JSON.parse(association("audit-v14").note) as Record<string, unknown>;
    withSpecification.specificationVersion = ADOPTED_AUDIT_SPECIFICATION_VERSION;
    expect(
      parseArticleAuditAssociation({
        action: "research-audit-fingerprint",
        note: JSON.stringify(withSpecification),
      }),
    ).toBeNull();
  });

  it("leaves baseline publication decisions and thresholds unchanged", () => {
    expect(PUBLISH_READY_CONSENSUS_SCORE).toBe(80);
    expect(PUBLISH_READY_SOURCE_QUALITY_SCORE).toBe(70);
    const primarySource = {
      ...favourable,
      specificationVersion: ADOPTED_AUDIT_SPECIFICATION_VERSION,
      disputes: [],
      facts: [
        {
          claim: "Microsoft documents a geographic availability limit.",
          verificationStatus: "partially verified",
          verificationMethod: "single-source-supported",
          verificationCount: 1,
          supportingSources: [{ sourceUrl: sourceUrls[0] }],
        },
      ],
    };

    expect(researchPublicationBlockReason(primarySource)).toContain("Human review is required");
    expect(researchPublicationBlockReason({
      ...favourable,
      specificationVersion: ADOPTED_AUDIT_SPECIFICATION_VERSION,
      facts: [
        {
          claim: "Two independent works support the statement.",
          verificationStatus: "verified",
          verificationMethod: "exact",
          verificationCount: 2,
          supportingSources: [
            { sourceUrl: sourceUrls[0] },
            { sourceUrl: "https://www.business.gov.au/online/artificial-intelligence" },
          ],
        },
      ],
    })).toBeNull();
    expect(publicationGuard("review-required", { hasCurrentAudit: true }).allowed).toBe(false);
    expect(versionedDisputeMetadataProblem(primarySource)).toBeNull();
  });
});
