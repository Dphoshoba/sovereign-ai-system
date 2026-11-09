import { describe, expect, it, vi } from "vitest";
import { transitionArticleLifecycle } from "../../lib/publishing/article-lifecycle";
import { researchPublicationBlockReason } from "../../lib/publishing/publication-guard";
import { computeArticleAuditFingerprint } from "../../lib/research/article-audit-fingerprint";
import { serializeArticleAuditAssociation } from "../../lib/research/article-audit-association";

const ORDINARY_CLAIM =
  "The NIST AI Risk Management Framework helps organizations govern artificial intelligence risk through documented controls and measurement.";
const MULTI_SOURCE_CLAIM =
  "NIST and PwC both describe documented controls for artificial intelligence risk.";
const NIST_PAGE = "https://www.nist.gov/itl/ai-risk-management-framework";
const NIST_OTHER_PAGE = "https://nist.gov/publications/ai-100-1";
const AIRC_PAGE = "https://airc.nist.gov/airmf-resources/airmf/";

const FAVOURABLE = {
  consensusScore: 90,
  sourceQualityScore: 90,
  publicationRecommendation: "publish-ready" as const,
  unverifiedCount: 0,
};

function audit(claim: string, urls: Array<string | null>) {
  return {
    ...FAVOURABLE,
    facts: [
      {
        claim,
        verificationStatus: "verified",
        verificationMethod: "exact",
        verificationCount: 2,
        supportingSources: urls.map((sourceUrl) => ({ sourceUrl })),
      },
    ],
  };
}

describe("canonical source independence", () => {
  it("does not treat two identical URLs as independent sources", () => {
    expect(researchPublicationBlockReason(audit(ORDINARY_CLAIM, [NIST_PAGE, NIST_PAGE]))).toContain(
      "Human review is required",
    );
  });

  it("collapses canonical-equivalent URLs", () => {
    expect(
      researchPublicationBlockReason(audit(ORDINARY_CLAIM, [NIST_PAGE, `${NIST_PAGE}/`])),
    ).toContain("Human review is required");
  });

  it("collapses fragments and tracking parameters", () => {
    expect(
      researchPublicationBlockReason(
        audit(ORDINARY_CLAIM, [
          `${NIST_PAGE}#govern`,
          "https://nist.gov/itl/ai-risk-management-framework/?utm_source=preview&fbclid=abc",
        ]),
      ),
    ).toContain("Human review is required");
  });

  it("collapses www and apex hostname variants", () => {
    expect(
      researchPublicationBlockReason(
        audit(ORDINARY_CLAIM, [
          NIST_PAGE,
          "https://nist.gov/itl/ai-risk-management-framework",
        ]),
      ),
    ).toContain("Human review is required");
  });

  it("does not treat different pages on one hostname as independent for an ordinary claim", () => {
    expect(
      researchPublicationBlockReason(audit(ORDINARY_CLAIM, [NIST_PAGE, NIST_OTHER_PAGE])),
    ).toContain("Human review is required");
  });

  it("accepts two genuinely independent hostnames", () => {
    expect(researchPublicationBlockReason(audit(ORDINARY_CLAIM, [NIST_PAGE, AIRC_PAGE]))).toBeNull();
  });

  it("accepts an explicit multi-source claim with two distinct document URLs", () => {
    expect(
      researchPublicationBlockReason(audit(MULTI_SOURCE_CLAIM, [NIST_PAGE, NIST_OTHER_PAGE])),
    ).toBeNull();
  });

  it("fails closed when a source URL is missing or malformed", () => {
    expect(researchPublicationBlockReason(audit(ORDINARY_CLAIM, [NIST_PAGE, ""]))).toContain(
      "Independent verification metadata is missing",
    );
    expect(
      researchPublicationBlockReason(audit(ORDINARY_CLAIM, [NIST_PAGE, "not a url"])),
    ).toContain("Independent verification metadata is missing");
    expect(
      researchPublicationBlockReason(audit(ORDINARY_CLAIM, [NIST_PAGE, null])),
    ).toContain("Independent verification metadata is missing");
  });

  it("still rejects a legacy audit with incomplete metadata", () => {
    expect(
      researchPublicationBlockReason({
        consensusScore: 90,
        sourceQualityScore: 90,
        publicationRecommendation: "publish-ready",
      }),
    ).toContain("Independent verification metadata is missing");
  });

  it("still rejects mixed verified and unverified facts", () => {
    expect(
      researchPublicationBlockReason({
        ...FAVOURABLE,
        unverifiedCount: 1,
        facts: [
          {
            claim: ORDINARY_CLAIM,
            verificationStatus: "verified",
            verificationMethod: "exact",
            verificationCount: 2,
            supportingSources: [{ sourceUrl: NIST_PAGE }, { sourceUrl: AIRC_PAGE }],
          },
        ],
      }),
    ).toContain("Human review is required");
  });

  it("keeps a valid modern audit eligible", () => {
    expect(
      researchPublicationBlockReason({
        consensusScore: 80,
        sourceQualityScore: 70,
        publicationRecommendation: "publish-ready",
        unverifiedCount: 0,
        facts: [
          {
            verificationStatus: "verified",
            verificationMethod: "exact",
            verificationCount: 2,
            supportingSources: [{ sourceUrl: NIST_PAGE }, { sourceUrl: AIRC_PAGE }],
          },
        ],
      }),
    ).toBeNull();
  });

  it("does not schedule or publish when duplicate URLs are the only support", async () => {
    const createdAt = new Date("2026-09-15T00:00:00.000Z");
    const article = {
      id: "duplicate-source-article",
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
          id: "duplicate-source-audit",
          articleId: "duplicate-source-article",
          createdAt,
          ...audit(ORDINARY_CLAIM, [NIST_PAGE, NIST_PAGE]),
        },
      ],
      reviewNotes: [] as Array<{ action: string; note: string | null }>,
    };
    article.reviewNotes = [
      {
        action: "research-audit-fingerprint",
        note: serializeArticleAuditAssociation({
          auditId: "duplicate-source-audit",
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
