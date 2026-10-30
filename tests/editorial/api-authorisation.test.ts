import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUTHENTICATION_REQUIRED_BODY } from "../../lib/publishing/require-editor-auth";

const mockGetUser = vi.fn();
const articleFindMany = vi.fn();
const articleDelete = vi.fn();
const subscriberFindMany = vi.fn();
const queueFindUnique = vi.fn();
const queueUpdate = vi.fn();
const transitionArticleLifecycle = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: {
      findMany: (...args: unknown[]) => articleFindMany(...args),
      delete: (...args: unknown[]) => articleDelete(...args),
    },
    subscriber: {
      findMany: (...args: unknown[]) => subscriberFindMany(...args),
    },
    publishingQueue: {
      findUnique: (...args: unknown[]) => queueFindUnique(...args),
      update: (...args: unknown[]) => queueUpdate(...args),
    },
  },
}));

vi.mock("../../lib/publishing/article-lifecycle", () => ({
  transitionArticleLifecycle: (...args: unknown[]) =>
    transitionArticleLifecycle(...args),
}));

const draft = {
  id: "article-draft",
  title: "Unpublished draft",
  slug: "unpublished-draft",
  status: "draft",
  content: "Private draft body",
};

const published = {
  id: "article-live",
  title: "Published piece",
  slug: "published-piece",
  status: "published",
  content: "Public body",
};

function session(user: { id: string; email: string } | null) {
  mockGetUser.mockResolvedValue({ data: { user }, error: null });
}

describe("private Prisma API authorisation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    session({ id: "operator-1", email: "operator@example.com" });
    articleFindMany.mockResolvedValue([draft, published]);
    articleDelete.mockResolvedValue({ id: draft.id });
    subscriberFindMany.mockResolvedValue([
      {
        email: "reader@example.com",
        status: "active",
        createdAt: new Date("2026-09-01T00:00:00.000Z"),
        updatedAt: new Date("2026-09-02T00:00:00.000Z"),
      },
    ]);
    queueFindUnique.mockResolvedValue({
      id: "queue-1",
      articleId: published.id,
      status: "queued",
    });
    queueUpdate.mockImplementation(async ({ data }) => ({
      id: "queue-1",
      ...data,
    }));
    transitionArticleLifecycle.mockResolvedValue({
      ok: true,
      article: {
        id: published.id,
        status: "published",
        publishedAt: new Date("2026-09-20T00:00:00.000Z"),
      },
      articleUnchanged: false,
    });
  });

  it("rejects an anonymous article list before reading rows", async () => {
    session(null);
    const { GET } = await import("../../app/api/articles/route");

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY);
    expect(articleFindMany).not.toHaveBeenCalled();
  });

  it("rejects an anonymous subscriber export before reading emails", async () => {
    session(null);
    const { GET } = await import("../../app/api/subscribers/export/route");

    const response = await GET();
    const body = await response.text();

    expect(response.status).toBe(401);
    expect(body).not.toContain("reader@example.com");
    expect(JSON.parse(body)).toEqual(AUTHENTICATION_REQUIRED_BODY);
    expect(subscriberFindMany).not.toHaveBeenCalled();
  });

  it("rejects an anonymous publishing status change before any queue read", async () => {
    session(null);
    const { POST } = await import("../../app/api/publishing/update-status/route");

    const response = await POST(
      new Request("http://localhost/api/publishing/update-status", {
        method: "POST",
        headers: { "x-user-role": "administrator", "x-user-id": "operator-1" },
        body: JSON.stringify({
          queueId: "queue-1",
          status: "published",
          userId: "operator-1",
          organizationId: "other-tenant",
          approvedBy: "spoofed-admin",
        }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY);
    expect(queueFindUnique).not.toHaveBeenCalled();
    expect(queueUpdate).not.toHaveBeenCalled();
    expect(transitionArticleLifecycle).not.toHaveBeenCalled();
  });

  it("rejects an anonymous article delete", async () => {
    session(null);
    const { DELETE } = await import("../../app/api/articles/[id]/route");

    const response = await DELETE(new Request("http://localhost/api/articles/article-draft"), {
      params: Promise.resolve({ id: "article-draft" }),
    });

    expect(response.status).toBe(401);
    expect(articleDelete).not.toHaveBeenCalled();
  });

  it("returns unpublished articles only after a verified session", async () => {
    const { GET } = await import("../../app/api/articles/route");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.articles).toEqual([draft, published]);
    expect(articleFindMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });
  });

  it("exports subscribers only for a verified session and ignores a client role", async () => {
    session({ id: "operator-2", email: "second@example.com" });
    const { GET } = await import("../../app/api/subscribers/export/route");

    const response = await GET();
    const csv = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(csv).toContain("reader@example.com");
    expect(subscriberFindMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });
  });

  it("publishes through the lifecycle guard using the server session actor", async () => {
    const { POST } = await import("../../app/api/publishing/update-status/route");

    const response = await POST(
      new Request("http://localhost/api/publishing/update-status", {
        method: "POST",
        headers: { "x-user-role": "viewer" },
        body: JSON.stringify({
          queueId: "queue-1",
          status: "published",
          approvedBy: "spoofed-admin",
          userId: "someone-else",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(transitionArticleLifecycle).toHaveBeenCalledWith(
      {
        articleId: published.id,
        transition: "publish",
        queueId: "queue-1",
        actor: "operator@example.com",
      },
      { prisma: expect.anything() },
    );
    expect(queueUpdate).not.toHaveBeenCalled();
  });

  it("keeps a rejected publication from writing the queue", async () => {
    transitionArticleLifecycle.mockResolvedValue({
      ok: false,
      code: "invalid_status",
      error: "Article must be approved before publishing.",
      articleUnchanged: true,
    });
    const { POST } = await import("../../app/api/publishing/update-status/route");

    const response = await POST(
      new Request("http://localhost/api/publishing/update-status", {
        method: "POST",
        body: JSON.stringify({ queueId: "queue-1", status: "published" }),
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      articleUnchanged: true,
    });
    expect(queueUpdate).not.toHaveBeenCalled();
  });

  it("does not approve an article when a queue status is changed", async () => {
    const { POST } = await import("../../app/api/publishing/update-status/route");

    const response = await POST(
      new Request("http://localhost/api/publishing/update-status", {
        method: "POST",
        body: JSON.stringify({
          queueId: "queue-1",
          status: "approved",
          approvedBy: "spoofed-admin",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(transitionArticleLifecycle).not.toHaveBeenCalled();
    expect(queueUpdate).toHaveBeenCalledWith({
      where: { id: "queue-1" },
      data: { status: "approved", publishedAt: null },
    });
  });

  it("gives every verified session the same unscoped article list", async () => {
    const { GET } = await import("../../app/api/articles/route");

    session({ id: "operator-1", email: "operator@example.com" });
    await GET();
    session({ id: "operator-2", email: "second@example.com" });
    await GET();

    expect(articleFindMany).toHaveBeenCalledTimes(2);
    expect(articleFindMany.mock.calls[0]).toEqual(articleFindMany.mock.calls[1]);
    expect(JSON.stringify(articleFindMany.mock.calls[0])).not.toContain("operator-2");
  });
});
