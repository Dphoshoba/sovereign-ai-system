import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { AUTHENTICATION_REQUIRED_BODY } from "../../lib/publishing/require-editor-auth";
import { ARTICLE_3_SAMUEL_17_32_AFTER } from "./fixtures/article-3-17-32-correction";

const mockGetUser = vi.fn();
const correctAndWithdrawPublishedArticle = vi.fn();
const updateArticleUnderGovernanceLock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

vi.mock("../../lib/publishing/article-lifecycle", () => ({
  correctAndWithdrawPublishedArticle: (...args: unknown[]) =>
    correctAndWithdrawPublishedArticle(...args),
  updateArticleUnderGovernanceLock: (...args: unknown[]) =>
    updateArticleUnderGovernanceLock(...args),
}));

const articleId = "cmqt9zmlv0000kcunwyw2bo0q";

function post(body: unknown) {
  return new NextRequest("http://localhost/api/articles/correct-and-unpublish", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/articles/correct-and-unpublish", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", email: "admin@example.com" } },
      error: null,
    });
    correctAndWithdrawPublishedArticle.mockResolvedValue({
      ok: true,
      article: { id: articleId, status: "review-required" },
      changedFields: ["content"],
      previousFingerprint: "a".repeat(64),
      newFingerprint: "b".repeat(64),
      articleUnchanged: false,
    });
  });

  it("requires authentication and performs no write", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { POST } = await import("../../app/api/articles/correct-and-unpublish/route");
    const response = await POST(
      post({
        articleId,
        reason: "Correct 1 Samuel 17:32.",
        changes: { content: ARTICLE_3_SAMUEL_17_32_AFTER },
      }),
    );
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY);
    expect(correctAndWithdrawPublishedArticle).not.toHaveBeenCalled();
  });

  it("delegates a valid correction to the locked service using the authenticated actor", async () => {
    const { POST } = await import("../../app/api/articles/correct-and-unpublish/route");
    const response = await POST(
      post({
        articleId,
        reason: "Correct 1 Samuel 17:32.",
        changes: { content: ARTICLE_3_SAMUEL_17_32_AFTER },
      }),
    );
    expect(response.status).toBe(200);
    expect(correctAndWithdrawPublishedArticle).toHaveBeenCalledWith(
      {
        articleId,
        reason: "Correct 1 Samuel 17:32.",
        changes: { content: ARTICLE_3_SAMUEL_17_32_AFTER },
        actor: "admin@example.com",
      },
      expect.objectContaining({ prisma: expect.anything() }),
    );
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      article: { id: articleId, status: "review-required" },
    });
  });

  it("rejects empty reason without calling the service", async () => {
    const { POST } = await import("../../app/api/articles/correct-and-unpublish/route");
    const response = await POST(
      post({
        articleId,
        reason: "   ",
        changes: { content: ARTICLE_3_SAMUEL_17_32_AFTER },
      }),
    );
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "invalid_request",
      articleUnchanged: true,
    });
    expect(correctAndWithdrawPublishedArticle).not.toHaveBeenCalled();
  });

  it("rejects forbidden lifecycle fields without calling the service", async () => {
    const { POST } = await import("../../app/api/articles/correct-and-unpublish/route");
    const response = await POST(
      post({
        articleId,
        reason: "Correct 1 Samuel 17:32.",
        changes: { content: ARTICLE_3_SAMUEL_17_32_AFTER },
        publishedAt: null,
      }),
    );
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "invalid_request",
      articleUnchanged: true,
    });
    expect(correctAndWithdrawPublishedArticle).not.toHaveBeenCalled();
  });

  it("maps a concurrent conflict to 409", async () => {
    correctAndWithdrawPublishedArticle.mockResolvedValue({
      ok: false,
      code: "correction_conflict",
      error: "This article is already withdrawn for correction.",
      articleUnchanged: true,
    });
    const { POST } = await import("../../app/api/articles/correct-and-unpublish/route");
    const response = await POST(
      post({
        articleId,
        reason: "Correct 1 Samuel 17:32.",
        changes: { content: ARTICLE_3_SAMUEL_17_32_AFTER },
      }),
    );
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "correction_conflict",
      articleUnchanged: true,
    });
  });
});

describe("generic PATCH remains unable to correct published content", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", email: "admin@example.com" } },
      error: null,
    });
    updateArticleUnderGovernanceLock.mockResolvedValue({
      ok: false,
      code: "published_immutable",
      error: "Published article content cannot be edited in place.",
      articleUnchanged: true,
    });
  });

  it("still returns published_immutable for audited content edits", async () => {
    const { PATCH } = await import("../../app/api/articles/[id]/route");
    const response = await PATCH(
      new Request(`http://localhost/api/articles/${articleId}`, {
        method: "PATCH",
        body: JSON.stringify({ content: ARTICLE_3_SAMUEL_17_32_AFTER }),
      }),
      { params: Promise.resolve({ id: articleId }) },
    );
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "published_immutable",
      articleUnchanged: true,
    });
    expect(updateArticleUnderGovernanceLock).toHaveBeenCalled();
    expect(correctAndWithdrawPublishedArticle).not.toHaveBeenCalled();
  });
});
