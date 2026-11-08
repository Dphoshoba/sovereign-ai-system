import { afterEach, describe, expect, it } from "vitest";
import { finalTextCleanup } from "../../app/api/ai/generate-article/route";
import { requireCurrentFeaturedImagePrompt } from "../../lib/ai/featured-image-prompt";
import { consensusEngine } from "../../lib/research/consensus-engine";
import { factExtractor } from "../../lib/research/fact-extractor";
import { factVerificationEngine } from "../../lib/research/fact-verification-engine";
import { sourceCollector } from "../../lib/research/source-collector";
import type { ExtractedFact } from "../../lib/research/fact-extractor";
import type { VerifiedFact } from "../../lib/research/fact-verification-engine";

const HOMEPAGE_URLS = [
  "https://openai.com",
  "https://www.microsoft.com/ai",
  "https://ai.google",
  "https://www.ibm.com/artificial-intelligence",
  "https://hai.stanford.edu",
  "https://www.nist.gov/artificial-intelligence",
];

const NIST_SENTENCE =
  "The NIST AI Risk Management Framework helps organizations govern artificial intelligence risk through documented controls and measurement.";

function extractedFact(
  claim: string,
  evidenceId: string,
  sourceUrl: string,
  evidenceText: string,
): ExtractedFact {
  return {
    claim,
    evidenceId,
    sourceTitle: sourceUrl,
    sourceUrl,
    sourceType: "government",
    evidenceText,
    confidence: "medium",
    requiresHumanReview: true,
  };
}

function verifiedFact(
  claim: string,
  status: VerifiedFact["verificationStatus"],
  score: number,
): VerifiedFact {
  return {
    ...extractedFact(claim, claim, "https://www.nist.gov/rmf", claim),
    verificationCount: status === "unverified" ? 1 : 2,
    verificationStatus: status,
    verificationMethod: "semantic",
    supportingSources: [
      {
        sourceTitle: "NIST",
        sourceUrl: "https://www.nist.gov/rmf",
        evidenceId: claim,
      },
    ],
    similarityMatches: [],
    verificationScore: score,
  };
}

describe("research quality remediation", () => {
  const originalBraveKey = process.env.BRAVE_SEARCH_API_KEY;
  const originalSearchProvider = process.env.SEARCH_PROVIDER;

  afterEach(() => {
    if (originalBraveKey === undefined) delete process.env.BRAVE_SEARCH_API_KEY;
    else process.env.BRAVE_SEARCH_API_KEY = originalBraveKey;
    if (originalSearchProvider === undefined) delete process.env.SEARCH_PROVIDER;
    else process.env.SEARCH_PROVIDER = originalSearchProvider;
  });

  it("does not invent six homepage sources when search is unavailable", async () => {
    delete process.env.BRAVE_SEARCH_API_KEY;
    delete process.env.SEARCH_PROVIDER;

    const result = await sourceCollector(
      "NIST AI RMF",
      [],
      "ai-governance",
    );

    expect(result.sourceCount).toBe(0);
    expect(result.collectionStatus).toContain("Research blocked");
    expect(result.collectedSources.map((source) => source.url)).not.toEqual(
      expect.arrayContaining(HOMEPAGE_URLS),
    );
    expect(result.collectedSources).toHaveLength(0);
  });

  it("preserves an explicitly supplied manual source", async () => {
    delete process.env.BRAVE_SEARCH_API_KEY;

    const result = await sourceCollector(
      "NIST AI RMF",
      [
        {
          title: "NIST AI RMF",
          url: "https://www.nist.gov/itl/ai-risk-management-framework",
          sourceType: "government",
          relevanceScore: 95,
        },
      ],
      "ai-governance",
    );

    expect(result.collectedSources.map((source) => source.url)).toEqual([
      "https://www.nist.gov/itl/ai-risk-management-framework",
    ]);
  });

  it("keeps a NIST sentence instead of creating a creator-automation claim", () => {
    const result = factExtractor(
      "NIST AI RMF",
      [
        {
          id: "nist-1",
          sourceTitle: "NIST AI RMF",
          sourceUrl: "https://www.nist.gov/itl/ai-risk-management-framework",
          sourceType: "government",
          extractedText: `${NIST_SENTENCE} The page also mentions workflow as a generic word.`,
          confidence: 90,
          requiresHumanReview: true,
        },
      ],
      "ai-governance",
    );

    expect(result.facts.map((fact) => fact.claim)).toContain(NIST_SENTENCE);
    expect(result.facts.map((fact) => fact.claim).join(" ")).not.toContain(
      "AI automation can",
    );
    expect(result.facts[0]).toEqual(
      expect.objectContaining({
        sourceUrl: "https://www.nist.gov/itl/ai-risk-management-framework",
        evidenceId: "nist-1",
      }),
    );
  });

  it("does not treat duplicate text as a second independent source", () => {
    const claim = NIST_SENTENCE;
    const result = factVerificationEngine([
      extractedFact(claim, "evidence-1", "https://www.nist.gov/rmf", claim),
      extractedFact(claim, "evidence-2", "https://openai.com", claim),
      extractedFact(claim, "evidence-1", "https://www.nist.gov/rmf", claim),
    ]);

    expect(result.verifiedFacts).toHaveLength(1);
    expect(result.verifiedFacts[0]?.verificationCount).toBe(1);
    expect(result.verifiedFacts[0]?.verificationStatus).not.toBe("verified");
    expect(result.verifiedCount).toBe(0);
  });

  it("does not classify trustworthy AI or confidence as Faith and Courage", () => {
    const result = consensusEngine([
      verifiedFact(
        "Trustworthy AI and confidence in model performance remain design goals for risk management systems.",
        "unverified",
        59,
      ),
    ]);

    expect(result.consensusGroups.map((group) => group.theme)).not.toContain(
      "Faith and Courage",
    );
  });

  it("refuses publish-ready when verification is 59 and unverified facts remain", () => {
    const result = consensusEngine([
      verifiedFact(
        "The NIST framework documents how organizations can map AI risks before deployment.",
        "verified",
        59,
      ),
      verifiedFact(
        "Measurement of AI risk remains incomplete for this deployment context.",
        "unverified",
        59,
      ),
    ]);

    expect(result.unverifiedFacts).toBeGreaterThan(0);
    expect(result.publicationRecommendation).not.toBe("publish-ready");
  });

  it("preserves Markdown headings, lists, and bold text", () => {
    const markdown = [
      "## Governing AI risk",
      "",
      "AI risk needs **human review** before release.",
      "",
      "- Map the context",
      "- Measure the impact",
    ].join("\n");

    expect(finalTextCleanup(markdown)).toBe(markdown);
  });

  it("blocks featured-image generation before human approval", () => {
    const result = requireCurrentFeaturedImagePrompt({
      id: "article-1",
      title: "NIST AI RMF",
      category: "ai-governance",
      status: "review-required",
      content: "Draft",
      excerpt: "Draft",
      researchAudits: [],
      reviewNotes: [],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("invalid_status");
    }
  });
});
