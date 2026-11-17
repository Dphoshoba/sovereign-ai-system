import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  AUTHENTICATION_REQUIRED_BODY,
  PUBLISHING_FORBIDDEN_BODY,
} from "../../lib/publishing/require-editor-auth";
import {
  CANONICAL_ARTICLE_ORIGIN,
  canonicalArticleUrl,
  hasIncorrectArticleLink,
} from "../../lib/social/x-publish-policy";

const SLUG = "governed-ai-workflows";
const CANONICAL = canonicalArticleUrl(SLUG);

const mockGetUser = vi.fn();
const socialFindUnique = vi.fn();
const socialUpdate = vi.fn();
const integrationFindUnique = vi.fn();
const eventCreate = vi.fn();
const fetchMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    socialPost: {
      findUnique: (...args: unknown[]) => socialFindUnique(...args),
      update: (...args: unknown[]) => socialUpdate(...args),
    },
    externalIntegration: {
      findUnique: (...args: unknown[]) => integrationFindUnique(...args),
    },
    operationalEvent: {
      create: (...args: unknown[]) => eventCreate(...args),
    },
  },
}));

function editor() {
  return {
    id: "editor-1",
    email: "editor@example.com",
    app_metadata: { role: "editor" },
  };
}

function facebookPost(overrides: Record<string, unknown> = {}) {
  return {
    id: "fb-post-1",
    platform: "facebook",
    status: "approved",
    content: `A calm note for creators. ${CANONICAL}`,
    externalId: null,
    articleId: "article-1",
    article: {
      status: "published",
      slug: SLUG,
      title: "Governed AI workflows",
    },
    ...overrides,
  };
}

function connectedFacebook() {
  return {
    name: "Facebook",
    enabled: true,
    config: {
      pageAccessToken: "page-token",
      pageId: "page-123",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    },
  };
}

async function publish(body: Record<string, unknown> = { postId: "fb-post-1" }) {
  const { POST } = await import("../../app/api/social/publish/facebook/route");
  return POST(
    new NextRequest("http://localhost/api/social/publish/facebook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

function graphLinkFromFetch() {
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [, init] = fetchMock.mock.calls[0];
  const params = new URLSearchParams(String(init?.body ?? ""));
  return params.get("link");
}

describe("canonicalArticleUrl shared authority", () => {
  it("builds /blog/{slug} without category for every category input", () => {
    for (const category of ["ai-tools", "faith", "leadership", "creator-ops"]) {
      const url = canonicalArticleUrl(SLUG);
      expect(url).toBe(`${CANONICAL_ARTICLE_ORIGIN}/blog/${SLUG}`);
      expect(url).not.toContain(`/${category}/`);
      expect(url).not.toContain("/blog/ai-tools/");
    }
  });

  it("matches the public app blog route shape", () => {
    expect(new URL(CANONICAL).pathname).toBe(`/blog/${SLUG}`);
  });

  it("flags legacy category-based article links", () => {
    expect(
      hasIncorrectArticleLink(
        `Read https://www.echoesandvisions.com/blog/ai-tools/${SLUG}`,
        SLUG,
      ),
    ).toBe(true);
    expect(hasIncorrectArticleLink(`Read ${CANONICAL}`, SLUG)).toBe(false);
  });
});

describe("POST /api/social/publish/facebook canonical link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: editor() }, error: null });
    socialFindUnique.mockResolvedValue(facebookPost());
    socialUpdate.mockImplementation(async ({ data }) => ({
      ...facebookPost(),
      ...data,
    }));
    integrationFindUnique.mockResolvedValue(connectedFacebook());
    eventCreate.mockResolvedValue({});
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "fb_page_999" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    process.env.NEXT_PUBLIC_APP_URL = "https://sovereign-ai-executive.vercel.app";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("rejects unauthenticated callers before Facebook work", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const response = await publish();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY);
    expect(socialFindUnique).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects non-editor sessions before Facebook work", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { ...editor(), app_metadata: { role: "viewer" } },
      },
      error: null,
    });
    const response = await publish();
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual(PUBLISHING_FORBIDDEN_BODY);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps the approval gate and does not call Facebook", async () => {
    socialFindUnique.mockResolvedValue(
      facebookPost({ status: "review-required" }),
    );
    const response = await publish();
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "Social post must be approved before publishing.",
    });
    expect(integrationFindUnique).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects unpublished linked articles before Facebook", async () => {
    socialFindUnique.mockResolvedValue(
      facebookPost({
        article: { status: "approved", slug: SLUG, title: "Governed AI workflows" },
      }),
    );
    const response = await publish();
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "Linked article must be published before posting to Facebook.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(socialUpdate).not.toHaveBeenCalled();
  });

  it("rejects legacy category-based URLs in post content before Facebook", async () => {
    socialFindUnique.mockResolvedValue(
      facebookPost({
        content: `Read more https://www.echoesandvisions.com/blog/ai-tools/${SLUG}`,
      }),
    );
    const response = await publish();
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "incorrect_article_link",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(socialUpdate).not.toHaveBeenCalled();
  });

  it("rejects other category-prefixed paths, not only ai-tools", async () => {
    socialFindUnique.mockResolvedValue(
      facebookPost({
        content: `Read more https://www.echoesandvisions.com/blog/faith/${SLUG}`,
      }),
    );
    const response = await publish();
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: "incorrect_article_link",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("attaches the canonical /blog/{slug} Graph link and ignores NEXT_PUBLIC_APP_URL category paths", async () => {
    const response = await publish();
    expect(response.status).toBe(200);
    expect(graphLinkFromFetch()).toBe(CANONICAL);
    expect(graphLinkFromFetch()).not.toContain("/blog/ai-tools/");
    expect(graphLinkFromFetch()).not.toContain("sovereign-ai-executive.vercel.app");
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      externalId: "fb_page_999",
    });
    expect(socialUpdate).toHaveBeenCalledWith({
      where: { id: "fb-post-1" },
      data: expect.objectContaining({
        status: "published",
        externalId: "fb_page_999",
      }),
    });
  });

  it("keeps the slug unchanged across categories when building the Graph link", async () => {
    for (const category of ["ai-tools", "faith", "leadership"]) {
      fetchMock.mockClear();
      socialUpdate.mockClear();
      socialFindUnique.mockResolvedValue(
        facebookPost({
          content: `Category was ${category}. ${CANONICAL}`,
        }),
      );
      const response = await publish();
      expect(response.status).toBe(200);
      expect(graphLinkFromFetch()).toBe(
        `https://www.echoesandvisions.com/blog/${SLUG}`,
      );
    }
  });

  it("returns alreadyPublished without calling Facebook again", async () => {
    socialFindUnique.mockResolvedValue(
      facebookPost({
        status: "published",
        externalId: "fb_existing",
      }),
    );
    const response = await publish();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      alreadyPublished: true,
      externalId: "fb_existing",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(socialUpdate).not.toHaveBeenCalled();
  });
});
