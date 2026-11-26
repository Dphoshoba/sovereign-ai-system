import { existsSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => {
  const original = "Draft copy that must stay unchanged.";
  const posts = [
    {
      id: "social-1",
      status: "draft",
      content: original,
    },
  ];

  const updateMany = vi.fn(
    async ({
      where,
      data,
    }: {
      where: { status?: string };
      data: { status?: string };
    }) => {
      let count = 0;
      for (const post of posts) {
        if (where.status && post.status !== where.status) continue;
        if (typeof data.status === "string") post.status = data.status;
        count += 1;
      }
      return { count };
    },
  );
  const update = vi.fn();
  const findMany = vi.fn(async () => posts.map((post) => ({ ...post })));
  const findUnique = vi.fn();
  const groupBy = vi.fn();
  const mockGetUser = vi.fn();

  return {
    original,
    posts,
    updateMany,
    update,
    findMany,
    findUnique,
    groupBy,
    mockGetUser,
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    socialPost: {
      updateMany: harness.updateMany,
      update: harness.update,
      findMany: harness.findMany,
      findUnique: harness.findUnique,
      groupBy: harness.groupBy,
    },
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: harness.mockGetUser },
  })),
}));

const ROUTE_DIR = path.join(
  process.cwd(),
  "app",
  "api",
  "debug",
  "migrate-social-status",
);

const ROUTE_FILES = ["route.ts", "route.tsx", "route.js", "route.jsx", "route.mjs"].map(
  (name) => path.join(ROUTE_DIR, name),
);

function resetPosts() {
  harness.posts.splice(0, harness.posts.length, {
    id: "social-1",
    status: "draft",
    content: harness.original,
  });
}

function expectNoDatabaseAccess() {
  expect(harness.updateMany).not.toHaveBeenCalled();
  expect(harness.update).not.toHaveBeenCalled();
  expect(harness.findMany).not.toHaveBeenCalled();
  expect(harness.findUnique).not.toHaveBeenCalled();
  expect(harness.groupBy).not.toHaveBeenCalled();
  expect(harness.mockGetUser).not.toHaveBeenCalled();
  expect(harness.posts).toEqual([
    {
      id: "social-1",
      status: "draft",
      content: harness.original,
    },
  ]);
}

async function loadRoute(): Promise<{ POST?: (request: Request) => Promise<Response> }> {
  const specifier = "../../app/api/debug/migrate-social-status/route";
  return import(specifier);
}

describe("POST /api/debug/migrate-social-status", () => {
  beforeEach(() => {
    resetPosts();
    harness.updateMany.mockClear();
    harness.update.mockClear();
    harness.findMany.mockClear();
    harness.findUnique.mockClear();
    harness.groupBy.mockClear();
    harness.mockGetUser.mockReset();
  });

  it("is removed, so an unauthenticated request cannot migrate social statuses", async () => {
    for (const file of ROUTE_FILES) {
      expect(existsSync(file)).toBe(false);
    }

    harness.mockGetUser.mockResolvedValue({ data: { user: null } });

    await expect(loadRoute()).rejects.toThrow();
    expectNoDatabaseAccess();
  });

  it("is removed, so an authenticated editor cannot migrate social statuses", async () => {
    harness.mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "editor-1",
          email: "editor@example.com",
          role: "authenticated",
        },
      },
    });

    await expect(loadRoute()).rejects.toThrow();
    expectNoDatabaseAccess();
  });
});
