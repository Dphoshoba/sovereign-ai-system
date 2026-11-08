import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateAndPersistFeaturedImage } from "../../lib/ai/persist-featured-image";
import { factVerificationEngine } from "../../lib/research/fact-verification-engine";
import { sourceCollector } from "../../lib/research/source-collector";
import { prisma } from "@/lib/prisma";

const articleCreate = vi.fn();
const articleFindFirst = vi.fn();
const articleFindUnique = vi.fn();
const articleUpdate = vi.fn();
const auditCreate = vi.fn();
const reviewNoteCreate = vi.fn();
const sourceCreate = vi.fn();
const sourceCreateMany = vi.fn();
const sourceDeleteMany = vi.fn();
const sourceFindMany = vi.fn();
const factCreate = vi.fn();
const factCreateMany = vi.fn();
const queryRaw = vi.fn();
const openAIResponsesCreate = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: "editor-1", email: "editor@example.com", app_metadata: { role: "editor" } } },
        error: null,
      })),
    },
  })),
}));

const createdSources: unknown[] = [];
const tx = {
  article: {
    create: (...args: unknown[]) => articleCreate(...args),
    findUnique: (...args: unknown[]) => articleFindUnique(...args),
    update: (...args: unknown[]) => articleUpdate(...args),
  },
  articleResearchAudit: { create: (...args: unknown[]) => auditCreate(...args) },
  articleReviewNote: { create: (...args: unknown[]) => reviewNoteCreate(...args) },
  researchSource: {
    create: (...args: unknown[]) => sourceCreate(...args),
    createMany: (...args: unknown[]) => sourceCreateMany(...args),
    deleteMany: (...args: unknown[]) => sourceDeleteMany(...args),
    findMany: (...args: unknown[]) => sourceFindMany(...args),
  },
  researchFact: {
    create: (...args: unknown[]) => factCreate(...args),
    createMany: (...args: unknown[]) => factCreateMany(...args),
  },
  $queryRaw: (...args: unknown[]) => queryRaw(...args),
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: { findFirst: (...args: unknown[]) => articleFindFirst(...args) },
    $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  },
}));

vi.mock("@/lib/ai/openai", () => ({
  getOpenAI: vi.fn(() => ({
    responses: { create: (...args: unknown[]) => openAIResponsesCreate(...args) },
  })),
}));
vi.mock("@/lib/ai/memory-context", () => ({
  getMemoryContext: vi.fn(async () => ""),
}));
vi.mock("../../lib/research/source-collector", () => ({
  sourceCollector: vi.fn(async () => ({
    collectedSources: [],
    sourceCount: 0,
    averageAuthorityScore: 0,
    averageTrustScore: 0,
    researchConfidence: 0,
  })),
}));
vi.mock("../../lib/research/evidence-registry", () => ({
  evidenceRegistry: vi.fn(async () => ({ evidence: [], evidenceCount: 0 })),
}));
vi.mock("../../lib/research/fact-extractor", () => ({
  factExtractor: vi.fn(() => ({ facts: [], factCount: 0 })),
}));
vi.mock("../../lib/research/fact-verification-engine", () => ({
  factVerificationEngine: vi.fn(() => ({
    verifiedFacts: [],
    verifiedCount: 0,
    partiallyVerifiedCount: 0,
    unverifiedCount: 0,
    averageVerificationScore: 0,
  })),
}));
vi.mock("../../lib/research/consensus-engine", () => ({
  consensusEngine: vi.fn(() => ({
    consensusGroups: [],
    consensusGroupCount: 0,
    consensusScore: 0,
    sourceQualityScore: 0,
    publicationRecommendation: "review",
  })),
}));
vi.mock("../../lib/research/publication-gate", () => ({
  publicationGate: vi.fn(() => ({ status: "review" })),
}));
vi.mock("../../lib/research/encoding-normalizer", () => ({
  encodingNormalizer: (value: string) => value,
}));
vi.mock("../../lib/research/content-safe-normalizer", () => ({
  contentSafeNormalizer: (value: string) => value,
}));
vi.mock("../../lib/editorial/quality-score", () => ({
  calculateEditorialQualityScore: vi.fn(() => ({
    score: 50,
    grade: "review",
    warnings: [],
  })),
}));
vi.mock("../../lib/editorial/article-quality-scorer", () => ({
  articleQualityScorer: vi.fn(() => ({ score: 50, grade: "review", checks: [] })),
}));
vi.mock("../../lib/editorial/seo-scorer", () => ({
  seoScorer: vi.fn(() => ({ score: 50, grade: "review", checks: [] })),
}));
vi.mock("../../lib/ai/persist-featured-image", () => ({
  generateAndPersistFeaturedImage: vi.fn(async () => ({
    ok: true,
    articleUnchanged: true,
  })),
}));

