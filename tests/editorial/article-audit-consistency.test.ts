import { describe, expect, it } from "vitest";
import { groundedFactVerification } from "../../lib/research/claim-evidence-matcher";
import { factVerificationEngine } from "../../lib/research/fact-verification-engine";
import { consensusEngine } from "../../lib/research/consensus-engine";
import { researchPublicationBlockReason } from "../../lib/publishing/publication-guard";
import type { EvidenceRecord } from "../../lib/research/evidence-registry";

const CLAIM =
  "The NIST AI Risk Management Framework helps organizations govern artificial intelligence risk through documented controls and measurement.";
const SECOND_CLAIM =
  "Laboratory calibration records document the temperature of the reference chamber during each cycle.";
const UNSUPPORTED_CLAIM =
  "An unrelated census figure says forty percent of workshops adopted the draft.";
const NIST_PAGE = "https://www.nist.gov/itl/ai-risk-management-framework";
const NIST_VARIANT =
  "https://nist.gov/itl/ai-risk-management-framework/?utm_source=preview#govern";
const AIRC_PAGE = "https://airc.nist.gov/airmf-resources/airmf/";

function articleClaim(claim: string) {
  return {
    claim,
    articleExcerpt: claim,
    section: "body" as const,
    blockType: "paragraph" as const,
    kind: "factual" as const,
  };
}

function evidence(
  id: string,
  sourceUrl: string,
  extractedText: string,
): EvidenceRecord {
  return {
    id,
    sourceTitle: "NIST AI RMF",
    sourceUrl,
    sourceType: "government",
    extractedText,
    confidence: 95,
    requiresHumanReview: true,
  };
}

describe("article audit consistency", () => {
  it("does not verify one government document from several passages", () => {
    const verification = groundedFactVerification(
      [articleClaim(CLAIM)],
      [
        evidence("passage-a", NIST_PAGE, `${CLAIM} The govern section expands the same page.`),
        evidence("passage-b", NIST_PAGE, `${CLAIM} The manage section expands the same page.`),
      ],
      CLAIM,
    );

    expect(verification.facts[0]?.verificationCount).toBe(1);
    expect(verification.facts[0]?.supportingSources).toHaveLength(2);
    expect(verification.facts[0]?.verificationStatus).toBe("partially verified");
    expect(verification.facts[0]?.verificationMethod).toBe("single-source-supported");
    expect(verification.facts[0]?.requiresHumanReview).toBe(true);
    expect(verification.verifiedCount).toBe(0);
  });

  it("treats equivalent NIST URL variants as one document", () => {
    const verification = groundedFactVerification(
      [articleClaim(CLAIM)],
      [
        evidence("www", NIST_PAGE, `${CLAIM} The public framework page states this directly.`),
        evidence("apex", NIST_VARIANT, `${CLAIM} The same page is addressed by an equivalent URL.`),
      ],
      CLAIM,
    );

    expect(verification.facts[0]?.verificationCount).toBe(1);
    expect(verification.facts[0]?.verificationStatus).not.toBe("verified");
    expect(verification.facts[0]?.sourceUrl).toContain("nist.gov/itl/ai-risk-management-framework");
  });

  it("verifies two genuinely independent NIST documents", () => {
    const verification = groundedFactVerification(
      [articleClaim(CLAIM)],
      [
        evidence("framework", NIST_PAGE, `${CLAIM} The public framework page states this directly.`),
        evidence("resource", AIRC_PAGE, `${CLAIM} The resource center states the same requirement separately.`),
      ],
      CLAIM,
    );

    expect(verification.facts[0]?.verificationCount).toBe(2);
    expect(verification.facts[0]?.verificationStatus).toBe("verified");
    expect(verification.facts[0]?.verificationMethod).toBe("exact");
    expect(verification.facts[0]?.supportingSources.map((source) => source.sourceUrl)).toEqual([
      NIST_PAGE,
      AIRC_PAGE,
    ]);
  });

  it("keeps a mixed result from becoming publish-ready", () => {
    const verification = groundedFactVerification(
      [articleClaim(CLAIM), articleClaim(SECOND_CLAIM), articleClaim(UNSUPPORTED_CLAIM)],
      [
        evidence("framework", NIST_PAGE, `${CLAIM} The public framework page states this directly.`),
        evidence("resource", AIRC_PAGE, `${CLAIM} The resource center states the same requirement separately.`),
        evidence("calibration", NIST_PAGE, SECOND_CLAIM),
      ],
      `${CLAIM} ${SECOND_CLAIM} ${UNSUPPORTED_CLAIM}`,
    );

    expect(verification.verifiedCount).toBe(1);
    expect(verification.partiallyVerifiedCount).toBe(1);
    expect(verification.unverifiedCount).toBe(1);

    const consensus = consensusEngine(verification.facts);
    expect(consensus.publicationRecommendation).not.toBe("publish-ready");
    expect(
      researchPublicationBlockReason({
        consensusScore: 95,
        sourceQualityScore: 95,
        publicationRecommendation: "publish-ready",
        unverifiedCount: verification.unverifiedCount,
        facts: verification.facts,
      }),
    ).toContain("Human review is required");
  });

  it("does not let a favourable audit score override failed research verification", () => {
    const verification = groundedFactVerification(
      [articleClaim(CLAIM)],
      [evidence("only", NIST_PAGE, CLAIM)],
      CLAIM,
    );
    const research = factVerificationEngine([
      {
        claim: CLAIM,
        evidenceId: "only",
        sourceTitle: "NIST AI RMF",
        sourceUrl: NIST_PAGE,
        sourceType: "government",
        evidenceText: CLAIM,
        confidence: "high",
        requiresHumanReview: true,
      },
    ]);

    expect(verification.facts[0]?.verificationStatus).not.toBe("verified");
    expect(research.publicationBlocked).toBe(true);
    expect(research.verifiedFacts[0]?.verificationStatus).not.toBe("verified");
    expect(
      researchPublicationBlockReason({
        consensusScore: 95,
        sourceQualityScore: 100,
        publicationRecommendation: "publish-ready",
        unverifiedCount: research.unverifiedCount,
        facts: [
          {
            verificationStatus: "verified",
            verificationMethod: "single-source-supported",
            verificationCount: 1,
          },
        ],
      }),
    ).toContain("Human review is required");
  });
});
