import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  AUTHENTICATION_REQUIRED_BODY,
  EDITOR_FORBIDDEN_BODY,
} from "../../lib/publishing/require-editor-auth";

const mockGetUser = vi.fn();
const sourceCollector = vi.fn();
const evidenceRegistry = vi.fn();
const factExtractor = vi.fn();
const factVerificationEngine = vi.fn();
const consensusEngine = vi.fn();
const articleCreate = vi.fn();
const chatCreate = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: {
      create: (...args: unknown[]) => articleCreate(...args),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/ai/openai", () => ({
  getOpenAI: vi.fn(() => ({
    responses: { create: (...args: unknown[]) => chatCreate(...args) },
  })),
}));

vi.mock("../../lib/research/source-collector", () => ({
  sourceCollector: (...args: unknown[]) => sourceCollector(...args),
}));

vi.mock("../../lib/research/evidence-registry", () => ({
  evidenceRegistry: (...args: unknown[]) => evidenceRegistry(...args),
}));

vi.mock("../../lib/research/fact-extractor", () => ({
  factExtractor: (...args: unknown[]) => factExtractor(...args),
}));

vi.mock("../../lib/research/fact-verification-engine", () => ({
  factVerificationEngine: (...args: unknown[]) => factVerificationEngine(...args),
}));

vi.mock("../../lib/research/consensus-engine", () => ({
  consensusEngine: (...args: unknown[]) => consensusEngine(...args),
}));

const manualSources = [
  {
    title: "NIST AI Risk Management Framework",
    url: "https://www.nist.gov/itl/ai-risk-management-framework",
    sourceType: "government",
  },
  {
    title: "NIST AI RMF resources",
    url: "https://airc.nist.gov/airmf-resources/airmf/",
    sourceType: "government",
  },
];

const sourceCollection = {
  topic: "NIST AI Risk Management Framework",
  collectedSources: manualSources,
  sourceCount: 2,
  averageAuthorityScore: 100,
  averageTrustScore: 95,
  researchConfidence: 88,
  collectionStatus: "Sources collected successfully.",
};

const evidence = {
  topic: "NIST AI Risk Management Framework",
  evidence: [
    {
      id: "nist-1",
      sourceTitle: manualSources[0].title,
      sourceUrl: manualSources[0].url,
      sourceType: "government",
      extractedText: "The Framework is voluntary.",
      confidence: 85,
      requiresHumanReview: true,
    },
  ],
  evidenceCount: 1,
  registryStatus: "Evidence registry created from filtered and ranked evidence chunks.",
};

const factExtraction = {
  topic: "NIST AI Risk Management Framework",
  facts: [
    {
      claim: "The Framework is voluntary.",
      evidenceId: "nist-1",
      sourceUrl: manualSources[0].url,
    },
  ],
  factCount: 1,
  extractionStatus: "Expanded canonical facts extracted from evidence records.",
};

const factVerification = {
  verifiedFacts: [
    {
      ...factExtraction.facts[0],
      verificationCount: 1,
      verificationStatus: "unverified",
      verificationScore: 49,
    },
  ],
  verifiedCount: 0,
  partiallyVerifiedCount: 0,
  unverifiedCount: 1,
  averageVerificationScore: 49,
  publicationBlocked: true,
};

const consensus = {
  totalFacts: 1,
  verifiedFacts: 0,
  partiallyVerifiedFacts: 0,
  unverifiedFacts: 1,
  consensusScore: 25,
  sourceQualityScore: 100,
  consensusGroups: [],
  consensusGroupCount: 0,
  publicationRecommendation: "blocked",
  summary: "Consensus score is 25 across 0 consensus group(s).",
};

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

function request(headers?: HeadersInit) {
  return new NextRequest("http://localhost/api/research/consensus-engine", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({
      topic: "NIST AI Risk Management Framework",
      manualSources,
    }),
  });
}

function expectNoResearchWork() {
  expect(sourceCollector).not.toHaveBeenCalled();
  expect(evidenceRegistry).not.toHaveBeenCalled();
  expect(factExtractor).not.toHaveBeenCalled();
  expect(factVerificationEngine).not.toHaveBeenCalled();
  expect(consensusEngine).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
  expect(articleCreate).not.toHaveBeenCalled();
  expect(chatCreate).not.toHaveBeenCalled();
}

describe("POST /api/research/consensus-engine authorisation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    process.env.CRON_SECRET = "cron-canary-do-not-leak";
    session(null);
    sourceCollector.mockResolvedValue(sourceCollection);
    evidenceRegistry.mockResolvedValue(evidence);
    factExtractor.mockReturnValue(factExtraction);
    factVerificationEngine.mockReturnValue(factVerification);
    consensusEngine.mockReturnValue(consensus);
  });

  it("rejects an anonymous request before research starts", async () => {
    const { POST } = await import("../../app/api/research/consensus-engine/route");

    const response = await POST(request());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY);
    expectNoResearchWork();
  });

  it("rejects an authenticated non-editor before research starts", async () => {
    session({
      id: "viewer-1",
      email: "viewer@example.com",
      role: "authenticated",
      app_metadata: { role: "viewer" },
    });
    const { POST } = await import("../../app/api/research/consensus-engine/route");

    const response = await POST(request({ "x-user-role": "admin" }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual(EDITOR_FORBIDDEN_BODY);
    expectNoResearchWork();
  });

  it("rejects a valid cron bearer because this route has no cron caller", async () => {
    const { POST } = await import("../../app/api/research/consensus-engine/route");

    const response = await POST(
      request({ authorization: "Bearer cron-canary-do-not-leak" }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual(AUTHENTICATION_REQUIRED_BODY);
    expectNoResearchWork();
  });

  it.each(["editor", "admin"] as const)(
    "returns the existing research envelope for an %s",
    async (role) => {
      session(editorialUser(role));
      const { POST } = await import("../../app/api/research/consensus-engine/route");

      const response = await POST(request());
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        ok: true,
        sourceCollection,
        evidence,
        factExtraction,
        factVerification,
        result: consensus,
      });
      expect(sourceCollector).toHaveBeenCalledWith(
        "NIST AI Risk Management Framework",
        manualSources,
      );
      expect(evidenceRegistry).toHaveBeenCalledWith(
        "NIST AI Risk Management Framework",
        sourceCollection.collectedSources,
      );
      expect(factExtractor).toHaveBeenCalledWith(
        "NIST AI Risk Management Framework",
        evidence.evidence,
      );
      expect(factVerificationEngine).toHaveBeenCalledWith(factExtraction.facts);
      expect(consensusEngine).toHaveBeenCalledWith(factVerification.verifiedFacts);
      expect(fetch).not.toHaveBeenCalled();
      expect(articleCreate).not.toHaveBeenCalled();
      expect(chatCreate).not.toHaveBeenCalled();
    },
  );
});
