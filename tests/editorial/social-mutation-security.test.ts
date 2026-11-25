import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL = "Draft copy that must stay unchanged.";

const harness = vi.hoisted(() => {
  const state: {
    post: {
      id: string;
      platform: string;
      status: string;
      content: string;
      externalId: string | null;
      articleId: string | null;
      article: {
        id: string;
        status: string;
        slug: string;
        title: string;
        excerpt: string;
      } | null;
    } | null;
    article: {
      id: string;
      title: string;
      excerpt: string;
      status: string;
      slug: string;
    } | null;
    created: Array<Record<string, unknown>>;
    events: Array<Record<string, unknown>>;
  } = { post: null, article: null, created: [], events: [] };

  function copyPost() {
    if (!state.post) return null;
    return {
      ...state.post,
      article: state.post.article ? { ...state.post.article } : null,
    };
  }

  const mockGetUser = vi.fn();
  const socialUpdate = vi.fn(
    async ({
      where,
      data,
    }: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => {
      if (!state.post || state.post.id !== where.id) {
        throw new Error("Record to update not found.");
      }
      Object.assign(state.post, data);
      return copyPost();
    },
  );
  const socialDelete = vi.fn(async ({ where }: { where: { id: string } }) => {
    if (!state.post || state.post.id !== where.id) {
      throw new Error("Record to delete not found.");
    }
    const removed = copyPost();
    state.post = null;
    return removed;
  });
  const socialFindUnique = vi.fn(async () => copyPost());
  const socialCreate = vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
    const created = { id: `created-${state.created.length + 1}`, ...data };
    state.created.push(created);
    return created;
  });
  const articleFindUnique = vi.fn(async () =>
    state.article ? { ...state.article } : null,
  );
  const integrationFindUnique = vi.fn(async () => null);
  const eventCreate = vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
    state.events.push(data);
    return data;
  });
  const responsesCreate = vi.fn(async () => ({
    output_text: "Regenerated draft copy.",
  }));
  const chatCreate = vi.fn(async () => ({
    choices: [
      {
        message: {
          content: JSON.stringify({
            twitter: "Tweet copy",
            linkedin: "LinkedIn copy",
            threads: "Threads copy",
          }),
        },
      },
    ],
  }));
  const fetchMock = vi.fn();

  return {
    state,
    mockGetUser,
    socialUpdate,
    socialDelete,
    socialFindUnique,
    socialCreate,
    articleFindUnique,
    integrationFindUnique,
    eventCreate,
    responsesCreate,
    chatCreate,
    fetchMock,
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: harness.mockGetUser },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    socialPost: {
      update: harness.socialUpdate,
      delete: harness.socialDelete,
      findUnique: harness.socialFindUnique,
      create: harness.socialCreate,
    },
    article: {
      findUnique: harness.articleFindUnique,
    },
    externalIntegration: {
      findUnique: harness.integrationFindUnique,
    },
    operationalEvent: {
      create: harness.eventCreate,
    },
  },
}));

vi.mock("@/lib/ai/openai", () => ({
  getOpenAI: () => ({
    responses: { create: harness.responsesCreate },
    chat: { completions: { create: harness.chatCreate } },
  }),
}));

function editor() {
  return {
    id: "editor-1",
    email: "editor@example.com",
    role: "authenticated",
    app_metadata: { role: "editor" },
  };
}

function draftPost(overrides: Record<string, unknown> = {}) {
  return {
    id: "social-1",
    platform: "linkedin",
    status: "review-required",
    content: ORIGINAL,
    externalId: null,
    articleId: "article-1",
    article: {
      id: "article-1",
      status: "published",
      slug: "sample-slug",
      title: "Sample title",
      excerpt: "Sample excerpt",
    },
    ...overrides,
  };
}

function expectNoSideEffects() {
  expect(harness.socialUpdate).not.toHaveBeenCalled();
  expect(harness.socialDelete).not.toHaveBeenCalled();
  expect(harness.socialCreate).not.toHaveBeenCalled();
  expect(harness.socialFindUnique).not.toHaveBeenCalled();
  expect(harness.articleFindUnique).not.toHaveBeenCalled();
  expect(harness.integrationFindUnique).not.toHaveBeenCalled();
  expect(harness.eventCreate).not.toHaveBeenCalled();
  expect(harness.responsesCreate).not.toHaveBeenCalled();
  expect(harness.chatCreate).not.toHaveBeenCalled();
  expect(harness.fetchMock).not.toHaveBeenCalled();
  expect(harness.state.events).toEqual([]);
  expect(harness.state.created).toEqual([]);
  expect(harness.state.post?.content).toBe(ORIGINAL);
  expect(harness.state.post?.status).toBe("review-required");
}

