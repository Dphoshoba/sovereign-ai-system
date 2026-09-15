import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const transitionArticleLifecycle = vi.fn();
const articleFindUnique = vi.fn();
const articleFindFirst = vi.fn();
const articleUpdate = vi.fn();
const queueFindUnique = vi.fn();
const queueUpdate = vi.fn();
const newsletterUpdateMany = vi.fn();
const socialFindMany = vi.fn();
const socialUpdateMany = vi.fn();
const autoGenerateSocialPosts = vi.fn();
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
      findFirst: (...args: unknown[]) => articleFindFirst(...args),
      update: (...args: unknown[]) => articleUpdate(...args),
    },
    publishingQueue: {
      findUnique: (...args: unknown[]) => queueFindUnique(...args),
      update: (...args: unknown[]) => queueUpdate(...args),
    },
    newsletter: {
      updateMany: (...args: unknown[]) => newsletterUpdateMany(...args),
    },
    socialPost: {
      findMany: (...args: unknown[]) => socialFindMany(...args),
      updateMany: (...args: unknown[]) => socialUpdateMany(...args),
    },
  },
}));

vi.mock("../../lib/publishing/article-lifecycle", () => ({
  transitionArticleLifecycle: (...args: unknown[]) =>
    transitionArticleLifecycle(...args),
}));

vi.mock("../../lib/social/auto-generate-social", () => ({
  autoGenerateSocialPosts: (...args: unknown[]) =>
    autoGenerateSocialPosts(...args),
}));

const staleResult = {
  ok: false,
  code: "stale_audit",
  error: "A current research audit matching this content revision is required.",
  articleUnchanged: true,
};

const article = {
  id: "article-1",
  title: "Governed publishing",
  excerpt: "Evidence-backed.",
  content: "Body",
  category: "ai-tools",
  seoTitle: null,
  seoDescription: null,
  seoKeywords: null,
  featuredImage: null,
  status: "approved",
  scheduledFor: null,
  publishedAt: null,
  approvedAt: new Date("2026-09-15T00:00:00.000Z"),
  approvedBy: "editor",
  researchSources: [],
  researchAudits: [],
  reviewNotes: [],
};

function expectNoLifecycleWrites() {
  expect(articleUpdate).not.toHaveBeenCalled();
  expect(queueUpdate).not.toHaveBeenCalled();
  expect(newsletterUpdateMany).not.toHaveBeenCalled();
  expect(socialUpdateMany).not.toHaveBeenCalled();
  expect(autoGenerateSocialPosts).not.toHaveBeenCalled();
}

async function expectStructuredRejection(response: Response) {
  expect(response.status).toBe(409);
  await expect(response.json()).resolves.toMatchObject(staleResult);
  expectNoLifecycleWrites();
}

describe("governed article lifecycle routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", email: "admin@example.com" } },
      error: null,
    });
    transitionArticleLifecycle.mockResolvedValue(staleResult);
    articleFindUnique.mockResolvedValue(article);
    articleFindFirst.mockResolvedValue(null);
    queueFindUnique.mockResolvedValue({ id: "queue-1", articleId: article.id });
    socialFindMany.mockResolvedValue([]);
  });

  it("rejects stale direct scheduling without writes", async () => {
    const { POST } = await import("../../app/api/articles/schedule/route");
    const response = await POST(
      new NextRequest("http://localhost/api/articles/schedule", {
        method: "POST",
        body: JSON.stringify({
          articleId: article.id,
          scheduledFor: "2026-09-20T10:00:00+09:30",
        }),
      }),
    );
    await expectStructuredRejection(response);
  });

  it("rejects stale package scheduling without writes", async () => {
    const { POST } =
      await import("../../app/api/articles/schedule-package/route");
    const response = await POST(
      new NextRequest("http://localhost/api/articles/schedule-package", {
        method: "POST",
        body: JSON.stringify({
          articleId: article.id,
          scheduledFor: "2026-09-20T10:00:00+09:30",
        }),
      }),
    );
    await expectStructuredRejection(response);
  });

  it("rejects stale automatic scheduling without writes", async () => {
    const { POST } = await import("../../app/api/pipeline/auto-schedule/route");
    const response = await POST(
      new NextRequest("http://localhost/api/pipeline/auto-schedule", {
        method: "POST",
        body: JSON.stringify({ articleId: article.id }),
      }),
    );
    await expectStructuredRejection(response);
  });

  it("rejects stale immediate package publication without writes", async () => {
    const { POST } =
      await import("../../app/api/articles/publish-package/route");
    const response = await POST(
      new NextRequest("http://localhost/api/articles/publish-package", {
        method: "POST",
        body: JSON.stringify({ articleId: article.id }),
      }),
    );
    await expectStructuredRejection(response);
  });

  it("rejects stale queued publication without writes", async () => {
    const { POST } =
      await import("../../app/api/publishing/update-status/route");
    const response = await POST(
      new Request("http://localhost/api/publishing/update-status", {
        method: "POST",
        body: JSON.stringify({ queueId: "queue-1", status: "published" }),
      }),
    );
    await expectStructuredRejection(response);
  });

  it("prevents build-queue from independently publishing", async () => {
    const { POST } = await import("../../app/api/publishing/build-queue/route");
    const response = await POST(
      new Request("http://localhost/api/publishing/build-queue", {
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
});
