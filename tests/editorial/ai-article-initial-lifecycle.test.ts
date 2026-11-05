import { beforeEach, describe, expect, it, vi } from "vitest";

const articleCreate = vi.fn();
const articleFindFirst = vi.fn();
const articleFindUnique = vi.fn();
const articleUpdate = vi.fn();
const auditCreate = vi.fn();
const reviewNoteCreate = vi.fn();
const sourceCreate = vi.fn();
const sourceDeleteMany = vi.fn();
const sourceFindMany = vi.fn();
const factCreate = vi.fn();
const queryRaw = vi.fn();
const openAIResponsesCreate = vi.fn();
const prepareArticleForReview = vi.fn();

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
    deleteMany: (...args: unknown[]) => sourceDeleteMany(...args),
    findMany: (...args: unknown[]) => sourceFindMany(...args),
  },
  researchFact: { create: (...args: unknown[]) => factCreate(...args) },
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
vi.mock("../../lib/research/prepare-article-for-review", () => ({
  prepareArticleForReview: (...args: unknown[]) => prepareArticleForReview(...args),
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
    sourceFindMany.mockImplementation(async () => [...createdSources]);
    auditCreate.mockResolvedValue({
      id: "audit-1",
      articleId: "article-1",
      createdAt: new Date("2026-09-16T00:00:00.000Z"),
    });
    reviewNoteCreate.mockResolvedValue({ id: "note-1" });
    queryRaw.mockResolvedValue([{ id: "article-1" }]);
    prepareArticleForReview.mockResolvedValue({
      ok: true,
      articleUnchanged: false,
      article: {
        id: "article-1",
        status: "review-required",
        editorialScore: 70,
        editorialGrade: "B",
        qualityScore: 70,
        qualityGrade: "B",
        seoScore: 70,
        seoGrade: "B",
      },
      audit: {
        id: "grounded-1",
        createdAt: "2026-09-16T00:00:00.000Z",
        contentFingerprint: "a".repeat(64),
        engineRevision: "article-grounded-v14",
        sourceCount: 1,
        evidenceCount: 1,
        factCount: 1,
        verifiedCount: 0,
        partiallyVerifiedCount: 1,
        unverifiedCount: 0,
        consensusScore: 76,
        publicationRecommendation: "review-required",
        sourceCoverage: 1,
        listedSourceAvailability: 1,
        acceptedEvidenceCoverage: 1,
        unavailableSourceCount: 0,
        notScoredClaims: [],
      },
      sourceDiagnostics: [],
      preservedFields: [],
    });
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
    expect(auditCreate).not.toHaveBeenCalled();
    expect(reviewNoteCreate).not.toHaveBeenCalled();
    expect(prepareArticleForReview).toHaveBeenCalledWith(
      "article-1",
      expect.objectContaining({ reviewer: "system" }),
    );
  });

  it("passes the completeness recommendation to the template gate without storing it as the publication audit", async () => {
    const { consensusEngine } = await import("../../lib/research/consensus-engine");
    const { factVerificationEngine } = await import(
      "../../lib/research/fact-verification-engine"
    );
    const { publicationGate } = await import("../../lib/research/publication-gate");
    vi.mocked(consensusEngine).mockReturnValue({
      totalFacts: 1,
      verifiedFacts: 0,
      partiallyVerifiedFacts: 0,
      unverifiedFacts: 1,
      consensusScore: 92,
      sourceQualityScore: 100,
      consensusGroups: [],
      zeroSourceGroups: [],
      consensusGroupCount: 0,
      publicationRecommendation: "publish-ready",
      summary: "Scores pass while one claim is unverified.",
    });
    vi.mocked(factVerificationEngine).mockReturnValue({
      verifiedFacts: [
        {
          claim: "An unsupported product claim.",
          evidenceId: "",
          sourceTitle: "",
          sourceUrl: "",
          sourceType: "",
          evidenceText: "",
          confidence: "low",
          requiresHumanReview: true,
          verificationCount: 0,
          verificationStatus: "unverified",
          verificationMethod: "single-source-supported",
          supportingSources: [],
          verificationScore: 0,
        },
      ],
      verifiedCount: 0,
      partiallyVerifiedCount: 0,
      unverifiedCount: 1,
      averageVerificationScore: 0,
      publicationBlocked: true,
    });

    const { POST } = await import("../../app/api/ai/generate-article/route");
    const response = await POST(
      new Request("http://localhost/api/ai/generate-article", {
        method: "POST",
        body: JSON.stringify({ topic: "Governed generation", category: "ai-tools" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(vi.mocked(publicationGate)).toHaveBeenCalledWith(
      expect.objectContaining({
        consensusScore: 92,
        sourceQualityScore: 100,
        publicationRecommendation: "review-required",
      }),
    );
    expect(auditCreate).not.toHaveBeenCalled();
    expect(factCreate).not.toHaveBeenCalled();
    expect(reviewNoteCreate).not.toHaveBeenCalled();
    const body = await response.json();
    expect(body.publicationCleared).toBe(false);
    expect(body.sourceTemplate.publicationAuthorising).toBe(false);
    expect(body.article.status).toBe("review-required");
    expect(body.article.approvedAt).toBeNull();
    expect(body.article.scheduledFor).toBeNull();
    expect(body.article.publishedAt).toBeNull();
  });

  it("sends the saved article id to article-grounded review after the article is stored", async () => {
    const { POST } = await import("../../app/api/ai/generate-article/route");
    const { generateAndPersistFeaturedImage } = await import(
      "../../lib/ai/persist-featured-image"
    );

    const response = await POST(
      new Request("http://localhost/api/ai/generate-article", {
        method: "POST",
        body: JSON.stringify({ topic: "Governed generation", category: "ai-tools" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(articleCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "Governed generated article",
        excerpt: "Generated excerpt",
        content: "Generated content",
        status: "review-required",
      }),
    });
    expect(prepareArticleForReview).toHaveBeenCalledTimes(1);
    expect(prepareArticleForReview).toHaveBeenCalledWith(
      "article-1",
      expect.not.objectContaining({
        title: expect.anything(),
        excerpt: expect.anything(),
        content: expect.anything(),
      }),
    );
    expect(articleCreate.mock.invocationCallOrder[0]).toBeLessThan(
      prepareArticleForReview.mock.invocationCallOrder[0],
    );
    expect(prepareArticleForReview.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(generateAndPersistFeaturedImage).mock.invocationCallOrder[0],
    );
  });

  it("leaves a failed review as review-required with no publication clearance", async () => {
    prepareArticleForReview.mockResolvedValueOnce({
      ok: false,
      code: "insufficient_article_evidence",
      error: "No auditable claims occur in the current article.",
      articleUnchanged: true,
    });
    const { POST } = await import("../../app/api/ai/generate-article/route");

    const response = await POST(
      new Request("http://localhost/api/ai/generate-article", {
        method: "POST",
        body: JSON.stringify({ topic: "Governed generation", category: "ai-tools" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.publicationCleared).toBe(false);
    expect(body.articleReview).toMatchObject({
      ok: false,
      publicationCleared: false,
      code: "insufficient_article_evidence",
    });
    expect(body.article.status).toBe("review-required");
    expect(body.article.approvedAt).toBeNull();
    expect(body.article.scheduledFor).toBeNull();
    expect(body.article.publishedAt).toBeNull();
    expect(auditCreate).not.toHaveBeenCalled();
    expect(reviewNoteCreate).not.toHaveBeenCalled();
  });

  it("does not approve, schedule, publish, or distribute when the grounded review is publish-ready", async () => {
    prepareArticleForReview.mockResolvedValueOnce({
      ok: true,
      articleUnchanged: false,
      article: {
        id: "article-1",
        status: "review-required",
        editorialScore: 90,
        editorialGrade: "A",
        qualityScore: 90,
        qualityGrade: "A",
        seoScore: 90,
        seoGrade: "A",
      },
      audit: {
        id: "grounded-ready",
        createdAt: "2026-09-16T00:00:00.000Z",
        contentFingerprint: "b".repeat(64),
        engineRevision: "article-grounded-v14",
        sourceCount: 2,
        evidenceCount: 2,
        factCount: 1,
        verifiedCount: 1,
        partiallyVerifiedCount: 0,
        unverifiedCount: 0,
        consensusScore: 92,
        publicationRecommendation: "publish-ready",
        sourceCoverage: 1,
        listedSourceAvailability: 1,
        acceptedEvidenceCoverage: 1,
        unavailableSourceCount: 0,
        notScoredClaims: [],
      },
      sourceDiagnostics: [],
      preservedFields: [],
    });
    const { POST } = await import("../../app/api/ai/generate-article/route");

    const response = await POST(
      new Request("http://localhost/api/ai/generate-article", {
        method: "POST",
        body: JSON.stringify({ topic: "Governed generation", category: "ai-tools" }),
      }),
    );
    const body = await response.json();

    expect(body.publicationCleared).toBe(false);
    expect(body.article.status).toBe("review-required");
    expect(body.article.approvedAt).toBeNull();
    expect(body.article.approvedBy).toBeNull();
    expect(body.article.scheduledFor).toBeNull();
    expect(body.article.publishedAt).toBeNull();
    expect(body.articleReview.audit.publicationRecommendation).toBe("publish-ready");
    expect(articleUpdate).not.toHaveBeenCalled();
    expect(prepareArticleForReview).toHaveBeenCalledTimes(1);
  });
});
