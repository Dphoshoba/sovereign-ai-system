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
  });
});
