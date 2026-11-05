import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { AUTHENTICATION_REQUIRED_BODY } from "../../lib/publishing/require-editor-auth";
import {
  PUBLISH_READY_CONSENSUS_SCORE,
  PUBLISH_READY_RECOMMENDATION,
  PUBLISH_READY_SOURCE_QUALITY_SCORE,
} from "../../lib/research/consensus-engine";

const mockGetUser = vi.fn();
const articleFindFirst = vi.fn();
const newsletterUpdateMany = vi.fn();
const socialUpdateMany = vi.fn();
const transitionArticleLifecycle = vi.fn();
const publishDueArticles = vi.fn();
const runWeeklyPlanner = vi.fn();
const createSnapshot = vi.fn();
const runIntelligence = vi.fn();
const aiJobFindFirst = vi.fn();
const aiJobUpdate = vi.fn();
const aiActivityCreate = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: {
      findFirst: (...args: unknown[]) => articleFindFirst(...args),
    },
    newsletter: {
      updateMany: (...args: unknown[]) => newsletterUpdateMany(...args),
    },
    socialPost: {
      updateMany: (...args: unknown[]) => socialUpdateMany(...args),
    },
    aiJob: {
      findFirst: (...args: unknown[]) => aiJobFindFirst(...args),
      update: (...args: unknown[]) => aiJobUpdate(...args),
    },
    aiActivityEvent: {
      create: (...args: unknown[]) => aiActivityCreate(...args),
    },
  },
}));

vi.mock("../../lib/publishing/article-lifecycle", () => ({
  transitionArticleLifecycle: (...args: unknown[]) =>
    transitionArticleLifecycle(...args),
}));

vi.mock("../../lib/publishing/publish-due-articles", () => ({
  publishDueArticles: (...args: unknown[]) => publishDueArticles(...args),
}));

vi.mock("../../app/api/workers/weekly-planner/route", () => ({
  GET: (...args: unknown[]) => runWeeklyPlanner(...args),
}));

vi.mock("../../app/api/reports/snapshot/route", () => ({
  POST: (...args: unknown[]) => createSnapshot(...args),
}));

vi.mock("../../app/api/reports/executive-intelligence/route", () => ({
  GET: (...args: unknown[]) => runIntelligence(...args),
}));

const PRODUCTION_ORIGIN = "https://sovereign-ai-executive.vercel.app";
const PREVIEW_ORIGIN = "https://preview.example";
const TRUSTED_LOCAL_ORIGIN = "http://localhost:3000";

function session(
  user: {
    id: string;
    email: string;
    app_metadata?: { role?: string };
  } | null,
) {
  mockGetUser.mockResolvedValue({
    data: {
      user: user
        ? {
            role: "authenticated",
            ...user,
            app_metadata: user.app_metadata ?? { role: "editor" },
          }
        : null,
    },
    error: null,
  });
}

