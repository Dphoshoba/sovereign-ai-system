import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { transitionArticleLifecycle } from "../../lib/publishing/article-lifecycle";
import {
  parseArticleAuditAssociation,
  partitionAssociatedArticleAudits,
  RESEARCH_AUDIT_FINGERPRINT_ACTION,
  serializeArticleAuditAssociation,
} from "../../lib/research/article-audit-association";
import { computeArticleAuditFingerprint } from "../../lib/research/article-audit-fingerprint";
import { groundedFactVerification } from "../../lib/research/claim-evidence-matcher";
import { consensusEngine } from "../../lib/research/consensus-engine";
import { recommendationWithEvidenceCompleteness } from "../../lib/research/evidence-completeness";
import type { EvidenceRecord } from "../../lib/research/evidence-registry";
import type { VerifiedFact } from "../../lib/research/fact-verification-engine";
import { prepareArticleForReview } from "../../lib/research/prepare-article-for-review";
import type {
  PrepareForReviewArticle,
  PrepareForReviewStore,
} from "../../lib/research/prepare-article-for-review";
import {
  CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
  isCurrentResearchAuditEngineRevision,
  isResearchAuditEngineRevision,
} from "../../lib/research/research-audit-engine-revision";

const MICROSOFT =
  "https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-privacy";
const XERO = "https://central.xero.com/s/article/About-Just-Ask-Xero-JAX";
const VENDOR_CLAIM =
  "Microsoft's Outlook help says Copilot can draft a customer email that a person reviews before it is sent.";
const GOV = [
  "https://www.nist.gov/one",
  "https://www.nist.gov/two",
  "https://www.cisa.gov/three",
];

function evidence(id: string, url: string, text: string): EvidenceRecord {
  return {
    id,
    sourceTitle: url,
    sourceUrl: url,
    sourceType: "documented-source",
    extractedText: text,
    confidence: 80,
    requiresHumanReview: true,
  };
}

function claim(text: string) {
  return {
    claim: text,
    articleExcerpt: text,
    section: "body" as const,
    blockType: "paragraph" as const,
    kind: "factual" as const,
  };
}

function fact(
  status: VerifiedFact["verificationStatus"],
  urls: string[],
  text: string,
): VerifiedFact {
  return {
    claim: text,
    evidenceId: urls[0] ?? "",
    sourceTitle: urls[0] ?? "",
    sourceUrl: urls[0] ?? "",
    sourceType: "documented-source",
    evidenceText: text,
    confidence: status === "unverified" ? "low" : "high",
    requiresHumanReview: status !== "verified",
    verificationCount: urls.length,
    verificationStatus: status,
    verificationMethod: urls.length > 1 ? "exact" : "single-source-supported",
    supportingSources: urls.map((sourceUrl) => ({
      sourceTitle: sourceUrl,
      sourceUrl,
      evidenceId: sourceUrl,
    })),
    verificationScore: status === "unverified" ? 0 : 90,
  };
}

