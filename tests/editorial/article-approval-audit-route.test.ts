import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const findUnique = vi.fn();
const update = vi.fn();
const createReviewNote = vi.fn();
const autoGenerateSocialPosts = vi.fn();
const transitionArticleLifecycle = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      update: (...args: unknown[]) => update(...args),
    },
    articleReviewNote: {
      create: (...args: unknown[]) => createReviewNote(...args),
    },
  },
}));

vi.mock("../../lib/social/auto-generate-social", () => ({
  autoGenerateSocialPosts: (...args: unknown[]) =>
    autoGenerateSocialPosts(...args),
}));

vi.mock("../../lib/publishing/article-lifecycle", () => ({
  transitionArticleLifecycle: (...args: unknown[]) =>
    transitionArticleLifecycle(...args),
}));

const article = {
  id: "article-1",
  title: "Governed AI workflows",
  excerpt: "Evidence-backed operations.",
  content: "See [NIST](https://www.nist.gov/artificial-intelligence).",
  category: "ai-tools",
  seoTitle: "Governed AI workflows",
  seoDescription: "Build accountable AI workflows.",
  seoKeywords: "AI governance",
  featuredImage: null,
  status: "review-required",
  researchSources: [],
};

describe("POST /api/articles/approve audit currency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", email: "admin@example.com" } },
      error: null,
    });
    update.mockResolvedValue({ ...article, status: "approved" });
    createReviewNote.mockResolvedValue({ id: "note-1" });
  });

  it("rejects approval when only stale and legacy audits exist", async () => {
    transitionArticleLifecycle.mockResolvedValue({
      ok: false,
      code: "stale_audit",
      error:
        "A current research audit matching this content revision is required.",
      articleUnchanged: true,
    });

    const { POST } = await import("../../app/api/articles/approve/route");
    const response = await POST(
      new NextRequest("http://localhost/api/articles/approve", {
        method: "POST",
        body: JSON.stringify({ articleId: article.id }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toContain("current research audit");
    expect(body.articleUnchanged).toBe(true);
    expect(update).not.toHaveBeenCalled();
    expect(createReviewNote).not.toHaveBeenCalled();
  });

  it("allows approval when an audit matches the current content revision", async () => {
    transitionArticleLifecycle.mockResolvedValue({
      ok: true,
      article: { ...article, status: "approved" },
      alreadyApplied: false,
    });

    const { POST } = await import("../../app/api/articles/approve/route");
    const response = await POST(
      new NextRequest("http://localhost/api/articles/approve", {
        method: "POST",
        body: JSON.stringify({ articleId: article.id }),
      }),
    );

    expect(response.status).toBe(200);
    expect(transitionArticleLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({
        articleId: article.id,
        transition: "approve",
        actor: "admin@example.com",
      }),
      expect.objectContaining({ prisma: expect.anything() }),
    );
  });
});

describe("PATCH /api/articles/[id] audit currency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", email: "admin@example.com" } },
      error: null,
    });
    update.mockResolvedValue({ ...article, status: "published" });
    autoGenerateSocialPosts.mockResolvedValue({
      ok: true,
      posts: [],
      reason: "No social drafts required",
    });
  });

  it.each(["approved", "scheduled", "published"])(
    "rejects the governed %s transition and performs no write",
    async (status) => {
      const { PATCH } = await import("../../app/api/articles/[id]/route");
      const response = await PATCH(
        new Request(`http://localhost/api/articles/${article.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }),
        { params: Promise.resolve({ id: article.id }) },
      );
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body).toMatchObject({
        ok: false,
        articleUnchanged: true,
      });
      expect(body.error).toContain("dedicated");
      expect(update).not.toHaveBeenCalled();
      expect(autoGenerateSocialPosts).not.toHaveBeenCalled();
    },
  );
});
