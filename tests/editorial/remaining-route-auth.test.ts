import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { AUTHENTICATION_REQUIRED_BODY } from "../../lib/publishing/require-editor-auth";
import {
  PUBLISH_READY_CONSENSUS_SCORE,
  PUBLISH_READY_RECOMMENDATION,
  PUBLISH_READY_SOURCE_QUALITY_SCORE,
} from "../../lib/research/consensus-engine";

const mockGetUser = vi.fn();
const articleFindMany = vi.fn();
const articleFindUnique = vi.fn();
const articleCreate = vi.fn();
const newsletterCreate = vi.fn();
const socialCreateMany = vi.fn();
const subscriberFindMany = vi.fn();
const socialFindMany = vi.fn();
const newsletterFindMany = vi.fn();
const snapshotFindMany = vi.fn();
const snapshotUpsert = vi.fn();
const scheduledFindMany = vi.fn();
const jobCreate = vi.fn();
const activityCreate = vi.fn();
const topicFindMany = vi.fn();
const topicFindFirst = vi.fn();
const topicFindUnique = vi.fn();
const topicUpdate = vi.fn();
const topicCreate = vi.fn();
const transaction = vi.fn();
const chatCreate = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: {
      findMany: (...args: unknown[]) => articleFindMany(...args),
      findUnique: (...args: unknown[]) => articleFindUnique(...args),
      create: (...args: unknown[]) => articleCreate(...args),
    },
    newsletter: {
      findMany: (...args: unknown[]) => newsletterFindMany(...args),
      create: (...args: unknown[]) => newsletterCreate(...args),
    },
    socialPost: {
      findMany: (...args: unknown[]) => socialFindMany(...args),
      createMany: (...args: unknown[]) => socialCreateMany(...args),
    },
    subscriber: {
      findMany: (...args: unknown[]) => subscriberFindMany(...args),
    },
    monthlySnapshot: {
      findMany: (...args: unknown[]) => snapshotFindMany(...args),
      upsert: (...args: unknown[]) => snapshotUpsert(...args),
    },
    aiScheduledOperation: {
      findMany: (...args: unknown[]) => scheduledFindMany(...args),
    },
    aiJob: {
      create: (...args: unknown[]) => jobCreate(...args),
    },
    aiActivityEvent: {
      create: (...args: unknown[]) => activityCreate(...args),
    },
    discoveredTopic: {
      findMany: (...args: unknown[]) => topicFindMany(...args),
      findFirst: (...args: unknown[]) => topicFindFirst(...args),
      findUnique: (...args: unknown[]) => topicFindUnique(...args),
      update: (...args: unknown[]) => topicUpdate(...args),
      create: (...args: unknown[]) => topicCreate(...args),
    },
    $transaction: (...args: unknown[]) => transaction(...args),
  },
}));

vi.mock("@/lib/ai/openai", () => ({
  getOpenAI: vi.fn(() => ({
    chat: { completions: { create: (...args: unknown[]) => chatCreate(...args) } },
  })),
}));

const PRODUCTION_ORIGIN = "https://sovereign-ai-executive.vercel.app";

function anonymous(path: string, method = "POST") {
  return new NextRequest(`https://attacker.example${path}`, {
    method,
    headers: {
      host: "attacker.example",
      "x-forwarded-host": "attacker.example",
      "content-type": "application/json",
    },
    body: method === "GET" ? undefined : JSON.stringify({ articleId: "article-1", topicId: "topic-1" }),
  });
}

function expectNoSideEffects() {
  expect(articleFindMany).not.toHaveBeenCalled();
  expect(articleFindUnique).not.toHaveBeenCalled();
  expect(articleCreate).not.toHaveBeenCalled();
  expect(newsletterCreate).not.toHaveBeenCalled();
  expect(socialCreateMany).not.toHaveBeenCalled();
  expect(subscriberFindMany).not.toHaveBeenCalled();
  expect(snapshotUpsert).not.toHaveBeenCalled();
  expect(scheduledFindMany).not.toHaveBeenCalled();
  expect(jobCreate).not.toHaveBeenCalled();
  expect(activityCreate).not.toHaveBeenCalled();
  expect(topicFindMany).not.toHaveBeenCalled();
  expect(topicUpdate).not.toHaveBeenCalled();
  expect(topicCreate).not.toHaveBeenCalled();
  expect(transaction).not.toHaveBeenCalled();
  expect(chatCreate).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
}