describe("evidence completeness recommendation", () => {
  it("downgrades publish-ready when one scored claim is unverified without changing scores", () => {
    const facts = [
      ...Array.from({ length: 5 }, (_, index) =>
        fact(
          "verified",
          GOV,
          `NIST reports that privacy control ${index} is required for the documented system.`,
        ),
      ),
      fact(
        "unverified",
        [],
        "NIST reports that this privacy control remains unverified in the documented system.",
      ),
    ];
    const consensus = consensusEngine(facts);
    const recommendation = recommendationWithEvidenceCompleteness(
      consensus.publicationRecommendation,
      facts,
    );

    expect(consensus.consensusScore).toBeGreaterThanOrEqual(80);
    expect(consensus.sourceQualityScore).toBeGreaterThanOrEqual(70);
    expect(consensus.publicationRecommendation).toBe("publish-ready");
    expect(recommendation).toBe("review-required");
    expect(consensus.consensusScore).toBe(consensusEngine(facts).consensusScore);
    expect(consensus.sourceQualityScore).toBe(
      consensusEngine(facts).sourceQualityScore,
    );
  });

  it("downgrades publish-ready when eligible claims remain unscored", () => {
    const supported = fact(
      "verified",
      GOV,
      "NIST reports that privacy controls are required for the documented system.",
    );
    expect(
      recommendationWithEvidenceCompleteness("publish-ready", [supported], [
        { text: "A later eligible claim.", section: "Business reporting" },
      ]),
    ).toBe("review-required");
  });

  it("accepts one official vendor source without promoting partial verification", () => {
    const verification = groundedFactVerification(
      [claim(VENDOR_CLAIM)],
      [evidence("microsoft", MICROSOFT, VENDOR_CLAIM)],
      VENDOR_CLAIM,
      [{ url: MICROSOFT, title: "Microsoft" }],
    );
    const verified = verification.facts[0];
    expect(verified?.verificationStatus).toBe("partially verified");
    expect(verified?.verificationCount).toBe(1);
    expect(verified?.supportingSources.map((source) => source.sourceUrl)).toEqual([
      MICROSOFT,
    ]);
    expect(
      recommendationWithEvidenceCompleteness("publish-ready", verification.facts),
    ).toBe("publish-ready");
    expect(verified?.verificationStatus).toBe("partially verified");
  });

  it("treats an extraction failure with no accepted support as missing evidence", () => {
    const verification = groundedFactVerification(
      [claim(VENDOR_CLAIM)],
      [evidence("xero-shell", XERO, "")],
      VENDOR_CLAIM,
      [{ url: XERO, title: "Xero JAX" }],
    );
    expect(verification.facts[0]?.verificationStatus).toBe("unverified");
    expect(verification.facts[0]?.supportingSources).toEqual([]);
    expect(
      recommendationWithEvidenceCompleteness("publish-ready", verification.facts),
    ).toBe("review-required");
  });

  it("keeps a claim eligible when another accepted source supports it", () => {
    const verification = groundedFactVerification(
      [claim(VENDOR_CLAIM)],
      [
        evidence("xero-shell", XERO, ""),
        evidence("microsoft", MICROSOFT, VENDOR_CLAIM),
      ],
      VENDOR_CLAIM,
      [
        { url: XERO, title: "Xero JAX" },
        { url: MICROSOFT, title: "Microsoft" },
      ],
    );
    expect(verification.facts[0]?.verificationStatus).toBe("partially verified");
    expect(verification.facts[0]?.supportingSources.map((source) => source.sourceUrl)).toEqual([
      MICROSOFT,
    ]);
    expect(
      recommendationWithEvidenceCompleteness("publish-ready", verification.facts),
    ).toBe("publish-ready");
  });

  it("preserves review-required and blocked recommendations", () => {
    const unsupported = fact("unverified", [], "An unsupported claim remains unsupported.");
    expect(
      recommendationWithEvidenceCompleteness("review-required", [unsupported]),
    ).toBe("review-required");
    expect(recommendationWithEvidenceCompleteness("blocked", [unsupported])).toBe(
      "blocked",
    );
  });

  it("allows publish-ready only when every scored claim has accepted support and scores pass", () => {
    const supported = Array.from({ length: 4 }, (_, index) =>
      fact(
        "verified",
        GOV,
        `NIST reports that privacy control ${index} is required for the documented system.`,
      ),
    );
    const passing = consensusEngine(supported);
    expect(passing.consensusScore).toBeGreaterThanOrEqual(80);
    expect(passing.sourceQualityScore).toBeGreaterThanOrEqual(70);
    expect(
      recommendationWithEvidenceCompleteness(passing.publicationRecommendation, supported),
    ).toBe("publish-ready");

    const partial = fact("partially verified", [MICROSOFT], VENDOR_CLAIM);
    const failing = consensusEngine([partial]);
    expect(failing.consensusScore).toBeLessThan(80);
    expect(
      recommendationWithEvidenceCompleteness(failing.publicationRecommendation, [partial]),
    ).toBe(failing.publicationRecommendation);
    expect(partial.verificationStatus).toBe("partially verified");
  });

  it("downgrades a verified label that has no supporting URL", () => {
    const unlabeled = fact(
      "verified",
      [],
      "NIST reports that privacy controls are required for the documented system.",
    );
    unlabeled.supportingSources = [];
    unlabeled.sourceUrl = "";
    expect(
      recommendationWithEvidenceCompleteness("publish-ready", [unlabeled]),
    ).toBe("review-required");
  });
});

