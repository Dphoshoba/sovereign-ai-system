import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  AUTHENTICATION_REQUIRED_BODY,
  EDITOR_FORBIDDEN_BODY,
} from "../../lib/publishing/require-editor-auth";

const { mockGetUser, calls } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  calls: {
    sourceCollector: vi.fn(),
    evidenceRegistry: vi.fn(),
    contentFetcher: vi.fn(),
    missionEngine: vi.fn(),
    discoverTopics: vi.fn(),
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("../../lib/research/source-collector", async () => {
  const actual = await vi.importActual<
    typeof import("../../lib/research/source-collector")
  >("../../lib/research/source-collector");
  return {
    ...actual,
    sourceCollector: (...args: unknown[]) => {
      calls.sourceCollector(...args);
      return Promise.resolve({
        topic: typeof args[0] === "string" ? args[0] : "",
        collectedSources: [],
        sourceCount: 0,
        averageAuthorityScore: 0,
        averageTrustScore: 0,
        researchConfidence: 0,
        collectionStatus: "Sources collected successfully.",
      });
    },
  };
});

vi.mock("../../lib/research/evidence-registry", async () => {
  const actual = await vi.importActual<
    typeof import("../../lib/research/evidence-registry")
  >("../../lib/research/evidence-registry");
  return {
    ...actual,
    evidenceRegistry: (...args: unknown[]) => {
      calls.evidenceRegistry(...args);
      return Promise.resolve({
        topic: typeof args[0] === "string" ? args[0] : "",
        evidence: [],
        evidenceCount: 0,
        registryStatus: "No useful evidence available after filtering.",
      });
    },
  };
});

vi.mock("../../lib/research/content-fetcher", async () => {
  const actual = await vi.importActual<
    typeof import("../../lib/research/content-fetcher")
  >("../../lib/research/content-fetcher");
  return {
    ...actual,
    contentFetcher: (...args: unknown[]) => {
      calls.contentFetcher(...args);
      return Promise.resolve({
        title: typeof args[1] === "string" ? args[1] : "Example source",
        url: typeof args[0] === "string" ? args[0] : "https://example.com/doc",
        extractedText:
          "The NIST AI Risk Management Framework is a voluntary resource for governing artificial intelligence risk.",
        fetchStatus: "success",
        contentKind: "html",
      });
    },
  };
});

vi.mock("../../lib/research/mission-engine", async () => {
  const actual = await vi.importActual<
    typeof import("../../lib/research/mission-engine")
  >("../../lib/research/mission-engine");
  return {
    ...actual,
    runAutonomousResearchMissionEngine: (
      ...args: Parameters<typeof actual.runAutonomousResearchMissionEngine>
    ) => {
      calls.missionEngine(...args);
      return actual.runAutonomousResearchMissionEngine(...args);
    },
  };
});

vi.mock("../../lib/research/topic-discovery", async () => {
  const actual = await vi.importActual<
    typeof import("../../lib/research/topic-discovery")
  >("../../lib/research/topic-discovery");
  return {
    ...actual,
    discoverResearchTopics: (
      ...args: Parameters<typeof actual.discoverResearchTopics>
    ) => {
      calls.discoverTopics(...args);
      return actual.discoverResearchTopics(...args);
    },
  };
});

type ResearchRoute = {
  name: string;
  modulePath: string;
  method: "GET" | "POST";
  path: string;
  keys: string[];
};

const routes: ResearchRoute[] = [
  {
    name: "content fetcher",
    modulePath: "../../app/api/research/content-fetcher/route",
    method: "POST",
    path: "/api/research/content-fetcher",
    keys: ["title", "url", "extractedText", "fetchStatus", "contentKind"],
  },
  {
    name: "evidence chunker",
    modulePath: "../../app/api/research/evidence-chunker/route",
    method: "POST",
    path: "/api/research/evidence-chunker",
    keys: ["ok", "fetched", "chunkCount", "chunks"],
  },
  {
    name: "chunk ranker",
    modulePath: "../../app/api/research/chunk-ranker/route",
    method: "POST",
    path: "/api/research/chunk-ranker",
    keys: ["ok", "topic", "fetched", "chunkCount", "rankedChunkCount", "topChunks"],
  },
  {
    name: "source collector",
    modulePath: "../../app/api/research/source-collector/route",
    method: "POST",
    path: "/api/research/source-collector",
    keys: ["ok", "result"],
  },
  {
    name: "evidence registry",
    modulePath: "../../app/api/research/evidence-registry/route",
    method: "POST",
    path: "/api/research/evidence-registry",
    keys: ["ok", "sourceCollection", "result"],
  },
  {
    name: "fact extractor",
    modulePath: "../../app/api/research/fact-extractor/route",
    method: "POST",
    path: "/api/research/fact-extractor",
    keys: ["ok", "sourceCollection", "evidence", "result"],
  },
  {
    name: "fact verifier",
    modulePath: "../../app/api/research/fact-verifier/route",
    method: "POST",
    path: "/api/research/fact-verifier",
    keys: ["ok", "sourceCollection", "evidence", "factExtraction", "result"],
  },
  {
    name: "fact verification engine",
    modulePath: "../../app/api/research/fact-verification-engine/route",
    method: "POST",
    path: "/api/research/fact-verification-engine",
    keys: ["ok", "sourceCollection", "evidence", "factExtraction", "result"],
  },
  {
    name: "fact clusterer",
    modulePath: "../../app/api/research/fact-clusterer/route",
    method: "POST",
    path: "/api/research/fact-clusterer",
    keys: ["ok", "sourceCollection", "evidence", "factExtraction", "result"],
  },
  {
    name: "outline builder",
    modulePath: "../../app/api/research/outline-builder/route",
    method: "POST",
    path: "/api/research/outline-builder",
    keys: ["ok", "sourceCollection", "evidence", "factExtraction", "result"],
  },
  {
    name: "section builder",
    modulePath: "../../app/api/research/section-builder/route",
    method: "POST",
    path: "/api/research/section-builder",
    keys: ["ok", "sourceCollection", "evidence", "factExtraction", "clusters", "result"],
  },
  {
    name: "paragraph builder",
    modulePath: "../../app/api/research/paragraph-builder/route",
    method: "POST",
    path: "/api/research/paragraph-builder",
    keys: ["ok", "sourceCollection", "evidence", "factExtraction", "clusters", "sections", "result"],
  },
  {
    name: "narrative paragraph builder",
    modulePath: "../../app/api/research/narrative-paragraph-builder/route",
    method: "POST",
    path: "/api/research/narrative-paragraph-builder",
    keys: ["ok", "sourceCollection", "evidence", "factExtraction", "clusters", "sections", "result"],
  },
  {
    name: "citation builder",
    modulePath: "../../app/api/research/citation-builder/route",
    method: "POST",
    path: "/api/research/citation-builder",
    keys: ["ok", "sourceCollection", "evidence", "factExtraction", "factVerification", "result"],
  },
  {
    name: "publication gate",
    modulePath: "../../app/api/research/publication-gate/route",
    method: "POST",
    path: "/api/research/publication-gate",
    keys: ["ok", "sourceCollection", "evidence", "factExtraction", "factVerification", "consensus", "result"],
  },
  {
    name: "article composer",
    modulePath: "../../app/api/research/article-composer/route",
    method: "POST",
    path: "/api/research/article-composer",
    keys: ["ok", "sourceCollection", "evidence", "factExtraction", "factVerification", "consensus", "clusters", "sections", "paragraphs", "result"],
  },
  {
    name: "consensus engine",
    modulePath: "../../app/api/research/consensus-engine/route",
    method: "POST",
    path: "/api/research/consensus-engine",
    keys: ["ok", "sourceCollection", "evidence", "factExtraction", "factVerification", "result"],
  },
  {
    name: "claim similarity",
    modulePath: "../../app/api/research/claim-similarity/route",
    method: "POST",
    path: "/api/research/claim-similarity",
    keys: ["ok", "claimA", "claimB", "threshold", "similarityScore", "similar"],
  },
  {
    name: "missions",
    modulePath: "../../app/api/research/missions/route",
    method: "GET",
    path: "/api/research/missions",
    keys: ["ok", "dryRun", "writesToPrisma", "graphWrites", "graphDeletes", "automaticApprovals", "automaticPublishing", "dashboard", "missions", "integrationFlow", "summary"],
  },
  {
    name: "missions post",
    modulePath: "../../app/api/research/missions/route",
    method: "POST",
    path: "/api/research/missions",
    keys: ["ok", "dryRun", "writesToPrisma", "graphWrites", "graphDeletes", "automaticApprovals", "automaticPublishing", "transition", "dashboard", "missions", "summary"],
  },
  {
    name: "mission discovery",
    modulePath: "../../app/api/research/missions/discover/route",
    method: "GET",
    path: "/api/research/missions/discover",
    keys: ["ok", "dryRun", "liveTrendCollection", "writesToPrisma", "graphWrites", "automaticApprovals", "automaticPublishing", "discovery", "prioritization"],
  },
  {
    name: "mission discovery post",
    modulePath: "../../app/api/research/missions/discover/route",
    method: "POST",
    path: "/api/research/missions/discover",
    keys: ["ok", "dryRun", "liveTrendCollection", "writesToPrisma", "graphWrites", "automaticApprovals", "automaticPublishing", "discovery", "prioritization"],
  },
  {
    name: "mission readiness",
    modulePath: "../../app/api/research/missions/readiness/route",
    method: "GET",
    path: "/api/research/missions/readiness",
    keys: ["ok", "dryRun", "writesToPrisma", "graphWrites", "graphDeletes", "automaticApprovals", "automaticPublishing", "readiness", "allReadiness", "summary"],
  },
  {
    name: "pipeline",
    modulePath: "../../app/api/research/pipeline/route",
    method: "GET",
    path: "/api/research/pipeline",
    keys: ["ok", "architecture"],
  },
];

function session(user: Record<string, unknown> | null) {
  mockGetUser.mockResolvedValue({ data: { user }, error: null });
}

function editorialUser(role: "admin" | "editor") {
  return {
    id: `${role}-1`,
    email: `${role}@example.com`,
    role: "authenticated",
    app_metadata: { role },
  };
}

function requestFor(
  route: ResearchRoute,
  headers?: Record<string, string>,
  body = "{}",
) {
  return new NextRequest(`http://localhost${route.path}`, {
    method: route.method,
    headers: {
      "content-type": "application/json",
      "x-user-role": "admin",
      ...headers,
    },
    body: route.method === "POST" ? body : undefined,
  });
}

async function invoke(route: ResearchRoute, request: NextRequest) {
  const loaded = await import(route.modulePath);
  const handler = route.method === "GET" ? loaded.GET : loaded.POST;
  return handler(request) as Promise<Response>;
}

function expectNoResearchWork() {
  expect(calls.sourceCollector).not.toHaveBeenCalled();
  expect(calls.evidenceRegistry).not.toHaveBeenCalled();
  expect(calls.contentFetcher).not.toHaveBeenCalled();
  expect(calls.missionEngine).not.toHaveBeenCalled();
  expect(calls.discoverTopics).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
}

describe("research API editor authorisation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    process.env.CRON_SECRET = "cron-canary-do-not-leak";
    session(null);
  });

  it.each(routes)(
    "rejects an anonymous $name request before research work",
    async (route) => {
      const response = await invoke(route, requestFor(route, undefined, "{"));

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY);
      expectNoResearchWork();
    },
  );

  it.each(routes)(
    "rejects an authenticated non-editor $name request before research work",
    async (route) => {
      session({
        id: "viewer-1",
        email: "viewer@example.com",
        role: "authenticated",
        app_metadata: { role: "viewer" },
      });

      const response = await invoke(route, requestFor(route, undefined, "{"));

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual(EDITOR_FORBIDDEN_BODY);
      expectNoResearchWork();
    },
  );

  it.each(routes)(
    "rejects a cron bearer for $name",
    async (route) => {
      const response = await invoke(
        route,
        requestFor(
          route,
          { authorization: "Bearer cron-canary-do-not-leak" },
          "{",
        ),
      );

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY);
      expectNoResearchWork();
    },
  );

  it.each(["editor", "admin"] as const)(
    "preserves research response keys for an %s",
    async (role) => {
      session(editorialUser(role));

      for (const route of routes) {
        const response = await invoke(route, requestFor(route));
        const body = await response.json();

        expect(response.status, route.name).toBe(200);
        expect(Object.keys(body).sort(), route.name).toEqual([...route.keys].sort());
        expect(fetch, route.name).not.toHaveBeenCalled();
      }
    },
  );

  it("keeps mission execution and live trend collection blocked for an editor", async () => {
    session(editorialUser("editor"));
    const missions = routes.find((route) => route.name === "missions post");
    const discovery = routes.find((route) => route.name === "mission discovery post");
    if (!missions || !discovery) throw new Error("mission routes missing");

    const missionResponse = await invoke(
      missions,
      requestFor(missions, undefined, JSON.stringify({ dryRun: false })),
    );
    const discoveryResponse = await invoke(
      discovery,
      requestFor(discovery, undefined, JSON.stringify({ liveTrendCollection: true })),
    );

    expect(missionResponse.status).toBe(400);
    await expect(missionResponse.json()).resolves.toMatchObject({
      ok: false,
      dryRun: true,
      writesToPrisma: false,
      automaticPublishing: false,
    });
    expect(discoveryResponse.status).toBe(400);
    await expect(discoveryResponse.json()).resolves.toMatchObject({
      ok: false,
      dryRun: true,
      liveTrendCollection: false,
    });
    expect(calls.missionEngine).not.toHaveBeenCalled();
    expect(calls.discoverTopics).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("removes the development fixture routes from the API tree", async () => {
    const root = path.resolve(__dirname, "../../app/api/research");
    const removed = [
      ["encoding-normalizer-test/route", "encoding-normalizer-test/route.ts"],
      [
        "fact-verification-engine/test-semantic/route",
        "fact-verification-engine/test-semantic/route.ts",
      ],
    ] as const;

    for (const [modulePath, filePath] of removed) {
      expect(fs.existsSync(path.join(root, filePath))).toBe(false);
      await expect(import(`../../app/api/research/${modulePath}`)).rejects.toThrow();
    }
  });
});
