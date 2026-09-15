import { beforeEach, describe, expect, it, vi } from "vitest";

const articleCreate = vi.fn();
const articleFindFirst = vi.fn();
const mockGetUser = vi.fn();
const openAIResponsesCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: {
      findMany: vi.fn(async () => []),
      findFirst: (...args: unknown[]) => articleFindFirst(...args),
      create: (...args: unknown[]) => articleCreate(...args),
    },
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("@/lib/ai/openai", () => ({
  getOpenAI: vi.fn(() => ({
    responses: { create: (...args: unknown[]) => openAIResponsesCreate(...args) },
  })),
}));

function request(body: Record<string, unknown>) {
  return new Request("http://localhost/api/articles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Governed draft",
      slug: "governed-draft",
      category: "ai-tools",
      ...body,
    }),
  });
}

describe("POST /api/articles creation governance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", email: "admin@example.com" } },
      error: null,
    });
    articleCreate.mockImplementation(async ({ data }) => ({
      id: "article-1",
      ...data,
    }));
  });

  it("requires authentication before creating an article", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { POST } = await import("../../app/api/articles/route");

    const response = await POST(request({ status: "draft" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "AUTHENTICATION_REQUIRED",
      articleUnchanged: true,
    });
    expect(articleCreate).not.toHaveBeenCalled();
  });

  it.each(["approved", "scheduled", "published", "rejected", "archived"])(
    "rejects governed initial status %s without a write",
    async (status) => {
      const { POST } = await import("../../app/api/articles/route");

      const response = await POST(request({ status }));

      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toMatchObject({
        ok: false,
        code: "GOVERNED_INITIAL_STATUS_NOT_ALLOWED",
        articleUnchanged: true,
      });
      expect(articleCreate).not.toHaveBeenCalled();
    },
  );

  it.each(["approvedAt", "approvedBy", "scheduledFor", "publishedAt"])(
    "rejects caller-supplied lifecycle field %s without a write",
    async (field) => {
      const { POST } = await import("../../app/api/articles/route");

      const response = await POST(request({ status: "draft", [field]: "spoofed" }));

      expect(response.status).toBe(422);
      await expect(response.json()).resolves.toMatchObject({
        ok: false,
        code: "LIFECYCLE_METADATA_NOT_ALLOWED",
        articleUnchanged: true,
      });
      expect(articleCreate).not.toHaveBeenCalled();
    },
  );

  it.each(["draft", "review", "review-required"])(
    "creates a legitimate manual %s article with null lifecycle metadata",
    async (status) => {
      const { POST } = await import("../../app/api/articles/route");

      const response = await POST(request({ status, content: "Manual content" }));

      expect(response.status).toBe(200);
      expect(articleCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status,
          approvedAt: null,
          approvedBy: null,
          scheduledFor: null,
          publishedAt: null,
          content: "Manual content",
        }),
      });
    },
  );
});

describe("POST /api/ai/autonomous-pipeline lifecycle governance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    articleFindFirst.mockResolvedValue(null);
    openAIResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify({
        title: "Generated package",
        excerpt: "Generated excerpt",
        content: "Generated content",
        seoTitle: "Generated SEO title",
        seoDescription: "Generated SEO description",
        seoKeywords: "generated, governed, article",
        thumbnailText: "Generated",
        thumbnailPrompt: "A governed workflow",
        socialPosts: ["One post"],
        newsletterSubject: "Generated subject",
        newsletterBody: "Generated newsletter",
      }),
    });
    articleCreate.mockImplementation(async ({ data }) => ({
      id: "article-generated",
      ...data,
    }));
  });

  it.each(["publish", "schedule"])(
    "routes requested %s mode into human review instead",
    async (mode) => {
      const { POST } = await import("../../app/api/ai/autonomous-pipeline/route");
      const response = await POST(
        new Request("http://localhost/api/ai/autonomous-pipeline", {
          method: "POST",
          body: JSON.stringify({
            topic: "Governed automation",
            category: "ai-tools",
            mode,
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
      await expect(response.json()).resolves.toMatchObject({
        ok: true,
        article: { status: "review-required" },
        workflow: {
          status: "review-required",
          requiresHumanReview: true,
        },
      });
    },
  );
});