describe("historical audit fingerprints", () => {
  const article = {
    id: "article-historical",
    title: "Historical audit",
    excerpt: "Stored evidence.",
    content: "See [NIST](https://www.nist.gov/ai).",
    category: "ai-tools",
    seoTitle: "Historical audit",
    seoDescription: "Stored evidence remains readable.",
    seoKeywords: "audit",
  };
  const sources = ["https://www.nist.gov/ai"];
  const fingerprint = computeArticleAuditFingerprint(article, sources);
  const createdAt = new Date("2026-11-03T15:24:11.326Z");
  const stored = {
    id: "audit-stored",
    articleId: article.id,
    createdAt,
  };

  it.each([
    "article-grounded-v7",
    "article-grounded-v9",
    "article-grounded-v10",
    "article-grounded-v11",
    "article-grounded-v12",
  ])(
    "keeps %s readable and not current",
    (engineRevision) => {
      const note = serializeArticleAuditAssociation({
        auditId: stored.id,
        contentFingerprint: fingerprint,
        createdAt,
        engineRevision,
      });
      expect(parseArticleAuditAssociation({
        action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
        note,
      })?.engineRevision).toBe(engineRevision);
      expect(isResearchAuditEngineRevision(engineRevision)).toBe(true);
      expect(isCurrentResearchAuditEngineRevision(engineRevision)).toBe(false);
      expect(
        partitionAssociatedArticleAudits(article, sources, [stored], [
          { action: RESEARCH_AUDIT_FINGERPRINT_ACTION, note },
        ]),
      ).toEqual({ current: null, historical: [stored] });
    },
  );

  it("makes article-grounded-v13 the only current revision", () => {
    expect(CURRENT_RESEARCH_AUDIT_ENGINE_REVISION).toBe("article-grounded-v13");
    expect(isCurrentResearchAuditEngineRevision("article-grounded-v12")).toBe(false);
    const note = serializeArticleAuditAssociation({
      auditId: stored.id,
      contentFingerprint: fingerprint,
      createdAt,
    });
    expect(
      partitionAssociatedArticleAudits(article, sources, [stored], [
        { action: RESEARCH_AUDIT_FINGERPRINT_ACTION, note },
      ]).current,
    ).toBe(stored);
  });
});

describe("publication lifecycle with the completeness recommendation", () => {
  const createdAt = new Date("2026-09-15T00:00:00.000Z");
  const article = {
    id: "completeness-article",
    title: "Governed AI workflows",
    excerpt: "Evidence-backed operations.",
    content: "See [NIST](https://www.nist.gov/artificial-intelligence).",
    category: "ai-tools",
    seoTitle: "Governed AI workflows",
    seoDescription: "Build accountable AI workflows.",
    seoKeywords: "AI governance",
    featuredImage: null,
    status: "review-required",
    scheduledFor: null as Date | null,
    publishedAt: null as Date | null,
    approvedAt: null as Date | null,
    approvedBy: null as string | null,
    researchSources: [] as Array<{
      title: string | null;
      url: string | null;
      sourceType: string | null;
      authorityScore: number;
      trustScore: number;
    }>,
    researchAudits: [
      {
        id: "audit-current",
        articleId: "completeness-article",
        createdAt,
        consensusScore: 92,
        sourceQualityScore: 100,
        publicationRecommendation: "review-required",
      },
    ],
    reviewNotes: [] as Array<{ action: string; note: string | null }>,
  };

  function withCurrentAudit(recommendation: string, status: string) {
    const fingerprint = computeArticleAuditFingerprint(article, [
      "https://www.nist.gov/artificial-intelligence",
    ]);
    return {
      ...article,
      status,
      approvedAt: status === "review-required" ? null : createdAt,
      approvedBy: status === "review-required" ? null : "editor@example.com",
      researchAudits: [
        {
          ...article.researchAudits[0],
          publicationRecommendation: recommendation,
        },
      ],
      reviewNotes: [
        {
          action: "research-audit-fingerprint",
          note: serializeArticleAuditAssociation({
            auditId: "audit-current",
            contentFingerprint: fingerprint,
            createdAt,
          }),
        },
      ],
    };
  }

  function storeFor(current: ReturnType<typeof withCurrentAudit>) {
    const tx = {
      $queryRaw: vi.fn(async () => [{ id: current.id }]),
      article: {
        findUnique: vi.fn(async () => current),
        update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          Object.assign(current, data);
          return { ...current };
        }),
      },
      articleReviewNote: {
        create: vi.fn(async () => ({ id: "note-1" })),
      },
      publishingQueue: {
        update: vi.fn(async () => ({ id: "queue-1", status: "published" })),
      },
    };
    return {
      prisma: {
        $transaction: async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      },
    };
  }

  it("approves a review-required article that has a current audit", async () => {
    const current = withCurrentAudit("review-required", "review-required");
    const result = await transitionArticleLifecycle(
      {
        articleId: current.id,
        transition: "approve",
        actor: "editor@example.com",
        now: new Date("2026-09-16T00:00:00.000Z"),
      },
      storeFor(current),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.article.status).toBe("approved");
  });

  it("refuses scheduling and publication when the current audit is not publish-ready", async () => {
    for (const transition of ["schedule", "publish"] as const) {
      const current = withCurrentAudit("review-required", "approved");
      const result = await transitionArticleLifecycle(
        {
          articleId: current.id,
          transition,
          actor: "editor@example.com",
          scheduledFor: new Date("2026-09-20T00:00:00.000Z"),
          now: new Date("2026-09-16T00:00:00.000Z"),
        },
        storeFor(current),
      );
      expect(result).toMatchObject({
        ok: false,
        code: "research_not_publishable",
        articleUnchanged: true,
      });
    }
  });

  it("allows scheduling when the current audit is publish-ready at the stored thresholds", async () => {
    const current = withCurrentAudit("publish-ready", "approved");
    current.researchAudits[0].consensusScore = 80;
    current.researchAudits[0].sourceQualityScore = 70;
    const result = await transitionArticleLifecycle(
      {
        articleId: current.id,
        transition: "schedule",
        actor: "editor@example.com",
        scheduledFor: new Date("2026-09-20T00:00:00.000Z"),
        now: new Date("2026-09-16T00:00:00.000Z"),
      },
      storeFor(current),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.article.status).toBe("scheduled");
  });
});

