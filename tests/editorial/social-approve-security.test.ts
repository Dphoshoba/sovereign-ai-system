import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => {
  const state: {
    post: {
      id: string;
      status: string;
      content: string;
      articleId: string | null;
    } | null;
  } = { post: null };

  const mockGetUser = vi.fn();
  const update = vi.fn(
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
      return { ...state.post };
    },
  );

  return { state, mockGetUser, update };
});

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: harness.mockGetUser },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    socialPost: {
      update: harness.update,
    },
  },
}));

function editor() {
  return {
    id: "editor-1",
    email: "editor@example.com",
    role: "authenticated",
  };
}

function draftPost() {
  return {
    id: "social-1",
    status: "review-required",
    content: "Draft copy that must stay unchanged until an editor approves it.",
    articleId: "article-1",
  };
}

async function approve(body: unknown = { postId: "social-1" }) {
  const { POST } = await import("../../app/api/social/approve/route");
  return POST(
    new Request("http://localhost/api/social/approve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

describe("POST /api/social/approve", () => {
  beforeEach(() => {
    harness.state.post = draftPost();
    harness.mockGetUser.mockReset();
    harness.update.mockClear();
    harness.mockGetUser.mockResolvedValue({ data: { user: editor() } });
  });

  it("returns 401 before any database write when unauthenticated", async () => {
    harness.mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await approve();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      ok: false,
      code: "AUTHENTICATION_REQUIRED",
      error: "Authentication required.",
      articleUnchanged: true,
    });
    expect(harness.update).not.toHaveBeenCalled();
    expect(harness.state.post).toEqual(draftPost());
  });

  it.each(["viewer", "reviewer", "anon"])(
    "returns 403 for an authenticated %s before any database write",
    async (role) => {
      harness.mockGetUser.mockResolvedValue({
        data: {
          user: { ...editor(), app_metadata: { role } },
        },
      });

      const response = await approve();
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.code).toBe("FORBIDDEN");
      expect(harness.update).not.toHaveBeenCalled();
      expect(harness.state.post?.status).toBe("review-required");
      expect(harness.state.post?.content).toBe(draftPost().content);
    },
  );

  it("approves the social post for an authenticated editor", async () => {
    const response = await approve();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.post.status).toBe("approved");
    expect(body.post.content).toBe(draftPost().content);
    expect(body.post.articleId).toBe("article-1");
    expect(harness.update).toHaveBeenCalledTimes(1);
    expect(harness.update).toHaveBeenCalledWith({
      where: { id: "social-1" },
      data: { status: "approved" },
    });
    expect(harness.mockGetUser.mock.invocationCallOrder[0]).toBeLessThan(
      harness.update.mock.invocationCallOrder[0],
    );
    expect(harness.state.post?.status).toBe("approved");
    expect(harness.state.post?.content).toBe(draftPost().content);
  });
});