describe("POST /api/ai/generate-article initial lifecycle state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createdSources.splice(0, createdSources.length);
    process.env.OPENAI_API_KEY = "test-key";
    articleFindFirst.mockResolvedValue(null);
    openAIResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify({
        title: "Governed generated article",
        excerpt: "Generated excerpt",
        content: "Generated content",
        seoTitle: "Governed generated article",
        seoDescription: "Generated description",
        seoKeywords: "governed, generated, article",
        faq: [],
      }),
    });
    articleCreate.mockImplementation(async ({ data }) => ({
      id: "article-1",
      ...data,
    }));
    articleFindUnique.mockImplementation(async () => ({
      id: "article-1",
      status: "review-required",
      approvedAt: null,
      approvedBy: null,
      scheduledFor: null,
      publishedAt: null,
    }));
    articleUpdate.mockImplementation(async ({ data }) => ({
      id: "article-1",
      ...data,
    }));
    sourceDeleteMany.mockResolvedValue({ count: 0 });
    sourceCreate.mockImplementation(async ({ data }) => {
      createdSources.push(data);
      return { id: `source-${createdSources.length}`, ...data };
    });
    sourceCreateMany.mockImplementation(async ({ data }) => {
      createdSources.push(...data);
      return { count: data.length };
    });
    factCreateMany.mockResolvedValue({ count: 0 });
    sourceFindMany.mockImplementation(async () => [...createdSources]);
    auditCreate.mockResolvedValue({
      id: "audit-1",
      articleId: "article-1",
      createdAt: new Date("2026-09-16T00:00:00.000Z"),
    });
    reviewNoteCreate.mockResolvedValue({ id: "note-1" });
    queryRaw.mockResolvedValue([{ id: "article-1" }]);
  });

  it("creates only review-required content with null lifecycle metadata", async () => {
    const { POST } = await import("../../app/api/ai/generate-article/route");

    const response = await POST(
      new Request("http://localhost/api/ai/generate-article", {
        method: "POST",
        body: JSON.stringify({
          topic: "Governed generation",
          category: "ai-tools",
          scheduledFor: "2026-09-20T10:00:00+09:30",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(articleCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: "review-required",
        approvedAt: null,
        approvedBy: null,
        scheduledFor: null,
        publishedAt: null,
      }),
    });
    expect(sourceCreateMany).not.toHaveBeenCalled();
    expect(factCreateMany).not.toHaveBeenCalled();
    expect(sourceCreate).not.toHaveBeenCalled();
    expect(factCreate).not.toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      timeout: 10_000,
    });
    expect(articleCreate).toHaveBeenCalledTimes(1);
    expect(auditCreate).toHaveBeenCalledTimes(1);
    expect(reviewNoteCreate).toHaveBeenCalledTimes(1);
    const body = await response.json();
    expect(body.article).toEqual(
      expect.objectContaining({
        status: "review-required",
        approvedAt: null,
        approvedBy: null,
        scheduledFor: null,
        publishedAt: null,
      }),
    );
    expect(body.article.status).not.toBe("published");
    expect(generateAndPersistFeaturedImage).toHaveBeenCalledTimes(1);
    expect(
      vi.mocked(generateAndPersistFeaturedImage).mock.invocationCallOrder[0],
    ).toBeGreaterThan(
      vi.mocked(prisma.$transaction).mock.invocationCallOrder[0],
    );
  });

  it("writes multiple sources and facts with one createMany each", async () => {
    vi.mocked(sourceCollector).mockResolvedValueOnce({
      topic: "Governed generation",
      collectedSources: [
        {
          title: "Primary source",
          url: "https://example.com/primary",
          sourceType: "primary",
          authorityScore: 90,
          trustScore: 88,
          relevanceScore: 80,
        },
        {
          title: "Secondary source",
          url: "https://example.com/secondary",
          sourceType: "secondary",
          authorityScore: 70,
          trustScore: 66,
          relevanceScore: 60,
        },
      ],
      sourceCount: 2,
      averageAuthorityScore: 80,
      averageTrustScore: 77,
      researchConfidence: 80,
      collectionStatus: "collected",
    });
    vi.mocked(factVerificationEngine).mockReturnValueOnce({
      verifiedFacts: [
        {
          claim: "First verified claim",
          evidenceId: "evidence-1",
          sourceTitle: "Primary source",
          sourceUrl: "https://example.com/primary",
          sourceType: "primary",
          evidenceText: "Primary evidence",
          confidence: "high",
          requiresHumanReview: true,
          verificationCount: 2,
          verificationStatus: "verified",
          verificationMethod: "exact",
          supportingSources: [
            {
              sourceTitle: "Primary source",
              sourceUrl: "https://example.com/primary",
              evidenceId: "evidence-1",
            },
          ],
          verificationScore: 90,
        },
        {
          claim: "Second verified claim",
          evidenceId: "evidence-2",
          sourceTitle: "Secondary source",
          sourceUrl: "https://example.com/secondary",
          sourceType: "secondary",
          evidenceText: "Secondary evidence",
          confidence: "medium",
          requiresHumanReview: true,
          verificationCount: 1,
          verificationStatus: "partially verified",
          verificationMethod: "semantic",
          supportingSources: [
            {
              sourceTitle: "Secondary source",
              sourceUrl: "https://example.com/secondary",
              evidenceId: "evidence-2",
            },
          ],
          verificationScore: 60,
        },
      ],
      verifiedCount: 1,
      partiallyVerifiedCount: 1,
      unverifiedCount: 0,
      averageVerificationScore: 75,
      publicationBlocked: false,
    });
    const { POST } = await import("../../app/api/ai/generate-article/route");

    const response = await POST(
      new Request("http://localhost/api/ai/generate-article", {
        method: "POST",
        body: JSON.stringify({
          topic: "Governed generation",
          category: "ai-tools",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(sourceCreateMany).toHaveBeenCalledTimes(1);
    expect(sourceCreate).not.toHaveBeenCalled();
    expect(sourceCreateMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          articleId: "article-1",
          title: "Primary source",
          url: "https://example.com/primary",
          authorityScore: 90,
          trustScore: 88,
          sourceType: "primary",
          category: "ai-tools",
        }),
        expect.objectContaining({
          title: "Secondary source",
          url: "https://example.com/secondary",
        }),
      ],
    });
    expect(factCreateMany).toHaveBeenCalledTimes(1);
    expect(factCreate).not.toHaveBeenCalled();
    expect(factCreateMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          articleId: "article-1",
          claim: "First verified claim",
          verificationStatus: "verified",
          confidence: "high",
          supportingSources: [
            {
              sourceTitle: "Primary source",
              sourceUrl: "https://example.com/primary",
              evidenceId: "evidence-1",
            },
          ],
          category: "ai-tools",
        }),
        expect.objectContaining({
          claim: "Second verified claim",
          verificationStatus: "partially verified",
        }),
      ],
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(auditCreate).toHaveBeenCalledTimes(1);
    expect(reviewNoteCreate).toHaveBeenCalledTimes(1);
    const body = await response.json();
    expect(body.article.status).toBe("review-required");
    expect(body.article.approvedAt).toBeNull();
    expect(body.article.scheduledFor).toBeNull();
    expect(body.article.publishedAt).toBeNull();
  });

  it("does not generate a featured image when the transaction fails", async () => {
    vi.mocked(factVerificationEngine).mockReturnValueOnce({
      verifiedFacts: [
        {
          claim: "A claim that never commits",
          evidenceId: "evidence-3",
          sourceTitle: "Primary source",
          sourceUrl: "https://example.com/primary",
          sourceType: "primary",
          evidenceText: "Uncommitted evidence",
          confidence: "high",
          requiresHumanReview: true,
          verificationCount: 1,
          verificationStatus: "verified",
          verificationMethod: "exact",
          supportingSources: [],
          verificationScore: 80,
        },
      ],
      verifiedCount: 1,
      partiallyVerifiedCount: 0,
      unverifiedCount: 0,
      averageVerificationScore: 80,
      publicationBlocked: false,
    });
    factCreateMany.mockRejectedValueOnce(new Error("write failed"));
    const { POST } = await import("../../app/api/ai/generate-article/route");

    const response = await POST(
      new Request("http://localhost/api/ai/generate-article", {
        method: "POST",
        body: JSON.stringify({
          topic: "Governed generation",
          category: "ai-tools",
        }),
      }),
    );

    expect(response.status).toBe(500);
    expect(factCreateMany).toHaveBeenCalledTimes(1);
    expect(generateAndPersistFeaturedImage).not.toHaveBeenCalled();
    expect(openAIResponsesCreate).toHaveBeenCalledTimes(1);
  });
});
