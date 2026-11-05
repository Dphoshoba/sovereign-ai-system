import { beforeEach, describe, expect, it, vi } from "vitest";
import { canonicalArticleUrl } from "../../lib/social/x-publish-policy";

const harness = vi.hoisted(() => {
  const state: {
    post: {
      id: string;
      platform: string;
      content: string;
      status: string;
      externalId: string | null;
      articleId: string | null;
      article: { id: string; status: string; slug: string } | null;
    } | null;
    events: Array<Record<string, unknown>>;
  } = { post: null, events: [] };

  let tail: Promise<unknown> = Promise.resolve();
  function exclusive<T>(work: () => Promise<T>): Promise<T> {
    const run = tail.then(work, work);
    tail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  function copyPost() {
    if (!state.post) return null;
    return {
      ...state.post,
      article: state.post.article ? { ...state.post.article } : null,
    };
  }

  const tx = {
    $queryRaw: async () => [],
    socialPost: {
      findUnique: async () => {
        const post = copyPost();
        hooks.onRead?.(post);
        return post;
      },
      update: async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(state.post!, data);
        return copyPost();
      },
    },
    operationalEvent: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        state.events.push(data);
        return data;
      },
    },
  };

  const mockGetUser = vi.fn();
  const mockMe = vi.fn();
  const mockTweet = vi.fn();
  const getTwitterClient = vi.fn(() => ({
    v2: { me: mockMe, tweet: mockTweet },
  }));
  const counters = { transactions: 0 };
  const hooks: {
    onRead?: (post: { status: string } | null) => void;
  } = {};

  return {
    state,
    exclusive,
    tx,
    mockGetUser,
    mockMe,
    mockTweet,
    getTwitterClient,
    counters,
    hooks,
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: harness.mockGetUser },
  })),
}));

vi.mock("@/lib/twitter", () => ({
  getTwitterClient: harness.getTwitterClient,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (fn: (tx: typeof harness.tx) => Promise<unknown>) => {
      harness.counters.transactions += 1;
      return harness.exclusive(() => fn(harness.tx));
    },
    socialPost: {
      update: async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(harness.state.post!, data);
        return harness.state.post;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; status: string };
        data: Record<string, unknown>;
      }) => {
        const post = harness.state.post;
        if (post && post.id === where.id && post.status === where.status) {
          Object.assign(post, data);
          return { count: 1 };
        }
        return { count: 0 };
      },
    },
    operationalEvent: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        harness.state.events.push(data);
        return data;
      },
    },
  },
}));

const SLUG =
  "how-to-start-using-ai-in-your-small-business-without-losing-human-control";
const CANONICAL = canonicalArticleUrl(SLUG);
const APPROVED_CONTENT = `Keep a person responsible for the decision. ${CANONICAL}`;

function editor() {
  return {
    id: "editor-1",
    email: "editor@example.com",
    role: "authenticated",
    app_metadata: { role: "editor" },
  };
}

function approvedPost(overrides: Record<string, unknown> = {}) {
  return {
    id: "social-1",
    platform: "twitter",
    content: APPROVED_CONTENT,
    status: "approved",
    externalId: null,
    articleId: "article-1",
    article: {
      id: "article-1",
      status: "published",
      slug: SLUG,
    },
    ...overrides,
  };
}

