import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  AUTHENTICATION_REQUIRED_BODY,
  EDITOR_FORBIDDEN_BODY,
} from "../../lib/publishing/require-editor-auth";

const mockGetUser = vi.fn();
const youTubePostUpdate = vi.fn();
const youTubePostFindUnique = vi.fn();
const videoMemoryFindMany = vi.fn();
const startPersistentScheduler = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    youTubePost: {
      update: (...args: unknown[]) => youTubePostUpdate(...args),
      findUnique: (...args: unknown[]) => youTubePostFindUnique(...args),
    },
    videoPerformanceMemory: {
      findMany: (...args: unknown[]) => videoMemoryFindMany(...args),
    },
  },
}));

vi.mock("../../lib/agents/persistent-scheduler-agent", () => ({
  startPersistentScheduler: (...args: unknown[]) =>
    startPersistentScheduler(...args),
}));

vi.mock("../../lib/agents/director-agent", () => ({
  directorAgent: vi.fn(() => ({ directorDecision: { priority: "low" } })),
}));

vi.mock("../../lib/agents/script-generation-agent", () => ({
  scriptGenerationAgent: vi.fn(async () => ({
    generatedScript: "script",
    topic: "topic",
  })),
}));

vi.mock("../../lib/agents/scene-planner-agent", () => ({
  scenePlannerAgent: vi.fn(async () => ({ scenes: [] })),
}));

vi.mock("../../lib/agents/shorts-swarm-agent", () => ({
  shortsSwarmAgent: vi.fn(async () => ({ shorts: [] })),
}));

vi.mock("../../lib/agents/thumbnail-intelligence-agent", () => ({
  thumbnailIntelligenceAgent: vi.fn(async () => ({ thumbnails: [] })),
}));

vi.mock("../../lib/agents/timeline-builder-agent", () => ({
  timelineBuilderAgent: vi.fn(async () => ({ timeline: [] })),
}));

vi.mock("../../lib/agents/visual-asset-agent", () => ({
  visualAssetAgent: vi.fn(async () => ({ assets: [] })),
}));

vi.mock("../../lib/agents/voiceover-director-agent", () => ({
  voiceoverDirectorAgent: vi.fn(async () => ({ voiceover: {} })),
}));

const PRISMA_WRITERS = [
  ["script-generation", "../../app/api/agents/script-generation/route"],
  ["scene-planner", "../../app/api/agents/scene-planner/route"],
  ["shorts-swarm", "../../app/api/agents/shorts-swarm/route"],
  ["thumbnail-intelligence", "../../app/api/agents/thumbnail-intelligence/route"],
  ["timeline-builder", "../../app/api/agents/timeline-builder/route"],
  ["visual-assets", "../../app/api/agents/visual-assets/route"],
  ["voiceover-director", "../../app/api/agents/voiceover-director/route"],
] as const;

const PUBLIC_ALLOWLIST = [
  "architecture-overview/route.ts",
  "registry/route.ts",
  "subtitles/view/route.ts",
  "render-video/route.ts",
  "render-with-subtitles/route.ts",
  "youtube-publish/route.ts",
] as const;

function walkRoutes(dir: string, base = dir): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walkRoutes(full, base));
    else if (name === "route.ts") out.push(full.slice(base.length + 1).replaceAll("\\", "/"));
  }
  return out;
}

function anonymous(path: string, method = "POST") {
  return new NextRequest(`https://attacker.example${path}`, {
    method,
    headers: {
      host: "attacker.example",
      "x-forwarded-host": "attacker.example",
      "content-type": "application/json",
    },
    body: method === "GET" ? undefined : JSON.stringify({ topic: "x", youtubePostId: "yp_1" }),
  });
}

describe("M2-SR1 agent API auth remediation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    youTubePostUpdate.mockResolvedValue({ id: "yp_1" });
    youTubePostFindUnique.mockResolvedValue({ id: "yp_1", fullScript: "script" });
    videoMemoryFindMany.mockResolvedValue([]);
  });

  it("inventories 112 agent routes with auth on privileged surfaces", () => {
    const routes = walkRoutes(join(process.cwd(), "app/api/agents"));
    expect(routes).toHaveLength(112);

    const missingAuth: string[] = [];
    for (const route of routes) {
      if ((PUBLIC_ALLOWLIST as readonly string[]).includes(route)) continue;
      const source = readFileSync(join(process.cwd(), "app/api/agents", route), "utf8");
      if (!/requireEditorAuth|requirePublishingEditor/.test(source)) {
        missingAuth.push(route);
      }
    }
    expect(missingAuth).toEqual([]);

    for (const allowed of PUBLIC_ALLOWLIST) {
      const source = readFileSync(join(process.cwd(), "app/api/agents", allowed), "utf8");
      expect(source).not.toMatch(/requireEditorAuth|requirePublishingEditor/);
    }
  });

  it.each(PRISMA_WRITERS)(
    "rejects unauthenticated POST to Prisma writer %s before DB work",
    async (name, modulePath) => {
      const mod = await import(modulePath);
      const response = await mod.POST(anonymous(`/api/agents/${name}`));
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY);
      expect(youTubePostUpdate).not.toHaveBeenCalled();
    },
  );

  it("rejects unauthenticated director before scheduler/DB", async () => {
    const { POST } = await import("../../app/api/agents/director/route");
    const response = await POST(anonymous("/api/agents/director"));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY);
    expect(startPersistentScheduler).not.toHaveBeenCalled();
    expect(videoMemoryFindMany).not.toHaveBeenCalled();
  });

  it("rejects non-editor sessions on a Prisma writer", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "u1",
          email: "reader@example.com",
          app_metadata: { role: "reader" },
        },
      },
      error: null,
    });
    const { POST } = await import("../../app/api/agents/script-generation/route");
    const response = await POST(anonymous("/api/agents/script-generation"));
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual(EDITOR_FORBIDDEN_BODY);
    expect(youTubePostUpdate).not.toHaveBeenCalled();
  });

  it("keeps public allowlist readable without editor auth", async () => {
    const { GET } = await import("../../app/api/agents/architecture-overview/route");
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.architecture).toBeTruthy();
  });

  it("keeps disabled stubs returning 501 without requiring a session", async () => {
    const { POST } = await import("../../app/api/agents/youtube-publish/route");
    const response = await POST();
    expect(response.status).toBe(501);
    const body = await response.json();
    expect(body.disabled).toBe(true);
  });

  it("preserves AI Autonomous Pipeline lockdown (disabled after editor auth)", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "admin-1",
          email: "admin@example.com",
          app_metadata: { role: "admin" },
        },
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
        body: "{}",
      }),
    );
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual(AUTONOMOUS_PIPELINE_DISABLED_BODY);
  });
});
