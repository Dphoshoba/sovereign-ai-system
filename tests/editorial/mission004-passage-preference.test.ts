import { describe, expect, it } from "vitest";
import {
  distinctiveSupportScore,
  extractArticleClaims,
  isExternallyVerifiableClaim,
} from "../../lib/research/article-claim-extractor";
import { groundedFactVerification } from "../../lib/research/claim-evidence-matcher";
import type { EvidenceRecord } from "../../lib/research/evidence-registry";

// Module under test: article-claim-extractor + claim-evidence-matcher
// Related: research-audit-tutorial-claim-coverage.test.ts
// User: "A correctly supported claim should not fail solely because the platform selected an irrelevant passage when suitable evidence was available." / "Add regression tests for the confirmed failures."

const NIST_CLAIM =
  "The NIST Generative AI Profile identifies generative AI risks that include confabulation, over-reliance and information integrity.";

const WEAK_NIST_PASSAGE =
  "NIST published an Artificial Intelligence Risk Management Framework for organizations seeking trustworthy AI. The framework describes risk management concepts at a high level.";

const STRONG_NIST_PASSAGE =
  "GAI risks include confabulation, the production of confidently stated but erroneous content. Human-AI Configuration interactions can result in automation bias, over-reliance, or emotional entanglement. Information Integrity covers content that may not distinguish fact from opinion.";

describe("mission 004 — passage preference and authorial framing", () => {
  it("prefers the distinctive NIST risk passage over a generic NIST blurb", () => {
    expect(
      distinctiveSupportScore(NIST_CLAIM, STRONG_NIST_PASSAGE),
    ).toBeGreaterThan(
      distinctiveSupportScore(NIST_CLAIM, WEAK_NIST_PASSAGE),
    );

    const weak: EvidenceRecord = {
      id: "nist-weak",
      sourceTitle: "NIST AI RMF landing",
      sourceUrl: "https://www.nist.gov/itl/ai-risk-management-framework",
      sourceType: "government",
      extractedText: WEAK_NIST_PASSAGE,
      confidence: 70,
      requiresHumanReview: true,
    };
    const strong: EvidenceRecord = {
      id: "nist-strong",
      sourceTitle: "NIST AI 600-1",
      sourceUrl: "https://nvlpubs.nist.gov/nistpubs/AI/NIST.AI.600-1.pdf",
      sourceType: "government",
      extractedText: STRONG_NIST_PASSAGE,
      confidence: 90,
      requiresHumanReview: true,
    };

    const verification = groundedFactVerification(
      [
        {
          claim: NIST_CLAIM,
          articleExcerpt: NIST_CLAIM,
          section: "body",
          blockType: "paragraph",
          kind: "factual",
          heading: "Why start with one workflow?",
        },
      ],
      [weak, strong],
      NIST_CLAIM,
      [
        {
          url: weak.sourceUrl,
          title: weak.sourceTitle,
          publisher: "NIST",
        },
        {
          url: strong.sourceUrl,
          title: strong.sourceTitle,
          publisher: "NIST",
        },
      ],
    );

    expect(verification.facts).toHaveLength(1);
    expect(verification.facts[0]?.verificationStatus).toBe(
      "partially verified",
    );
    expect(verification.facts[0]?.evidenceId).toBe("nist-strong");
    expect(verification.facts[0]?.evidenceText).toContain("over-reliance");
  });

  it("treats interpretive NIST workflow framing as authorial, not factual", () => {
    const interpretive =
      "Keeping those decisions with people is a practical response to the over-reliance risks discussed in the NIST Generative AI Profile.";
    expect(isExternallyVerifiableClaim(interpretive)).toBe(false);

    const extracted = extractArticleClaims({
      title: "AI Automation for Creators",
      excerpt: "Build a practical workflow.",
      content: `
## Day 2 — Map the workflow

${interpretive}

Zapier's ChatGPT setup guide lists Conversation as recommended.
`,
    });

    expect(
      extracted.claims.some((claim) =>
        /practical response to the over-reliance/i.test(claim.claim),
      ),
    ).toBe(false);
    expect(
      extracted.authorialAssertions.some((claim) =>
        /practical response to the over-reliance/i.test(claim.claim),
      ),
    ).toBe(true);
  });
});