describe("prepareArticleForReview evidence completeness", () => {
  it("stores no recommendation when accepted evidence is missing", async () => {
    const content =
      "NIST reports that organizations use a risk management framework for artificial intelligence systems. See [NIST](https://www.nist.gov/ai).";
    const article: PrepareForReviewArticle = {
      id: "article-empty-evidence",
      title: "Empty evidence",
      slug: "empty-evidence",
      category: "ai-tools",
      status: "draft",
      excerpt: "A source is listed.",
      content,
      featuredImage: null,
      seoTitle: "Empty evidence",
      seoDescription: "A source is listed but no text was accepted.",
      seoKeywords: "nist",
      researchSources: [],
      researchAudits: [],
      reviewNotes: [],
    };
    const store: PrepareForReviewStore = {
      article: {
        findUnique: async () => article,
        update: async () => article,
      },
      articleResearchAudit: {
        create: async () => ({
          id: "audit-empty",
          createdAt: new Date("2026-11-04T00:00:00.000Z"),
        }),
      },
      articleReviewNote: {
        create: async () => ({ id: "note-empty" }),
      },
      $queryRaw: async () => [{ id: article.id }],
      $transaction: async (fn) =>
        fn({
          article: store.article,
          articleResearchAudit: store.articleResearchAudit,
          articleReviewNote: store.articleReviewNote,
          $queryRaw: store.$queryRaw,
        }),
    };
    const result = await prepareArticleForReview(article.id, {
      prisma: store,
      collectEvidence: async () => ({
        topic: article.title,
        evidence: [],
        evidenceCount: 0,
        registryStatus: "ok",
      }),
    });
    expect(result).toMatchObject({
      ok: false,
      code: "missing_evidence",
      articleUnchanged: true,
    });
  });
});

describe("audit recommendation integration paths", () => {
  const root = process.cwd();

  it("applies the same safeguard before every supported publication gate", () => {
    const prepare = readFileSync(
      path.join(root, "lib/research/prepare-article-for-review.ts"),
      "utf8",
    );
    expect(prepare).toContain("recommendationWithEvidenceCompleteness");
    expect(prepare).toContain("publicationGate({");
    expect(prepare).not.toContain("publicationGate(consensus)");
    expect(prepare).not.toContain("recommendationWithUnscoredClaims(");

    for (const relative of [
      "app/api/ai/generate-article/route.ts",
      "app/api/execution/generate-mdx/route.ts",
      "app/api/research/publication-gate/route.ts",
    ]) {
      const source = readFileSync(path.join(root, relative), "utf8");
      expect(source).toContain("recommendationWithEvidenceCompleteness");
      expect(source).toContain("publicationGate(governedConsensus)");
      expect(source).not.toContain("publicationGate(consensus)");
    }
  });
});