function editorRequest(path: string, body?: unknown) {
  return new NextRequest(`${PREVIEW_ORIGIN}${path}`, {
    method: "POST",
    headers: {
      cookie: "theme=dark; sb-preview-auth-token=editor-session",
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("automation endpoint editor authentication", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    session(null);
    process.env.NODE_ENV = originalNodeEnv;
    process.env.NEXT_PUBLIC_APP_URL = PRODUCTION_ORIGIN;
    delete process.env.VERCEL_URL;
    articleFindFirst.mockResolvedValue(null);
    newsletterUpdateMany.mockResolvedValue({ count: 0 });
    socialUpdateMany.mockResolvedValue({ count: 0 });
    transitionArticleLifecycle.mockResolvedValue({
      ok: true,
      article: { id: "article-1", status: "scheduled" },
      alreadyApplied: false,
      articleUnchanged: false,
    });
    publishDueArticles.mockResolvedValue({
      invocationId: "inv-1",
      published: 0,
      skipped: 0,
      failed: 0,
    });
    aiJobFindFirst.mockResolvedValue(null);
    aiActivityCreate.mockResolvedValue({ id: "activity-1" });
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    delete process.env.VERCEL_URL;
  });

  it("keeps the research publication thresholds unchanged", () => {
    expect(PUBLISH_READY_CONSENSUS_SCORE).toBe(80);
    expect(PUBLISH_READY_SOURCE_QUALITY_SCORE).toBe(70);
    expect(PUBLISH_READY_RECOMMENDATION).toBe("publish-ready");
  });

  it("rejects an anonymous pipeline before any internal fetch", async () => {
    const { POST } = await import("../../app/api/pipeline/route");
    const response = await POST(
      new NextRequest(`${PREVIEW_ORIGIN}/api/pipeline`, { method: "POST" }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects anonymous auto-schedule before article reads or distribution", async () => {
    const { POST } = await import("../../app/api/pipeline/auto-schedule/route");
    const response = await POST(
      new NextRequest(`${PREVIEW_ORIGIN}/api/pipeline/auto-schedule`, {
        method: "POST",
        body: JSON.stringify({ articleId: "article-1" }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY);
    expect(articleFindFirst).not.toHaveBeenCalled();
    expect(transitionArticleLifecycle).not.toHaveBeenCalled();
    expect(newsletterUpdateMany).not.toHaveBeenCalled();
    expect(socialUpdateMany).not.toHaveBeenCalled();
  });

  it("rejects anonymous operations before publishing or planner work", async () => {
    const { POST } = await import("../../app/api/operations/route");
    const response = await POST(
      new NextRequest(`${PREVIEW_ORIGIN}/api/operations`, {
        method: "POST",
        body: JSON.stringify({ action: "publish-scheduled" }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY);
    expect(publishDueArticles).not.toHaveBeenCalled();
    expect(runWeeklyPlanner).not.toHaveBeenCalled();
    expect(createSnapshot).not.toHaveBeenCalled();
    expect(runIntelligence).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects an anonymous job run before queue reads or activity writes", async () => {
    const { POST } = await import("../../app/api/ai/jobs/run/route");
    const response = await POST(
      new NextRequest(`${PREVIEW_ORIGIN}/api/ai/jobs/run`, { method: "POST" }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY);
    expect(aiJobFindFirst).not.toHaveBeenCalled();
    expect(aiJobUpdate).not.toHaveBeenCalled();
    expect(aiActivityCreate).not.toHaveBeenCalled();
    expect(publishDueArticles).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("schedules for an editor without using the production origin", async () => {
    session({ id: "editor-1", email: "editor@example.com" });
    const { POST } = await import("../../app/api/pipeline/auto-schedule/route");
    const response = await POST(
      editorRequest("/api/pipeline/auto-schedule", { articleId: "article-1" }),
    );

    expect(response.status).toBe(200);
    expect(transitionArticleLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({
        articleId: "article-1",
        transition: "schedule",
      }),
      expect.anything(),
    );
    expect(newsletterUpdateMany).toHaveBeenCalled();
    expect(socialUpdateMany).toHaveBeenCalled();
  });

  it("publishes due articles for an editor operations request", async () => {
    session({ id: "editor-1", email: "editor@example.com" });
    const { POST } = await import("../../app/api/operations/route");
    const response = await POST(
      editorRequest("/api/operations", { action: "publish-scheduled" }),
    );

    expect(response.status).toBe(200);
    expect(publishDueArticles).toHaveBeenCalledWith({ source: "operations" });
  });

  it("forwards only the editor session cookie from operations to the preview pipeline", async () => {
    session({ id: "editor-1", email: "editor@example.com" });
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const { POST } = await import("../../app/api/operations/route");
    const response = await POST(
      editorRequest("/api/operations", { action: "pipeline" }),
    );

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toBe(`${TRUSTED_LOCAL_ORIGIN}/api/pipeline`);
    expect(String(url)).not.toContain(PRODUCTION_ORIGIN);
    expect(String(url)).not.toContain(PREVIEW_ORIGIN);
    expect(new Headers(init?.headers).get("cookie")).toBe(
      "sb-preview-auth-token=editor-session",
    );
  });

  it("forwards the editor session from pipeline to same-origin auto-schedule", async () => {
    session({ id: "editor-1", email: "editor@example.com" });
    vi.mocked(fetch).mockImplementation(async (url: string | URL | Request) => {
      const href = String(url);
      if (href.endsWith("/api/workers/weekly-planner")) {
        return Response.json({
          ok: true,
          draft: { id: "draft-1", title: "Draft", category: "ai-tools" },
        });
      }
      if (href.endsWith("/api/articles/generate")) {
        return Response.json({ ok: true });
      }
      if (href.endsWith("/api/articles/generate-package")) {
        return Response.json({ ok: true });
      }
      if (href.endsWith("/api/pipeline/auto-schedule")) {
        return Response.json({
          ok: true,
          scheduledFor: "2026-09-27T00:00:00.000Z",
        });
      }
      return Response.json({ ok: false }, { status: 500 });
    });

    const { POST } = await import("../../app/api/pipeline/route");
    const response = await POST(editorRequest("/api/pipeline"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.articleId).toBe("draft-1");
    const calls = vi.mocked(fetch).mock.calls.map(([url, init]) => ({
      url: String(url),
      cookie: new Headers(init?.headers).get("cookie"),
    }));
    expect(calls.map((call) => call.url)).toEqual([
      `${TRUSTED_LOCAL_ORIGIN}/api/workers/weekly-planner`,
      `${TRUSTED_LOCAL_ORIGIN}/api/articles/generate`,
      `${TRUSTED_LOCAL_ORIGIN}/api/articles/generate-package`,
      `${TRUSTED_LOCAL_ORIGIN}/api/pipeline/auto-schedule`,
    ]);
    expect(
      calls.every(
        (call) =>
          !call.url.includes(PRODUCTION_ORIGIN) &&
          !call.url.includes(PREVIEW_ORIGIN),
      ),
    ).toBe(true);
    expect(
      calls.find((call) => call.url.endsWith("/api/pipeline/auto-schedule"))
        ?.cookie,
    ).toBe("sb-preview-auth-token=editor-session");
  });

  it("ignores host headers and the public app URL when forwarding the editor session", async () => {
    process.env.VERCEL_URL = "deployment.example";
    session({ id: "editor-1", email: "editor@example.com" });
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const { POST } = await import("../../app/api/operations/route");
    const response = await POST(
      new NextRequest("https://attacker.example/api/operations", {
        method: "POST",
        headers: {
          host: "attacker.example",
          "x-forwarded-host": "attacker.example",
          cookie: "theme=dark; sb-preview-auth-token=editor-session",
          "content-type": "application/json",
        },
        body: JSON.stringify({ action: "pipeline" }),
      }),
    );

    expect(response.status).toBe(200);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toBe("https://deployment.example/api/pipeline");
    expect(String(url)).not.toContain(PRODUCTION_ORIGIN);
    expect(String(url)).not.toContain("attacker.example");
    expect(new Headers(init?.headers).get("cookie")).toBe(
      "sb-preview-auth-token=editor-session",
    );
  });

  it("fails closed when the trusted origin is unavailable", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.VERCEL_URL;
    session({ id: "editor-1", email: "editor@example.com" });
    const { POST } = await import("../../app/api/pipeline/route");
    const response = await POST(
      new NextRequest("https://attacker.example/api/pipeline", {
        method: "POST",
        headers: {
          host: "attacker.example",
          "x-forwarded-host": PRODUCTION_ORIGIN,
          cookie: "sb-preview-auth-token=editor-session",
        },
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Trusted internal origin is unavailable.",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fails closed when the platform host is not a valid hostname", async () => {
    process.env.VERCEL_URL = "not a host";
    session({ id: "editor-1", email: "editor@example.com" });
    const { POST } = await import("../../app/api/operations/route");
    const response = await POST(
      editorRequest("/api/operations", { action: "pipeline" }),
    );

    expect(response.status).toBe(500);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("checks the job queue for an editor without publishing when nothing is due", async () => {
    session({ id: "editor-1", email: "editor@example.com" });
    const { POST } = await import("../../app/api/ai/jobs/run/route");
    const response = await POST(editorRequest("/api/ai/jobs/run"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe("No queued jobs ready");
    expect(aiJobFindFirst).toHaveBeenCalled();
    expect(publishDueArticles).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
