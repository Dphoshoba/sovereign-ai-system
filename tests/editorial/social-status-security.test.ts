import { existsSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => {
  const posts = [
    {
      id: "social-1",
      status: "draft",
      content: "Draft copy that must stay private.",
    },
  ];

  const groupBy = vi.fn(async () => [
    { status: "draft", _count: { _all: posts.length } },
  ]);
  const updateMany = vi.fn();
  const update = vi.fn();
  const findMany = vi.fn(async () => posts.map((post) => ({ ...post })));
  const findUnique = vi.fn();
  const mockGetUser = vi.fn();

  return {
    posts,
    groupBy,
    updateMany,
    update,
    findMany,
    findUnique,
    mockGetUser,
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    socialPost: {
      groupBy: harness.groupBy,
      updateMany: harness.updateMany,
      update: harness.update,
      findMany: harness.findMany,
      findUnique: harness.findUnique,
    },
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: harness.mockGetUser },
  })),
}));

const ROUTE_DIR = path.join(process.cwd(), "app", "api", "debug", "social-status");

const ROUTE_FILES = ["route.ts", "route.tsx", "route.js", "route.jsx", "route.mjs"].map(
  (name) => path.join(ROUTE_DIR, name),
);

function expectNoDatabaseAccess() {
  expect(harness.groupBy).not.toHaveBeenCalled();
  expect(harness.updateMany).not.toHaveBeenCalled();
  expect(harness.update).not.toHaveBeenCalled();
  expect(harness.findMany).not.toHaveBeenCalled();
  expect(harness.findUnique).not.toHaveBeenCalled();
  expect(harness.mockGetUser).not.toHaveBeenCalled();
}

async function loadRoute(): Promise<{ GET?: (request: Request) => Promise<Response> }> {
  const specifier = "../../app/api/debug/social-status/route";
  return import(specifier);
}

describe("GET /api/debug/social-status", () => {
  beforeEach(() => {
    harness.groupBy.mockClear();
    harness.updateMany.mockClear();
    harness.update.mockClear();
    harness.findMany.mockClear();
    harness.findUnique.mockClear();
    harness.mockGetUser.mockReset();
    harness.mockGetUser.mockResolvedValue({ data: { user: null } });
  });

  it("is removed, so an unauthenticated caller cannot obtain social-post status counts", async () => {
    for (const file of ROUTE_FILES) {
      expect(existsSync(file)).toBe(false);
    }

    await expect(loadRoute()).rejects.toThrow();
    expectNoDatabaseAccess();
  });
});