async function publish(body: unknown = { postId: "social-1" }) {
  const { POST } = await import("../../app/api/social/publish/twitter/route");
  return POST(
    new Request("http://localhost/api/social/publish/twitter", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

describe("POST /api/social/publish/twitter", () => {
  beforeEach(() => {
    harness.state.post = approvedPost();
    harness.state.events = [];
    harness.counters.transactions = 0;
    harness.hooks.onRead = undefined;
    harness.mockGetUser.mockReset();
    harness.mockMe.mockReset();
    harness.mockTweet.mockReset();
    harness.getTwitterClient.mockClear();
    harness.mockGetUser.mockResolvedValue({ data: { user: editor() } });
    harness.mockMe.mockResolvedValue({ data: { id: "2330006420" } });
    harness.mockTweet.mockResolvedValue({ data: { id: "tweet-1" } });
  });

  it("returns 401 before any database or X call when unauthenticated", async () => {
    harness.mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await publish();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.code).toBe("AUTHENTICATION_REQUIRED");
    expect(harness.counters.transactions).toBe(0);
    expect(harness.getTwitterClient).not.toHaveBeenCalled();
    expect(harness.mockMe).not.toHaveBeenCalled();
    expect(harness.mockTweet).not.toHaveBeenCalled();
    expect(harness.state.events).toEqual([]);
    expect(harness.state.post?.status).toBe("approved");
  });

  it("returns 403 for an authenticated viewer before any X call", async () => {
    harness.mockGetUser.mockResolvedValue({
      data: {
        user: { ...editor(), app_metadata: { role: "viewer" } },
      },
    });

    const response = await publish();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.code).toBe("FORBIDDEN");
    expect(harness.counters.transactions).toBe(0);
    expect(harness.getTwitterClient).not.toHaveBeenCalled();
    expect(harness.mockTweet).not.toHaveBeenCalled();
    expect(harness.state.post?.status).toBe("approved");
  });

  it("returns 403 for an unapproved draft and does not call X", async () => {
    harness.state.post = approvedPost({ status: "review-required" });

    const response = await publish();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toMatch(/approved/i);
    expect(harness.mockMe).not.toHaveBeenCalled();
    expect(harness.mockTweet).not.toHaveBeenCalled();
    expect(harness.state.post.content).toBe(APPROVED_CONTENT);
  });

  it("rejects an article-linked post that omits the canonical URL", async () => {
    const original = "Approved text without the article URL.";
    harness.state.post = approvedPost({ content: original });

    const response = await publish();
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.code).toBe("missing_canonical_url");
    expect(harness.mockTweet).not.toHaveBeenCalled();
    expect(harness.state.post.content).toBe(original);
    expect(harness.state.post.status).toBe("approved");
  });

  it("rejects a category-prefixed article link", async () => {
    harness.state.post = approvedPost({
      content: `Read https://www.echoesandvisions.com/blog/ai-tools/${SLUG}`,
    });

    const response = await publish();
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.code).toBe("incorrect_article_link");
    expect(harness.mockTweet).not.toHaveBeenCalled();
  });

  it("rejects content whose weighted X length exceeds 280", async () => {
    harness.state.post = approvedPost({
      content: `${"a".repeat(258)}${CANONICAL}`,
    });

    const response = await publish();
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.code).toBe("invalid_length");
    expect(harness.mockTweet).not.toHaveBeenCalled();
  });

  it("rejects an already published post before calling X", async () => {
    harness.state.post = approvedPost({
      status: "published",
      externalId: "tweet-old",
    });

    const response = await publish();
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.alreadyPublished).toBe(true);
    expect(harness.mockMe).not.toHaveBeenCalled();
    expect(harness.mockTweet).not.toHaveBeenCalled();
  });

  it("publishes once when the authenticated account matches the authorised id", async () => {
    const response = await publish();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(harness.mockMe).toHaveBeenCalledTimes(1);
    expect(harness.mockTweet).toHaveBeenCalledTimes(1);
    expect(harness.mockTweet).toHaveBeenCalledWith(APPROVED_CONTENT);
    expect(harness.mockMe.mock.invocationCallOrder[0]).toBeLessThan(
      harness.mockTweet.mock.invocationCallOrder[0],
    );
    expect(harness.state.post?.status).toBe("published");
    expect(harness.state.post?.externalId).toBe("tweet-1");
    expect(harness.state.post?.content).toBe(APPROVED_CONTENT);
  });

  it("fails closed when the connected account id does not match", async () => {
    harness.mockMe.mockResolvedValue({ data: { id: "111" } });

    const response = await publish();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.code).toBe("x_account_mismatch");
    expect(body.error).not.toContain("111");
    expect(harness.mockTweet).not.toHaveBeenCalled();
    expect(harness.state.post?.status).toBe("approved");
    expect(JSON.stringify(harness.state.events)).not.toContain("111");
  });

  it("fails closed when the identity call cannot verify the account", async () => {
    harness.mockMe.mockRejectedValue(new Error("socket hang up"));

    const response = await publish();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.code).toBe("x_account_unverified");
    expect(harness.mockTweet).not.toHaveBeenCalled();
    expect(harness.state.post?.status).toBe("approved");
  });

  it("allows one tweet when two approved requests race", async () => {
    let releaseTweet: () => void = () => undefined;
    const tweetHeld = new Promise<void>((resolve) => {
      releaseTweet = resolve;
    });
    let released = false;
    harness.hooks.onRead = (post) => {
      if (post?.status === "publishing" && !released) {
        released = true;
        releaseTweet();
      }
    };
    harness.mockTweet.mockImplementation(async () => {
      await tweetHeld;
      return { data: { id: "tweet-1" } };
    });

    const [first, second] = await Promise.all([publish(), publish()]);
    const statuses = [first.status, second.status].sort((a, b) => a - b);
    const bodies = await Promise.all([first.json(), second.json()]);

    expect(statuses).toEqual([200, 409]);
    expect(bodies.some((body) => body.code === "publish_in_progress")).toBe(
      true,
    );
    expect(harness.mockTweet).toHaveBeenCalledTimes(1);
    expect(harness.state.post?.status).toBe("published");
    expect(harness.state.post?.externalId).toBe("tweet-1");
  });

  it("keeps the claim and does not retry when the X outcome is uncertain", async () => {
    harness.mockTweet.mockRejectedValue(
      new Error("Authorization: Bearer secret-token"),
    );

    const response = await publish();
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.code).toBe("publish_outcome_uncertain");
    expect(harness.mockTweet).toHaveBeenCalledTimes(1);
    expect(harness.state.post?.status).toBe("publishing");
    expect(JSON.stringify(harness.state.events)).not.toMatch(/secret-token|Bearer/i);

    const retry = await publish();
    expect(retry.status).toBe(409);
    expect(harness.mockTweet).toHaveBeenCalledTimes(1);
  });

  it("releases the claim after a certain X rejection and does not retry automatically", async () => {
    harness.mockTweet.mockRejectedValue(
      Object.assign(new Error("duplicate content"), { code: 400 }),
    );

    const response = await publish();
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.code).toBe("x_rejected");
    expect(harness.mockTweet).toHaveBeenCalledTimes(1);
    expect(harness.state.post?.status).toBe("approved");
    expect(harness.state.post?.externalId).toBeNull();
  });

  it("publishes an unlinked post without requiring an article URL", async () => {
    const content = "A short note with no article link.";
    harness.state.post = approvedPost({
      content,
      articleId: null,
      article: null,
    });

    const response = await publish();

    expect(response.status).toBe(200);
    expect(harness.mockTweet).toHaveBeenCalledWith(content);
  });
});
