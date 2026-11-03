import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/research/source-collector", () => ({
  sourceCollector: vi.fn(async () => ({
    collectedSources: [],
    sourceCount: 0,
    averageAuthorityScore: 0,
    averageTrustScore: 0,
    researchConfidence: 0,
  })),
}));
vi.mock("../../lib/research/evidence-registry", () => ({
  evidenceRegistry: vi.fn(async () => ({ evidence: [], evidenceCount: 0 })),
}));
vi.mock("../../lib/research/fact-extractor", () => ({
  factExtractor: vi.fn(() => ({ facts: [], factCount: 0 })),
}));
vi.mock("../../lib/research/fact-verification-engine", () => ({
  factVerificationEngine: vi.fn(),
}));
vi.mock("../../lib/research/consensus-engine", () => ({
  consensusEngine: vi.fn(),
}));

describe("POST /api/research/publication-gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes the completeness recommendation to the publication gate", async () => {
    const { consensusEngine } = await import("../../lib/research/consensus-engine");
    const { factVerificationEngine } = await import(
      "../../lib/research/fact-verification-engine"
    );
    vi.mocked(consensusEngine).mockReturnValue({
      totalFacts: 1,
      verifiedFacts: 0,
      partiallyVerifiedFacts: 0,
      unverifiedFacts: 1,
      consensusScore: 92,
      sourceQualityScore: 100,
      consensusGroups: [],
      zeroSourceGroups: [],
      consensusGroupCount: 0,
      publicationRecommendation: "publish-ready",
      summary: "Scores pass while one claim is unverified.",
    });
    vi.mocked(factVerificationEngine).mockReturnValue({
      verifiedFacts: [
        {
          claim: "An unsupported product claim.",
          evidenceId: "",
          sourceTitle: "",
          sourceUrl: "",
          sourceType: "",
          evidenceText: "",
          confidence: "low",
          requiresHumanReview: true,
          verificationCount: 0,
          verificationStatus: "unverified",
          verificationMethod: "single-source-supported",
          supportingSources: [],
          verificationScore: 0,
        },
      ],
      verifiedCount: 0,
      partiallyVerifiedCount: 0,
      unverifiedCount: 1,
      averageVerificationScore: 0,
      publicationBlocked: true,
    });

    const { POST } = await import("../../app/api/research/publication-gate/route");
    const response = await POST(
      new Request("http://localhost/api/research/publication-gate", {
        method: "POST",
        body: JSON.stringify({ topic: "Evidence completeness" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.consensus.consensusScore).toBe(92);
    expect(body.consensus.sourceQualityScore).toBe(100);
    expect(body.consensus.publicationRecommendation).toBe("review-required");
    expect(body.result).toMatchObject({
      approved: false,
      status: "review-required",
    });
  });
});
