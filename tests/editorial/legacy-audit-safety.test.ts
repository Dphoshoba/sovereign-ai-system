import { describe, expect, it, vi } from "vitest";
import { transitionArticleLifecycle } from "../../lib/publishing/article-lifecycle";
import { researchPublicationBlockReason } from "../../lib/publishing/publication-guard";
import { computeArticleAuditFingerprint } from "../../lib/research/article-audit-fingerprint";
import { serializeArticleAuditAssociation } from "../../lib/research/article-audit-association";
import { groundedFactVerification } from "../../lib/research/claim-evidence-matcher";
import type { EvidenceRecord } from "../../lib/research/evidence-registry";

const CLAIM =
  "The NIST AI Risk Management Framework helps organizations govern artificial intelligence risk through documented controls and measurement.";
const NIST_PAGE = "https://www.nist.gov/itl/ai-risk-management-framework";
const AIRC_PAGE = "https://airc.nist.gov/airmf-resources/airmf/";

const MODERN_FACT = {
  verificationStatus: "verified",
  verificationMethod: "exact",
  verificationCount: 2,
  supportingSources: [
    { sourceUrl: NIST_PAGE },
    { sourceUrl: AIRC_PAGE },
  ],
};

const FAVOURABLE = {
  consensusScore: 90,
  sourceQualityScore: 90,
  publicationRecommendation: "publish-ready" as const,
};

function evidence(id: string, sourceUrl: string, extractedText: string): EvidenceRecord {
  return {
    id,
    sourceTitle: "NIST AI RMF",
    sourceUrl,
    sourceType: "government",
    extractedText,
    confidence: 95,
    requiresHumanReview: true,
  };
}

function articleClaim(claim: string) {
  return {
    claim,
    articleExcerpt: claim,
    section: "body" as const,
    blockType: "paragraph" as const,
    kind: "factual" as const,
  };
}

describe("legacy audit publication safety", () => {
  it("fails closed when a favourable audit omits facts and unverifiedCount", () => {
    expect(researchPublicationBlockReason(FAVOURABLE)).toContain(
      "Independent verification metadata is missing",
    );
  });

  it("fails closed when verification fields are null", () => {
    expect(
      researchPublicationBlockReason({
        ...FAVOURABLE,
        unverifiedCount: 0,
        facts: [
          {
            verificationStatus: null,
            verificationMethod: null,
            verificationCount: null,
            supportingSources: null,
          },
        ],
      }),
    ).toContain("Independent verification metadata is missing");
  });

  it("does not treat one government document as publishable", () => {
    const verification = groundedFactVerification(
      [articleClaim(CLAIM)],
      [evidence("only", NIST_PAGE, CLAIM)],
      CLAIM,
    );

    expect(verification.facts[0]?.verificationCount).toBe(1);
    expect(
      researchPublicationBlockReason({
        ...FAVOURABLE,
        unverifiedCount: verification.unverifiedCount,
        facts: verification.facts,
      }),
    ).toContain("Human review is required");
  });

  it("accepts two independently corroborating documents", () => {
    const verification = groundedFactVerification(
      [articleClaim(CLAIM)],
      [
        evidence("framework", NIST_PAGE, `${CLAIM} The framework page states this directly.`),
        evidence("resource", AIRC_PAGE, `${CLAIM} The resource center states this separately.`),
      ],
      CLAIM,
    );

    expect(verification.facts[0]?.verificationCount).toBe(2);
    expect(
      researchPublicationBlockReason({
        consensusScore: 80,
        sourceQualityScore: 70,
        publicationRecommendation: "publish-ready",
        unverifiedCount: 0,
        facts: verification.facts,
      }),
    ).toBeNull();
  });

  it("blocks mixed verified and unverified facts despite favourable scores", () => {
    expect(
      researchPublicationBlockReason({
        ...FAVOURABLE,
        unverifiedCount: 1,
        facts: [
          MODERN_FACT,
          {
            verificationStatus: "unverified",
            verificationMethod: "single-source-supported",
            verificationCount: 1,
            supportingSources: [{ sourceUrl: NIST_PAGE }],
          },
        ],
      }),
    ).toContain("Human review is required");
  });

  it("keeps a complete modern audit eligible at the stored thresholds", () => {
    expect(
      researchPublicationBlockReason({
        consensusScore: 80,
        sourceQualityScore: 70,
        publicationRecommendation: "publish-ready",
        unverifiedCount: 0,
        facts: [MODERN_FACT],
      }),
    ).toBeNull();
  });

  it("does not schedule or publish an approved article from a legacy audit", async () => {
    const createdAt = new Date("2026-09-15T00:00:00.000Z");
    const article = {
      id: "legacy-audit-article",
      title: "Governed AI workflows",
      excerpt: "Evidence-backed operations.",
      content: "See [NIST](https://www.nist.gov/artificial-intelligence).",
      category: "ai-tools",
      seoTitle: "Governed AI workflows",
      seoDescription: "Build accountable AI workflows.",
      seoKeywords: "AI governance",
      featuredImage: null,
      status: "approved",
      scheduledFor: null,
      publishedAt: null,
      approvedAt: new Date("2026-09-15T01:00:00.000Z"),
      approvedBy: "editor",
      researchSources: [],
      researchAudits: [
        {
          id: "legacy-audit",
          articleId: "legacy-audit-article",
          createdAt,
          ...FAVOURABLE,
        },
      ],
      reviewNotes: [] as Array<{ action: string; note: string | null }>,
    };
    article.reviewNotes = [
      {
        action: "research-audit-fingerprint",
        note: serializeArticleAuditAssociation({
          auditId: "legacy-audit",
          contentFingerprint: computeArticleAuditFingerprint(article, [
            "https://www.nist.gov/artificial-intelligence",
          ]),
          createdAt,
        }),
      },
    ];
    const update = vi.fn();
    const store = {
      $transaction: async (callback: (tx: unknown) => unknown) =>
        callback({
          $queryRaw: async () => [{ id: article.id }],
          article: { findUnique: async () => article, update },
          articleReviewNote: { create: vi.fn() },
          publishingQueue: { update: vi.fn() },
        }),
    };

    const published = await transitionArticleLifecycle(
      { articleId: article.id, transition: "publish" },
      { prisma: store },
    );
    const scheduled = await transitionArticleLifecycle(
      {
        articleId: article.id,
        transition: "schedule",
        scheduledFor: new Date("2026-09-20T00:00:00.000Z"),
      },
      { prisma: store },
    );

    expect(published).toMatchObject({
      ok: false,
      code: "research_not_publishable",
      articleUnchanged: true,
    });
    expect(scheduled).toMatchObject({
      ok: false,
      code: "research_not_publishable",
      articleUnchanged: true,
    });
    expect(update).not.toHaveBeenCalled();
    expect(article.status).toBe("approved");
  });
});
