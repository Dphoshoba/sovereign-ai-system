import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetUser = vi.fn();
const transitionArticleLifecycle = vi.fn();
const articleFindUnique = vi.fn();
const articleUpdate = vi.fn();
const reviewNoteCreate = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("../../lib/publishing/article-lifecycle", () => ({
  transitionArticleLifecycle: (...args: unknown[]) =>
    transitionArticleLifecycle(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: {
      findUnique: (...args: unknown[]) => articleFindUnique(...args),
      update: (...args: unknown[]) => articleUpdate(...args),
    },
    articleReviewNote: {
      create: (...args: unknown[]) => reviewNoteCreate(...args),
    },
  },
}));

const article = { id: "article-1", status: "rejected" };

function post(path: string, body: Record<string, unknown>) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("reject and archive lifecycle routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", email: "admin@example.com" } },
      error: null,
    });
    articleFindUnique.mockResolvedValue({ id: article.id, status: "review-required" });
    articleUpdate.mockResolvedValue(article);
    reviewNoteCreate.mockResolvedValue({ id: "note-1" });
    transitionArticleLifecycle.mockResolvedValue({
      ok: true,
      article,
      alreadyApplied: false,
      articleUnchanged: false,
    });
  });

  it("requires authentication for rejection", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { POST } = await import("../../app/api/articles/reject/route");

    const response = await POST(
      post("/api/articles/reject", { articleId: article.id }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "AUTHENTICATION_REQUIRED",
      articleUnchanged: true,
    });
    expect(transitionArticleLifecycle).not.toHaveBeenCalled();
    expect(articleUpdate).not.toHaveBeenCalled();
    expect(reviewNoteCreate).not.toHaveBeenCalled();
  });

  it("requires authentication for archival", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { POST } = await import("../../app/api/articles/archive/route");

    const response = await POST(
      post("/api/articles/archive", { articleId: article.id }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "AUTHENTICATION_REQUIRED",
      articleUnchanged: true,
    });
    expect(transitionArticleLifecycle).not.toHaveBeenCalled();
    expect(articleUpdate).not.toHaveBeenCalled();
  });

  it("delegates rejection with authenticated reviewer and reason", async () => {
    const { POST } = await import("../../app/api/articles/reject/route");

    const response = await POST(
      post("/api/articles/reject", {
        articleId: article.id,
        rejectedBy: "spoofed reviewer",
        rejectionReason: "Evidence needs revision.",
      }),
    );

    expect(response.status).toBe(200);
    expect(transitionArticleLifecycle).toHaveBeenCalledWith(
      {
        articleId: article.id,
        transition: "reject",
        actor: "admin@example.com",
        reviewNote: "Evidence needs revision.",
      },
      expect.any(Object),
    );
    expect(articleUpdate).not.toHaveBeenCalled();
    expect(reviewNoteCreate).not.toHaveBeenCalled();
  });

  it("delegates archival and preserves idempotent service results", async () => {
    transitionArticleLifecycle.mockResolvedValue({
      ok: true,
      article: { id: article.id, status: "archived" },
      alreadyApplied: true,
      articleUnchanged: true,
    });
    const { POST } = await import("../../app/api/articles/archive/route");

    const response = await POST(
      post("/api/articles/archive", { articleId: article.id }),
    );

    expect(response.status).toBe(200);
    expect(transitionArticleLifecycle).toHaveBeenCalledWith(
      {
        articleId: article.id,
        transition: "archive",
        actor: "admin@example.com",
      },
      expect.any(Object),
    );
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      alreadyApplied: true,
      articleUnchanged: true,
    });
    expect(articleUpdate).not.toHaveBeenCalled();
  });

  it("returns a governed no-write rejection for an invalid transition", async () => {
    transitionArticleLifecycle.mockResolvedValue({
      ok: false,
      code: "invalid_status",
      error: "Invalid rejection transition.",
      articleUnchanged: true,
    });
    const { POST } = await import("../../app/api/articles/reject/route");

    const response = await POST(
      post("/api/articles/reject", { articleId: article.id }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "invalid_status",
      articleUnchanged: true,
    });
    expect(articleUpdate).not.toHaveBeenCalled();
  });
});
