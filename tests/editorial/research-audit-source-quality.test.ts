import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { researchPublicationBlockReason } from "../../lib/publishing/publication-guard";
import { recommendationWithEvidenceCompleteness } from "../../lib/research/evidence-completeness";
import {
  consensusEngine,
  PUBLISH_READY_CONSENSUS_SCORE,
  PUBLISH_READY_RECOMMENDATION,
  PUBLISH_READY_SOURCE_QUALITY_SCORE,
} from "../../lib/research/consensus-engine";
import type { VerifiedFact } from "../../lib/research/fact-verification-engine";
import {
  CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
  isCurrentResearchAuditEngineRevision,
} from "../../lib/research/research-audit-engine-revision";
import { DELOITTE_SURVEY_PASSAGE } from "../fixtures/research-audit/article-2";
import { BIBLEPROJECT_SAUL_ARC_CLAIM } from "../fixtures/research-audit/article-3";

const GOV = [
  "https://www.nist.gov/one",
  "https://www.nist.gov/two",
  "https://www.cisa.gov/three",
];
const MICROSOFT =
  "https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-privacy";

function fact(
  status: VerifiedFact["verificationStatus"],
  urls: string[],
  text: string,
  listedUrl = "",
): VerifiedFact {
  return {
    claim: text,
    evidenceId: urls[0] ?? "",
    sourceTitle: listedUrl || urls[0] || "",
    sourceUrl: listedUrl || urls[0] || "",
    sourceType: "documented-source",
    evidenceText: text,
    confidence: status === "unverified" ? "low" : "high",
    requiresHumanReview: status !== "verified",
    verificationCount: urls.length,
    verificationStatus: status,
    verificationMethod: urls.length > 1 ? "exact" : "single-source-supported",
    supportingSources: urls.map((sourceUrl) => ({
      sourceTitle: sourceUrl,
      sourceUrl,
      evidenceId: sourceUrl,
    })),
    verificationScore: status === "unverified" ? 0 : 90,
  };
}

describe("source quality without empty groups", () => {
  it("averages authority only across groups that have accepted supporting URLs", () => {
    const sourced = Array.from({ length: 4 }, (_, index) =>
      fact(
        "verified",
        GOV,
        `NIST reports that privacy control ${index} is required for the documented system.`,
      ),
    );
    const unsupported = fact(
      "unverified",
      [],
      "The model may invent a confident answer without a source.",
      "https://central.xero.com/s/article/About-Just-Ask-Xero-JAX",
    );
    const result = consensusEngine([...sourced, unsupported]);

    expect(result.sourceQualityScore).toBe(100);
    expect(result.consensusScore).toBe(90);
    expect(result.zeroSourceGroups).toHaveLength(1);
    expect(result.zeroSourceGroups[0]?.sourceCount).toBe(0);
    expect(result.zeroSourceGroups[0]?.theme).not.toBe(
      result.consensusGroups.find((group) => group.sourceCount > 0)?.theme,
    );
    expect(result.publicationRecommendation).toBe("publish-ready");
    expect(
      recommendationWithEvidenceCompleteness(result.publicationRecommendation, [
        ...sourced,
        unsupported,
      ]),
    ).toBe("review-required");
    expect(unsupported.verificationStatus).toBe("unverified");
  });

  it("keeps source quality at zero when every group lacks accepted sources", () => {
    const first = fact("unverified", [], "The first claim has no accepted passage.");
    const second = fact("unverified", [], "The second claim also has no accepted passage.");
    const result = consensusEngine([first, second]);

    expect(result.zeroSourceGroups).toHaveLength(result.consensusGroups.length);
    expect(result.sourceQualityScore).toBe(0);
    expect(result.publicationRecommendation).not.toBe("publish-ready");
    expect(result.consensusGroups.every((group) => group.sourceCount === 0)).toBe(true);
  });

  it("does not treat a bare source URL as corroboration", () => {
    const missing = fact(
      "unverified",
      [],
      "A listed page was fetched but yielded no usable article text.",
      "https://central.xero.com/s/article/About-Just-Ask-Xero-JAX",
    );
    const result = consensusEngine([missing]);
    expect(result.consensusGroups[0]?.sourceCount).toBe(0);
    expect(result.zeroSourceGroups).toHaveLength(1);
    expect(result.publicationRecommendation).toBe("blocked");
  });

  it("keeps one official vendor claim partial and below the publication thresholds", () => {
    const vendor = fact(
      "partially verified",
      [MICROSOFT],
      "Microsoft's Outlook help says Copilot can draft a customer email that a person reviews before it is sent.",
    );
    const result = consensusEngine([vendor]);
    expect(vendor.verificationStatus).toBe("partially verified");
    expect(result.sourceQualityScore).toBe(80);
    expect(result.consensusScore).toBeLessThan(PUBLISH_READY_CONSENSUS_SCORE);
    expect(result.publicationRecommendation).not.toBe("publish-ready");
    expect(
      recommendationWithEvidenceCompleteness("publish-ready", [vendor], [
        { text: "A later eligible claim.", section: "Business reporting" },
      ]),
    ).toBe("review-required");
  });

  it("preserves the publication thresholds and v11 historical boundary", () => {
    expect(PUBLISH_READY_CONSENSUS_SCORE).toBe(80);
    expect(PUBLISH_READY_SOURCE_QUALITY_SCORE).toBe(70);
    expect(PUBLISH_READY_RECOMMENDATION).toBe("publish-ready");
    expect(CURRENT_RESEARCH_AUDIT_ENGINE_REVISION).toBe("article-grounded-v13");
    expect(isCurrentResearchAuditEngineRevision("article-grounded-v12")).toBe(false);
    expect(isCurrentResearchAuditEngineRevision("article-grounded-v11")).toBe(false);
    expect(isCurrentResearchAuditEngineRevision("article-grounded-v10")).toBe(false);
    expect(isCurrentResearchAuditEngineRevision("article-grounded-v9")).toBe(false);
    expect(isCurrentResearchAuditEngineRevision("article-grounded-v7")).toBe(false);
    expect(
      researchPublicationBlockReason({
        consensusScore: 90,
        sourceQualityScore: 100,
        publicationRecommendation: "review-required",
      }),
    ).toContain("not publish-ready");
    expect(DELOITTE_SURVEY_PASSAGE.toLowerCase()).toContain("warning");
    expect(BIBLEPROJECT_SAUL_ARC_CLAIM.toLowerCase()).toContain("warning");
  });

  it("keeps the v11 safeguard on every supported recommendation path", () => {
    const root = process.cwd();
    const prepare = readFileSync(
      path.join(root, "lib/research/prepare-article-for-review.ts"),
      "utf8",
    );
    expect(prepare).toContain("recommendationWithEvidenceCompleteness");
    for (const relative of [
      "app/api/ai/generate-article/route.ts",
      "app/api/execution/generate-mdx/route.ts",
      "app/api/research/publication-gate/route.ts",
    ]) {
      const source = readFileSync(path.join(root, relative), "utf8");
      expect(source).toContain("publicationGate(governedConsensus)");
    }
  });
});
