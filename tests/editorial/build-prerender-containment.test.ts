import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { AppRouteRouteModule } from "next/dist/server/route-modules/app-route/module";
import { RouteKind } from "next/dist/server/route-kind";

const { operations, mockGetUser } = vi.hoisted(() => {
  // Next chooses its AsyncLocalStorage when the route module is first imported.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { AsyncLocalStorage } = require("node:async_hooks") as {
    AsyncLocalStorage: typeof globalThis.AsyncLocalStorage;
  };
  if (!globalThis.AsyncLocalStorage) {
    globalThis.AsyncLocalStorage = AsyncLocalStorage;
  }
  return {
    operations: [] as Array<{ model: string; method: string }>,
    mockGetUser: vi.fn(),
  };
});

function resultFor(method: string) {
  if (method === "findUnique" || method === "findFirst") return null;
  if (method === "create") return { id: "row-1", slug: "echoes-visions" };
  if (method === "createMany") return { count: 1 };
  return [];
}

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: new Proxy(
    {},
    {
      get(_target, model) {
        if (typeof model !== "string") return undefined;
        return new Proxy(
          {},
          {
            get(_modelTarget, method) {
              if (typeof method !== "string") return undefined;
              return async () => {
                operations.push({ model, method });
                return resultFor(method);
              };
            },
          },
        );
      },
    },
  ),
}));

const ROUTES = [
  {
    name: "publishing-command",
    page: "/api/publishing-command/route",
    pathname: "/api/publishing-command",
    load: () => import("../../app/api/publishing-command/route"),
    writeMethods: ["createMany"],
  },
  {
    name: "workflow-engine",
    page: "/api/workflow-engine/route",
    pathname: "/api/workflow-engine",
    load: () => import("../../app/api/workflow-engine/route"),
    writeMethods: ["createMany"],
  },
  {
    name: "workflow-automation-v2",
    page: "/api/workflow-automation-v2/route",
    pathname: "/api/workflow-automation-v2",
    load: () => import("../../app/api/workflow-automation-v2/route"),
    writeMethods: ["createMany"],
  },
  {
    name: "tenant-runtime",
    page: "/api/tenant-runtime/route",
    pathname: "/api/tenant-runtime",
    load: () => import("../../app/api/tenant-runtime/route"),
    writeMethods: ["create", "createMany"],
  },
] as const;

function staticGenerationContext(pathname: string) {
  return {
    params: undefined,
    previewProps: {
      previewModeId: "build-containment",
      previewModeSigningKey: "build-containment",
      previewModeEncryptionKey: "build-containment",
    },
    sharedContext: {
      buildId: "build-containment",
      deploymentId: "build-containment",
    },
    renderOpts: {
      shouldWaitOnAllReady: false,
      supportsDynamicResponse: false,
      isDraftMode: false,
      isPossibleServerAction: false,
    },
    pathname,
  };
}

function routeModule(
  pathname: string,
  page: string,
  userland: { GET?: () => Promise<Response> | Response; dynamic?: string },
) {
  return new AppRouteRouteModule({
    userland,
    definition: {
      kind: RouteKind.APP_ROUTE,
      bundlePath: page,
      filename: page,
      page,
      pathname,
    },
    distDir: ".next",
    relativeProjectDir: "",
    resolvedPagePath: page,
    nextConfigOutput: undefined,
  });
}

describe("build prerender containment", () => {
  beforeEach(() => {
    operations.length = 0;
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
  });

  it("does not execute a force-dynamic GET during static generation", async () => {
    const executed = vi.fn(async () => Response.json({ ok: true }));
    const route = routeModule("/api/containment-probe", "probe/route", {
      GET: executed,
      dynamic: "force-dynamic",
    });

    await expect(
      route.handle(
        new NextRequest("http://localhost:3000/api/containment-probe"),
        staticGenerationContext("/api/containment-probe"),
      ),
    ).rejects.toThrow(/statically generated/);
    expect(executed).not.toHaveBeenCalled();
  });

  it("still executes a GET-only handler when static generation is allowed", async () => {
    const executed = vi.fn(async () => Response.json({ ok: true }));
    const route = routeModule("/api/containment-control", "control/route", {
      GET: executed,
    });

    const response = await route.handle(
      new NextRequest("http://localhost:3000/api/containment-control"),
      staticGenerationContext("/api/containment-control"),
    );

    expect(response.status).toBe(200);
    expect(executed).toHaveBeenCalledTimes(1);
  });

  it.each(ROUTES)(
    "keeps $name out of static prerendering without calling its handler",
    async (entry) => {
      const userland = await entry.load();
      expect(userland.dynamic).toBe("force-dynamic");
      expect(operations).toEqual([]);

      const route = routeModule(entry.pathname, entry.page, userland);
      await expect(
        route.handle(
          new NextRequest(`http://localhost:3000${entry.pathname}`),
          staticGenerationContext(entry.pathname),
        ),
      ).rejects.toThrow(/statically generated/);

      expect(operations).toEqual([]);
      expect(userland.GET).toEqual(expect.any(Function));
    },
  );

  it.each(ROUTES)(
    "rejects anonymous $name requests before any database call",
    async (entry) => {
      const userland = await entry.load();
      const response = await userland.GET();

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toMatchObject({
        ok: false,
        code: "AUTHENTICATION_REQUIRED",
      });
      expect(operations).toEqual([]);

      if ("POST" in userland && typeof userland.POST === "function") {
        const postResponse = await userland.POST(
          new Request(`http://localhost:3000${entry.pathname}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ triggerType: "hot-lead-detected" }),
          }),
        );
        expect(postResponse.status).toBe(401);
        expect(operations).toEqual([]);
      }
    },
  );

  it.each(ROUTES)(
    "preserves editor seed writes for $name",
    async (entry) => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "editor-1", email: "editor@example.com", app_metadata: { role: "editor" } } },
        error: null,
      });
      const userland = await entry.load();
      const response = await userland.GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.ok).toBe(true);
      const methods = operations.map((operation) => operation.method);
      for (const method of entry.writeMethods) {
        expect(methods).toContain(method);
      }
    },
  );
});
