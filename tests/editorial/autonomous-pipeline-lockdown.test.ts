import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  AUTHENTICATION_REQUIRED_BODY,
  EDITOR_FORBIDDEN_BODY,
} from "../../lib/publishing/require-editor-auth";

const mockGetUser = vi.fn();
const articleCreate = vi.fn();
const articleFindFirst = vi.fn();
const videoMemoryFindMany = vi.fn();
const openAIResponsesCreate = vi.fn();
const directorAgent = vi.fn();
const autonomousPipelineAgent = vi.fn();
const executionTriggerAgent = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: {
      findFirst: (...args: unknown[]) => articleFindFirst(...args),
      create: (...args: unknown[]) => articleCreate(...args),
    },
    videoPerformanceMemory: {
      findMany: (...args: unknown[]) => videoMemoryFindMany(...args),
    },
  },
}));

vi.mock("@/lib/ai/openai", () => ({
  getOpenAI: vi.fn(() => ({
    responses: { create: (...args: unknown[]) => openAIResponsesCreate(...args) },
  })),
}));

vi.mock("../../lib/agents/director-agent", () => ({
  directorAgent: (...args: unknown[]) => directorAgent(...args),
}));

vi.mock("../../lib/agents/autonomous-pipeline-agent", () => ({
  autonomousPipelineAgent: (...args: unknown[]) => autonomousPipelineAgent(...args),
}));

vi.mock("../../lib/agents/execution-trigger-agent", () => ({
  executionTriggerAgent: (...args: unknown[]) => executionTriggerAgent(...args),
}));

function anonymous(path: string) {
  return new NextRequest(`https://attacker.example${path}`, {
    method: "POST",
    headers: {
      host: "attacker.example",
      "x-forwarded-host": "attacker.example",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      topic: "Unauthorized packaging",
      category: "ai-tools",
      mode: "publish",
    }),
  });
}

describe("M2-P0 Autonomous Pipeline lockdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    articleFindFirst.mockResolvedValue(null);
    videoMemoryFindMany.mockResolvedValue([]);
    directorAgent.mockReturnValue({
      directorDecision: {
        recommendedWorkflow: "Proceed to render and schedule",
        priority: "high",
        nextBestActions: [],
      },
    });
    autonomousPipelineAgent.mockResolvedValue({
      autonomousExecution: true,
      executionPlan: ["Publish to YouTube"],
      status: "ready",
    });
    executionTriggerAgent.mockResolvedValue({
      autonomousExecution: true,
      totalTasks: 0,
      executedTasks: [],
    });
  });

  it("rejects unauthenticated AI autonomous-pipeline before any work", async () => {
    const { POST } = await import("../../app/api/ai/autonomous-pipeline/route");
    const response = await POST(anonymous("/api/ai/autonomous-pipeline"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY);
    expect(articleCreate).not.toHaveBeenCalled();
    expect(openAIResponsesCreate).not.toHaveBeenCalled();
  });

  it("rejects non-editor sessions before any AI pipeline work", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "reader@example.com", app_metadata: { role: "reader" } } },
      error: null,
    });
    const { POST } = await import("../../app/api/ai/autonomous-pipeline/route");
    const response = await POST(anonymous("/api/ai/autonomous-pipeline"));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual(EDITOR_FORBIDDEN_BODY);
    expect(articleCreate).not.toHaveBeenCalled();
    expect(openAIResponsesCreate).not.toHaveBeenCalled();
  });

  it("keeps authenticated editors from bypassing research/audit via autonomous-pipeline", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: "admin-1", email: "admin@example.com", app_metadata: { role: "admin" } },
      },
      error: null,
    });
    const { POST, AUTONOMOUS_PIPELINE_DISABLED_BODY } = await import(
      "../../app/api/ai/autonomous-pipeline/route"
    );
    const response = await POST(
      new Request("http://localhost/api/ai/autonomous-pipeline", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topic: "Bypass attempt",
          category: "ai-tools",
          mode: "publish",
          approvedBy: "spoofed-director",
          approvedAt: "2026-11-18T00:00:00.000Z",
        }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual(AUTONOMOUS_PIPELINE_DISABLED_BODY);
    expect(AUTONOMOUS_PIPELINE_DISABLED_BODY.useInstead).toBe("/api/ai/generate-article");
    expect(articleCreate).not.toHaveBeenCalled();
    expect(openAIResponsesCreate).not.toHaveBeenCalled();
  });

  it.each([
    ["agents autonomous-pipeline", "../../app/api/agents/autonomous-pipeline/route", "/api/agents/autonomous-pipeline"],
    [
      "execute autonomous-pipeline",
      "../../app/api/agents/execute-autonomous-pipeline/route",
      "/api/agents/execute-autonomous-pipeline",
    ],
  ])("rejects unauthenticated %s before agent work", async (_name, modulePath, path) => {
    const { POST } = await import(modulePath);
    const response = await POST(anonymous(path));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY);
    expect(videoMemoryFindMany).not.toHaveBeenCalled();
    expect(directorAgent).not.toHaveBeenCalled();
    expect(autonomousPipelineAgent).not.toHaveBeenCalled();
    expect(executionTriggerAgent).not.toHaveBeenCalled();
  });
});
