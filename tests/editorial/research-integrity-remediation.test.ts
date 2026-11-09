import { describe, expect, it } from "vitest";
import { consensusEngine } from "../../lib/research/consensus-engine";
import {
  factExtractor,
  removeAccidentalHeading,
} from "../../lib/research/fact-extractor";
import type { ExtractedFact } from "../../lib/research/fact-extractor";
import { factVerificationEngine } from "../../lib/research/fact-verification-engine";
import { publicationGate } from "../../lib/research/publication-gate";

const NIST_PAGE = "https://www.nist.gov/itl/ai-risk-management-framework";
const NIST_PAGE_VARIANT =
  "https://nist.gov/itl/ai-risk-management-framework/?utm_source=preview#govern";
const AIRC_PAGE = "https://airc.nist.gov/airmf-resources/airmf/";

const GOVERN_CLAIM =
  "The Govern function in the NIST AI Risk Management Framework establishes accountability for artificial intelligence risk.";
const MAP_CLAIM =
  "The Map function in the NIST AI Risk Management Framework identifies the context in which an artificial intelligence system operates.";
const MEASURE_CLAIM =
  "The Measure function in the NIST AI Risk Management Framework assesses artificial intelligence risk with appropriate methods.";
const MANAGE_CLAIM =
  "The Manage function in the NIST AI Risk Management Framework prioritizes actions that respond to identified artificial intelligence risk.";

function fact(
  claim: string,
  evidenceId: string,
  sourceUrl: string,
  evidenceText = claim,
): ExtractedFact {
  return {
    claim,
    evidenceId,
    sourceTitle: "NIST AI RMF",
    sourceUrl,
    sourceType: "government",
    evidenceText,
    confidence: "medium",
    requiresHumanReview: true,
  };
}

describe("research integrity remediation", () => {
  it("counts one NIST document when several passages use equivalent URLs", () => {
    const result = factVerificationEngine(
      [NIST_PAGE, NIST_PAGE_VARIANT, `${NIST_PAGE}/`].map((sourceUrl, index) =>
        fact(
          GOVERN_CLAIM,
          `evidence-${index}`,
          sourceUrl,
          `${GOVERN_CLAIM} Passage ${index} is another chunk of the same document.`,
        ),
      ),
    );

    expect(result.verifiedFacts).toHaveLength(1);
    expect(result.verifiedFacts[0]?.verificationCount).toBe(1);
    expect(result.verifiedFacts[0]?.supportingSources).toHaveLength(1);
    expect(result.verifiedFacts[0]?.verificationStatus).not.toBe("verified");
    expect(result.verifiedFacts[0]?.verificationMethod).toBe(
      "single-source-supported",
    );
    expect(result.publicationBlocked).toBe(true);
    expect(result.verifiedCount).toBe(0);
  });

  it("keeps two NIST documents independent", () => {
    const result = factVerificationEngine([
      fact(
        GOVERN_CLAIM,
        "page-a",
        NIST_PAGE,
        `${GOVERN_CLAIM} The public framework page states this directly.`,
      ),
      fact(
        GOVERN_CLAIM,
        "page-b",
        AIRC_PAGE,
        `${GOVERN_CLAIM} The resource center states the same function separately.`,
      ),
    ]);

    expect(result.verifiedFacts[0]?.verificationCount).toBe(2);
    expect(result.verifiedFacts[0]?.supportingSources).toHaveLength(2);
    expect(
      result.verifiedFacts[0]?.supportingSources.map((source) => source.sourceUrl),
    ).toEqual([NIST_PAGE, AIRC_PAGE]);
  });

  it("blocks publication when verified and unverified facts are mixed", () => {
    const result = factVerificationEngine([
      fact(
        GOVERN_CLAIM,
        "page-a",
        NIST_PAGE,
        `${GOVERN_CLAIM} The public framework page states this directly.`,
      ),
      fact(
        GOVERN_CLAIM,
        "page-b",
        AIRC_PAGE,
        `${GOVERN_CLAIM} The resource center states the same function separately.`,
      ),
      fact(MAP_CLAIM, "map-only", NIST_PAGE, MAP_CLAIM),
    ]);

    expect(result.verifiedCount).toBeGreaterThan(0);
    expect(result.unverifiedCount).toBeGreaterThan(0);
    expect(result.publicationBlocked).toBe(true);

    const consensus = consensusEngine(result.verifiedFacts);
    const decision = publicationGate({
      ...consensus,
      publicationRecommendation: "publish-ready",
      unverifiedFacts: 5,
    });

    expect(consensus.publicationRecommendation).not.toBe("publish-ready");
    expect(decision.approved).toBe(false);
    expect(decision.status).not.toBe("publish-ready");
  });

  it("classifies Govern, Map, Measure, and Manage as governance rather than analytics", () => {
    const claims = [GOVERN_CLAIM, MAP_CLAIM, MEASURE_CLAIM, MANAGE_CLAIM];
    const consensus = consensusEngine(
      claims.map((claim) => ({
        ...fact(claim, claim, NIST_PAGE, claim),
        verificationCount: 1,
        verificationStatus: "unverified" as const,
        verificationMethod: "single-source-supported" as const,
        supportingSources: [
          {
            sourceTitle: "NIST AI RMF",
            sourceUrl: NIST_PAGE,
            evidenceId: claim,
          },
        ],
        similarityMatches: [],
        verificationScore: 40,
      })),
    );

    expect(consensus.consensusGroups.map((group) => group.theme)).toEqual([
      "AI Risk Governance",
    ]);
    expect(
      consensus.consensusGroups
        .map((group) => group.consensusStatement)
        .join(" "),
    ).not.toContain("AI-driven analytics");
    for (const group of consensus.consensusGroups) {
      expect(group.consensusStatement).toContain("NIST");
    }
  });

  it("reports extracted and deduplicated counts when one repeated claim collapses", () => {
    const claims = [
      GOVERN_CLAIM,
      GOVERN_CLAIM,
      MAP_CLAIM,
      MEASURE_CLAIM,
      MANAGE_CLAIM,
      "The NIST AI Risk Management Framework is voluntary guidance for managing artificial intelligence risk.",
      "Organizations can use the NIST AI Risk Management Framework to document artificial intelligence risk decisions.",
    ];
    const result = factVerificationEngine(
      claims.map((claim, index) => fact(claim, `fact-${index}`, NIST_PAGE, claim)),
    );

    expect(result.extractedCount).toBe(7);
    expect(result.deduplicatedCount).toBe(6);
    expect(result.verifiedFacts).toHaveLength(6);
  });

  it("removes a glued NIST function heading from an otherwise complete claim", () => {
    const sentence =
      "Govern The NIST AI Risk Management Framework helps organizations govern artificial intelligence risk through documented controls and measurement.";
    const extracted = factExtractor("NIST AI RMF", [
      {
        id: "heading-1",
        sourceTitle: "NIST AI RMF",
        sourceUrl: NIST_PAGE,
        sourceType: "government",
        extractedText: sentence,
        confidence: 90,
        requiresHumanReview: true,
      },
    ]);

    expect(removeAccidentalHeading(sentence)).toBe(
      "The NIST AI Risk Management Framework helps organizations govern artificial intelligence risk through documented controls and measurement.",
    );
    expect(extracted.facts.map((item) => item.claim).join(" ")).not.toMatch(
      /^Govern /,
    );
    expect(extracted.factCount).toBe(extracted.facts.length);
  });
});