describe("remaining automation route authentication", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    process.env.NEXT_PUBLIC_APP_URL = PRODUCTION_ORIGIN;
    delete process.env.VERCEL_URL;
    process.env.CRON_SECRET = "cron-canary-do-not-leak";
    process.env.NODE_ENV = originalNodeEnv;
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

  it.each([
    ["weekly planner", "../../app/api/workers/weekly-planner/route", "GET", "/api/workers/weekly-planner"],
    ["package generation", "../../app/api/articles/generate-package/route", "POST", "/api/articles/generate-package"],
    ["snapshot", "../../app/api/reports/snapshot/route", "POST", "/api/reports/snapshot"],
    ["executive intelligence", "../../app/api/reports/executive-intelligence/route", "GET", "/api/reports/executive-intelligence"],
    ["scheduler run", "../../app/api/ai/scheduler/run/route", "POST", "/api/ai/scheduler/run"],
    ["run and execute", "../../app/api/ai/scheduler/run-and-execute/route", "POST", "/api/ai/scheduler/run-and-execute"],
    ["run and execute get", "../../app/api/ai/scheduler/run-and-execute/route", "GET", "/api/ai/scheduler/run-and-execute"],
    ["scheduled discovery", "../../app/api/discovery/scheduled-run/route", "POST", "/api/discovery/scheduled-run"],
    ["autonomous discovery", "../../app/api/discovery/run-autonomous/route", "POST", "/api/discovery/run-autonomous"],
    ["article generation", "../../app/api/ai/generate-article/route", "POST", "/api/ai/generate-article"],
    ["discovery queue", "../../app/api/discovery/run-queue/route", "POST", "/api/discovery/run-queue"],
    ["queue generation", "../../app/api/discovery/generate-from-queue/route", "POST", "/api/discovery/generate-from-queue"],
    ["create article", "../../app/api/discovery/create-article/route", "POST", "/api/discovery/create-article"],
  ])("rejects anonymous %s before any work", async (_name, modulePath, method, path) => {
    const route = await import(modulePath);
    const handler = method === "GET" ? route.GET : route.POST;
    const response = await handler(anonymous(path, method));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY);
    expectNoSideEffects();
  });

  it("rejects an invalid cron bearer before discovery work", async () => {
    const { POST } = await import("../../app/api/discovery/scheduled-run/route");
    const response = await POST(
      new NextRequest("https://attacker.example/api/discovery/scheduled-run", {
        method: "POST",
        headers: { authorization: "Bearer wrong-secret" },
      }),
    );

    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
    expectNoSideEffects();
  });

  it("continues scheduled discovery for a valid cron bearer on the local trusted origin", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const { POST } = await import("../../app/api/discovery/scheduled-run/route");
    const response = await POST(
      new NextRequest("https://attacker.example/api/discovery/scheduled-run", {
        method: "POST",
        headers: {
          authorization: "Bearer cron-canary-do-not-leak",
          "x-forwarded-host": "attacker.example",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toBe("http://localhost:3000/api/discovery/run-autonomous");
    expect(new Headers(init?.headers).get("authorization")).toBe(
      "Bearer cron-canary-do-not-leak",
    );
    expect(new Headers(init?.headers).get("cookie")).toBeNull();
  });

  it("writes a snapshot for an authorised editor", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "editor-1", email: "editor@example.com" } },
      error: null,
    });
    articleFindMany.mockResolvedValue([]);
    socialFindMany.mockResolvedValue([]);
    newsletterFindMany.mockResolvedValue([]);
    subscriberFindMany.mockResolvedValue([]);
    snapshotUpsert.mockResolvedValue({ id: "snap-1", month: "2026-11" });
    const { POST } = await import("../../app/api/reports/snapshot/route");
    const response = await POST(anonymous("/api/reports/snapshot"));

    expect(response.status).toBe(200);
    expect(snapshotUpsert).toHaveBeenCalledTimes(1);
  });

  it("forwards only the editor session to the platform origin", async () => {
    process.env.VERCEL_URL = "deployment.example";
    mockGetUser.mockResolvedValue({
      data: { user: { id: "editor-1", email: "editor@example.com" } },
      error: null,
    });
    vi.mocked(fetch).mockImplementation(async () =>
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const { POST } = await import("../../app/api/ai/scheduler/run-and-execute/route");
    const response = await POST(
      new NextRequest("https://attacker.example/api/ai/scheduler/run-and-execute", {
        method: "POST",
        headers: {
          cookie: "theme=dark; sb-preview-auth-token=editor-session",
          "x-forwarded-host": "attacker.example",
          authorization: "Bearer cron-canary-do-not-leak",
        },
      }),
    );

    expect(response.status).toBe(200);
    const calls = vi.mocked(fetch).mock.calls.map(([url, init]) => ({
      url: String(url),
      cookie: new Headers(init?.headers).get("cookie"),
      authorization: new Headers(init?.headers).get("authorization"),
    }));
    expect(calls.map((call) => call.url)).toEqual([
      "https://deployment.example/api/ai/scheduler/run",
      "https://deployment.example/api/ai/jobs/run",
    ]);
    expect(calls.every((call) => call.cookie === "sb-preview-auth-token=editor-session")).toBe(true);
    expect(calls.every((call) => call.authorization === null)).toBe(true);
  });

  it("does not call production when the platform origin is unavailable", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.VERCEL_URL;
    mockGetUser.mockResolvedValue({
      data: { user: { id: "editor-1", email: "editor@example.com" } },
      error: null,
    });
    const { POST } = await import("../../app/api/discovery/scheduled-run/route");
    const response = await POST(
      new NextRequest("https://attacker.example/api/discovery/scheduled-run", {
        method: "POST",
        headers: { cookie: "sb-preview-auth-token=editor-session" },
      }),
    );

    expect(response.status).toBe(500);
    expect(fetch).not.toHaveBeenCalled();
  });
});
