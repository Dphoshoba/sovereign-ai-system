import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirst = vi.fn();
const findMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: {
      findFirst: (...args: unknown[]) => findFirst(...args),
      findMany: (...args: unknown[]) => findMany(...args),
    },
  },
}));

vi.mock("next/server", () => ({
  connection: vi.fn(async () => undefined),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/components/blog/PublishedArticleView", () => ({
  PublishedArticleView: () => null,
}));

describe("public published-article access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findMany.mockResolvedValue([]);
  });

  it("does not render an unpublished slug", async () => {
    findFirst.mockResolvedValue(null);
    const { default: BlogArticlePage } = await import("../../app/blog/[slug]/page");

    await expect(
      BlogArticlePage({ params: Promise.resolve({ slug: "unpublished-draft" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: "unpublished-draft", status: "published" },
      }),
    );
    expect(findMany).not.toHaveBeenCalled();
  });

  it("loads a published article only when its status is published", async () => {
    findFirst.mockResolvedValue({
      id: "article-live",
      title: "Published piece",
      slug: "published-piece",
      category: "ai-tools",
      status: "published",
      content: "Public body",
      excerpt: null,
      featuredImage: null,
      publishedAt: new Date("2026-09-20T00:00:00.000Z"),
      researchSources: [],
    });

    const { default: BlogArticlePage } = await import("../../app/blog/[slug]/page");
    await BlogArticlePage({ params: Promise.resolve({ slug: "published-piece" }) });

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: "published-piece", status: "published" },
      }),
    );
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "published" }),
      }),
    );
  });
});
