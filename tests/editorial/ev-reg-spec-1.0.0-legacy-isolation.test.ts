import { describe, expect, it } from "vitest";
import { researchPublicationBlockReason } from "../../lib/publishing/publication-guard";
import { legacyResearchPublicationEnvelope } from "../../lib/research/legacy-publication-isolation";
import { publicationGate } from "../../lib/research/publication-gate";

describe("legacy research publication isolation", () => {
  it("does not let the legacy publication decision authorise an article", () => {
    const decision = publicationGate({
      totalFacts: 1,
      verifiedFacts: 1,
      partiallyVerifiedFacts: 0,
      unverifiedFacts: 0,
      consensusScore: 90,
      sourceQualityScore: 90,
      consensusGroups: [],
      zeroSourceGroups: [],
      consensusGroupCount: 0,
      publicationRecommendation: "publish-ready",
      summary: "Legacy research response.",
    });
    const response = legacyResearchPublicationEnvelope({
      ok: true,
      result: decision,
    });

    expect(decision.approved).toBe(true);
    expect(decision.status).toBe("publish-ready");
    expect(response.articlePublicationAuthorised).toBe(false);
    expect(researchPublicationBlockReason(decision)).toBe(
      "Current research audit is not publish-ready.",
    );
    expect(researchPublicationBlockReason(response)).toBe(
      "Current research audit is not publish-ready.",
    );
  });
});