async function callRoute(modulePath: string, url: string, body: unknown) {
  const { POST } = await import(modulePath);
  return POST(
    new Request(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

const deniedCases = [
  {
    name: "update",
    modulePath: "../../app/api/social/update/route",
    url: "http://localhost/api/social/update",
    body: { postId: "social-1", content: "Tampered copy." },
  },
  {
    name: "reject",
    modulePath: "../../app/api/social/reject/route",
    url: "http://localhost/api/social/reject",
    body: { postId: "social-1" },
  },
  {
    name: "regenerate",
    modulePath: "../../app/api/social/regenerate/route",
    url: "http://localhost/api/social/regenerate",
    body: { postId: "social-1" },
  },
  {
    name: "delete",
    modulePath: "../../app/api/social/delete/route",
    url: "http://localhost/api/social/delete",
    body: { postId: "social-1" },
  },
  {
    name: "generate",
    modulePath: "../../app/api/social/generate/route",
    url: "http://localhost/api/social/generate",
    body: { articleId: "article-1" },
  },
  {
    name: "linkedin publish",
    modulePath: "../../app/api/social/publish/linkedin/route",
    url: "http://localhost/api/social/publish/linkedin",
    body: { postId: "social-1" },
  },
  {
    name: "threads publish",
    modulePath: "../../app/api/social/publish/threads/route",
    url: "http://localhost/api/social/publish/threads",
    body: { postId: "social-1" },
  },
  {
    name: "facebook publish",
    modulePath: "../../app/api/social/publish/facebook/route",
    url: "http://localhost/api/social/publish/facebook",
    body: { postId: "social-1" },
  },
] as const;

describe.each(deniedCases)("POST /api/social/$name", (route) => {
  beforeEach(() => {
    harness.state.post = draftPost();
    harness.state.article = {
      id: "article-1",
      title: "Sample title",
      excerpt: "Sample excerpt",
      status: "published",
      slug: "sample-slug",
    };
    harness.state.created = [];
    harness.state.events = [];
    harness.mockGetUser.mockReset();
    harness.socialUpdate.mockClear();
    harness.socialDelete.mockClear();
    harness.socialFindUnique.mockClear();
    harness.socialCreate.mockClear();
    harness.articleFindUnique.mockClear();
    harness.integrationFindUnique.mockClear();
    harness.eventCreate.mockClear();
    harness.responsesCreate.mockClear();
    harness.chatCreate.mockClear();
    harness.fetchMock.mockReset();
    harness.mockGetUser.mockResolvedValue({ data: { user: editor() } });
    vi.stubGlobal("fetch", harness.fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 401 before any side effect when unauthenticated", async () => {
    harness.mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await callRoute(route.modulePath, route.url, route.body);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      ok: false,
      code: "AUTHENTICATION_REQUIRED",
      error: "Authentication required.",
      articleUnchanged: true,
    });
    expectNoSideEffects();
  });

  it.each(["viewer", "reviewer", "anon"])(
    "returns 403 for an authenticated %s before any side effect",
    async (role) => {
      harness.mockGetUser.mockResolvedValue({
        data: {
          user: { ...editor(), app_metadata: { role } },
        },
      });

      const response = await callRoute(route.modulePath, route.url, route.body);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.code).toBe("FORBIDDEN");
      expectNoSideEffects();
    },
  );
});

describe("authorised social mutations still follow existing rules", () => {
  beforeEach(() => {
    harness.state.post = draftPost();
    harness.state.article = {
      id: "article-1",
      title: "Sample title",
      excerpt: "Sample excerpt",
      status: "published",
      slug: "sample-slug",
    };
    harness.state.created = [];
    harness.state.events = [];
    harness.mockGetUser.mockReset();
    harness.socialUpdate.mockClear();
    harness.socialDelete.mockClear();
    harness.socialFindUnique.mockClear();
    harness.socialCreate.mockClear();
    harness.articleFindUnique.mockClear();
    harness.integrationFindUnique.mockClear();
    harness.eventCreate.mockClear();
    harness.responsesCreate.mockClear();
    harness.chatCreate.mockClear();
    harness.fetchMock.mockReset();
    harness.mockGetUser.mockResolvedValue({ data: { user: editor() } });
    vi.stubGlobal("fetch", harness.fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lets an editor update draft copy and return it to review", async () => {
    const response = await callRoute(
      "../../app/api/social/update/route",
      "http://localhost/api/social/update",
      { postId: "social-1", content: "Edited copy." },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.post.content).toBe("Edited copy.");
    expect(body.post.status).toBe("review-required");
    expect(harness.socialUpdate).toHaveBeenCalledWith({
      where: { id: "social-1" },
      data: { content: "Edited copy.", status: "review-required" },
    });
    expect(harness.mockGetUser.mock.invocationCallOrder[0]).toBeLessThan(
      harness.socialUpdate.mock.invocationCallOrder[0],
    );
    expect(harness.responsesCreate).not.toHaveBeenCalled();
    expect(harness.fetchMock).not.toHaveBeenCalled();
  });

  it("lets an editor reject a draft without rewriting its content", async () => {
    const response = await callRoute(
      "../../app/api/social/reject/route",
      "http://localhost/api/social/reject",
      { postId: "social-1" },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.post.status).toBe("rejected");
    expect(body.post.content).toBe(ORIGINAL);
    expect(harness.socialUpdate).toHaveBeenCalledWith({
      where: { id: "social-1" },
      data: { status: "rejected" },
    });
    expect(harness.state.post?.content).toBe(ORIGINAL);
  });

  it("lets an editor regenerate copy through the mocked model", async () => {
    const response = await callRoute(
      "../../app/api/social/regenerate/route",
      "http://localhost/api/social/regenerate",
      { postId: "social-1" },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.post.content).toBe("Regenerated draft copy.");
    expect(body.post.status).toBe("review-required");
    expect(harness.responsesCreate).toHaveBeenCalledTimes(1);
    expect(harness.mockGetUser.mock.invocationCallOrder[0]).toBeLessThan(
      harness.responsesCreate.mock.invocationCallOrder[0],
    );
    expect(harness.responsesCreate.mock.invocationCallOrder[0]).toBeLessThan(
      harness.socialUpdate.mock.invocationCallOrder[0],
    );
    expect(harness.fetchMock).not.toHaveBeenCalled();
  });

  it("lets an editor delete a draft", async () => {
    const response = await callRoute(
      "../../app/api/social/delete/route",
      "http://localhost/api/social/delete",
      { postId: "social-1" },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(harness.socialDelete).toHaveBeenCalledWith({ where: { id: "social-1" } });
    expect(harness.mockGetUser.mock.invocationCallOrder[0]).toBeLessThan(
      harness.socialDelete.mock.invocationCallOrder[0],
    );
    expect(harness.state.post).toBeNull();
    expect(harness.fetchMock).not.toHaveBeenCalled();
  });

  it("lets an editor generate drafts through the mocked model", async () => {
    const response = await callRoute(
      "../../app/api/social/generate/route",
      "http://localhost/api/social/generate",
      { articleId: "article-1" },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.posts).toHaveLength(3);
    expect(harness.chatCreate).toHaveBeenCalledTimes(1);
    expect(harness.socialCreate).toHaveBeenCalledTimes(3);
    expect(harness.socialCreate).toHaveBeenNthCalledWith(1, {
      data: {
        articleId: "article-1",
        platform: "twitter",
        content: "Tweet copy",
      },
    });
    expect(harness.mockGetUser.mock.invocationCallOrder[0]).toBeLessThan(
      harness.chatCreate.mock.invocationCallOrder[0],
    );
    expect(harness.chatCreate.mock.invocationCallOrder[0]).toBeLessThan(
      harness.socialCreate.mock.invocationCallOrder[0],
    );
    expect(harness.fetchMock).not.toHaveBeenCalled();
    expect(harness.state.post?.content).toBe(ORIGINAL);
  });

  it.each([
    ["linkedin", "linkedin", "../../app/api/social/publish/linkedin/route", "http://localhost/api/social/publish/linkedin"],
    ["threads", "threads", "../../app/api/social/publish/threads/route", "http://localhost/api/social/publish/threads"],
    ["facebook", "facebook", "../../app/api/social/publish/facebook/route", "http://localhost/api/social/publish/facebook"],
  ])(
    "keeps the approval gate for an editor on %s and does not call the network",
    async (_name, platform, modulePath, url) => {
      harness.state.post = draftPost({ platform });

      const response = await callRoute(modulePath, url, { postId: "social-1" });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toBe("Social post must be approved before publishing.");
      expect(body.code).not.toBe("FORBIDDEN");
      expect(harness.socialFindUnique).toHaveBeenCalledTimes(1);
      expect(harness.mockGetUser.mock.invocationCallOrder[0]).toBeLessThan(
        harness.socialFindUnique.mock.invocationCallOrder[0],
      );
      expect(harness.socialUpdate).not.toHaveBeenCalled();
      expect(harness.integrationFindUnique).not.toHaveBeenCalled();
      expect(harness.eventCreate).not.toHaveBeenCalled();
      expect(harness.fetchMock).not.toHaveBeenCalled();
      expect(harness.state.post?.status).toBe("review-required");
      expect(harness.state.post?.content).toBe(ORIGINAL);
    },
  );
});
