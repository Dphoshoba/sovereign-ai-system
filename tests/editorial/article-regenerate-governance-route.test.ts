import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const articleFindUnique = vi.fn();
const articleUpdate = vi.fn();
const updateArticleUnderGovernanceLock = vi.fn();
const chatCreate = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: {
      findUnique: (...args: unknown[]) => articleFindUnique(...args),
      update: (...args: unknown[]) => articleUpdate(...args),
    },
  },
}));

vi.mock("@/lib/ai/openai", () => ({
  getOpenAI: vi.fn(() => ({
    chat: { completions: { create: (...args: unknown[]) => chatCreate(...args) } },
  })),
}));

vi.mock("../../lib/publishing/article-lifecycle", () => ({
  updateArticleUnderGovernanceLock: (...args: unknown[]) =>
    updateArticleUnderGovernanceLock(...args),
}));

const sourceArticle = {
  id: "article-1",
  title: "Draft title",
  category: "ai-tools",
  status: "approved",
};
const generated = {
  excerpt: "Generated excerpt",
  seoTitle: "Generated SEO title",
  seoDescription: "Generated SEO description",
  content: "Generated content",
  faq: [{ question: "Why?", answer: "Because." }],
};

function request() {
  return new NextRequest("http://localhost/api/articles/generate", {
    method: "POST",
    body: JSON.stringify({ articleId: sourceArticle.id }),
  });
}

describe("POST /api/articles/generate governance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", email: "admin@example.com" } },
      error: null,
    });
    articleFindUnique.mockResolvedValue(sourceArticle);
    chatCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(generated) } }],
    });
    updateArticleUnderGovernanceLock.mockResolvedValue({
      ok: true,
      article: {
        ...sourceArticle,
        ...generated,
        status: "review-required",
        approvedAt: null,
        approvedBy: null,
        scheduledFor: null,
        publishedAt: null,
      },
      alreadyApplied: false,
      articleUnchanged: false,
    });
  });

  it("routes generated content through the governed locked update", async () => {
    const { POST } = await import("../../app/api/articles/generate/route");

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(updateArticleUnderGovernanceLock).toHaveBeenCalledWith(
      {
        articleId: sourceArticle.id,
        changes: {
          excerpt: generated.excerpt,
          seoTitle: generated.seoTitle,
          seoDescription: generated.seoDescription,
          content: generated.content,
          status: "review-required",
        },
      },
      expect.any(Object),
    );
    expect(articleUpdate).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      article: {
        status: "review-required",
        approvedAt: null,
        approvedBy: null,
        scheduledFor: null,
      },
      faq: generated.faq,
    });
  });

  it("refuses to alter a published article", async () => {
    updateArticleUnderGovernanceLock.mockResolvedValue({
      ok: false,
      code: "published_immutable",
      error: "Published article content cannot be edited in place.",
      articleUnchanged: true,
    });
    const { POST } = await import("../../app/api/articles/generate/route");

    const response = await POST(request());

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "published_immutable",
      articleUnchanged: true,
    });
    expect(articleUpdate).not.toHaveBeenCalled();
  });
});
