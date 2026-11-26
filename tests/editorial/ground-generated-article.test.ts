// Behaviour under test: verifyGeneratedArticleAgainstEvidence marks unsupported
 // factual claims unverified, leaves supported drafts clean, and tags versioned
 // audits with EV-REG-SPEC-1.1.0. Module: lib/research/ground-generated-article.ts.
 // Existing tests: none for this helper. Prepare suites cover prepare-article-for-review only.
 // User instruction (Mission 005R): "Improve autonomous content quality" and
 // "Run controlled end-to-end tests showing ... supported article ... unsupported article remains blocked."
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  unsupportedClaimsRevisionBrief,
  verifyGeneratedArticleAgainstEvidence,
} from "../../lib/research/ground-generated-article";
import type { EvidenceRecord } from "../../lib/research/evidence-registry";
import { EV_REG_SPEC_1_1_0 } from "../../lib/research/audit-specification-compatibility";
import { canShowPrepareForReviewAction } from "../../lib/publishing/article-action-visibility";

const SHARED_CLAIM =
  "Organizations should document accountability for artificial intelligence risk before a system is deployed.";

function evidence(
  id: string,
  url: string,
  text: string,
): EvidenceRecord {
  return {
    id,
    sourceTitle: id,
    sourceUrl: url,
    sourceType: "government",
    extractedText: text,
    confidence: 90,
    requiresHumanReview: false,
  };
}

describe("ground-generated-article", () => {
  it("marks unsupported factual claims as unverified and keeps supported drafts free of unverified facts", () => {
    const nist = "https://www.nist.gov/artificial-intelligence";
    const airc =
      "https://airc.nist.gov/AI_RMF_Knowledge_Base/AI_RMF";

    const unsupported = verifyGeneratedArticleAgainstEvidence({
      title: "AI without control",
      excerpt: "A guide.",
      content:
        "## Invented statistic\n\nExactly 87% of small businesses doubled revenue with AI last quarter according to a secret study.\n",
      evidence: [
        evidence(
          "nist",
          nist,
          `${SHARED_CLAIM} The framework page states this directly.`,
        ),
      ],
      listedSources: [{ url: nist, title: "NIST" }],
      versioned: false,
    });
    expect(unsupported.unverifiedCount).toBeGreaterThan(0);
    expect(unsupported.unsupportedFactualClaims.length).toBeGreaterThan(0);
    expect(
      unsupportedClaimsRevisionBrief(unsupported.unsupportedFactualClaims),
    ).toContain("87%");

    const supported = verifyGeneratedArticleAgainstEvidence({
      title: "Document AI accountability",
      excerpt: "Practical guidance.",
      content:
        `## Accountability before deployment\n\n${SHARED_CLAIM} Keep the record with the people who own the system.\n`,
      evidence: [
        evidence(
          "framework",
          nist,
          `${SHARED_CLAIM} The framework page states this directly.`,
        ),
        evidence(
          "resource",
          airc,
          `${SHARED_CLAIM} The resource center states this separately.`,
        ),
      ],
      listedSources: [
        { url: nist, title: "NIST" },
        { url: airc, title: "AIRC" },
      ],
      versioned: false,
    });
    expect(supported.unverifiedCount).toBe(0);
    expect(
      supported.verifiedCount + supported.partiallyVerifiedCount,
    ).toBeGreaterThan(0);
  });

  it("writes EV-REG-SPEC-1.1.0 metadata when versioned verification is requested", () => {
    const nist = "https://www.nist.gov/artificial-intelligence";
    const result = verifyGeneratedArticleAgainstEvidence({
      title: "Document AI accountability",
      content:
        `## Accountability before deployment\n\n${SHARED_CLAIM}\n`,
      evidence: [
        evidence(
          "framework",
          nist,
          `${SHARED_CLAIM} The framework page states this directly.`,
        ),
      ],
      listedSources: [{ url: nist, title: "NIST" }],
      versioned: true,
    });
    expect(result.specificationVersion).toBe(EV_REG_SPEC_1_1_0);
    expect(result.disputes).toEqual([]);
  });

  it("aligns Prepare visibility with outdated baseline audits and wires generate-article grounding", () => {
    expect(
      canShowPrepareForReviewAction({
        status: "review-required",
        hasCurrentAudit: true,
        currentAuditSpecificationVersion: null,
        versionedVerifierEnabled: true,
      }),
    ).toBe(true);
    expect(
      canShowPrepareForReviewAction({
        status: "review-required",
        hasCurrentAudit: true,
        currentAuditSpecificationVersion: EV_REG_SPEC_1_1_0,
        versionedVerifierEnabled: true,
      }),
    ).toBe(false);

    const generateRoute = readFileSync(
      join(process.cwd(), "app/api/ai/generate-article/route.ts"),
      "utf8",
    );
    expect(generateRoute).toContain("verifyGeneratedArticleAgainstEvidence");
    expect(generateRoute).toContain("unsupportedClaimsRevisionBrief");
    expect(generateRoute).toContain("articleGrounded: true");

    const auditPanel = readFileSync(
      join(process.cwd(), "app/admin/articles/ArticleAuditPanel.tsx"),
      "utf8",
    );
    expect(auditPanel).toContain("data-prepare-reevaluation");
    expect(auditPanel).toContain("canShowPrepareForReviewAction");
  });
});
