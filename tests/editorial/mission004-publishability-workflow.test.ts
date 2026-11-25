import { describe, expect, it } from "vitest";
import { groundedFactVerification } from "../../lib/research/claim-evidence-matcher";
import { consensusEngine } from "../../lib/research/consensus-engine";
import type { EvidenceRecord } from "../../lib/research/evidence-registry";
import type { VerifiedFact } from "../../lib/research/fact-verification-engine";

/**
 * Behaviour: dual-publisher corroboration can reach publish-ready; unsupported stays blocked.
 * Modules: groundedFactVerification, consensusEngine
 * Existing related tests: legacy-audit-safety.test.ts, ev-reg-spec-1.0.0-baseline-characterisation.test.ts
 * User Criterion 4: "A correctly supported article can achieve the appropriate publication recommendation under existing rules." / "An unsupported article remains blocked."
 */

const SHARED_CLAIM =
  "Organizations should document accountability for artificial intelligence risk before a system is deployed.";

const NIST_PAGE = "https://www.nist.gov/artificial-intelligence";
const AIRC_PAGE = "https://airc.nist.gov/AI_RMF_Knowledge_Base/AI_RMF";

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

function factFromVerification(
  claim: string,
  records: EvidenceRecord[],
): VerifiedFact {
  const result = groundedFactVerification(
    [
      {
        claim,
        articleExcerpt: claim,
        section: "body",
        blockType: "paragraph",
        kind: "factual",
        heading: "Results",
      },
    ],
    records,
    claim,
  );
  expect(result.facts).toHaveLength(1);
  return result.facts[0]!;
}

describe("mission 004 — controlled publishability workflow", () => {
  it("gives publish-ready when two independent documents corroborate every claim", () => {
    const fact = factFromVerification(SHARED_CLAIM, [
      evidence(
        "framework",
        NIST_PAGE,
        `${SHARED_CLAIM} The framework page states this directly.`,
      ),
      evidence(
        "resource",
        AIRC_PAGE,
        `${SHARED_CLAIM} The resource center states this separately.`,
      ),
    ]);

    expect(fact.verificationStatus).toBe("verified");
    expect(fact.verificationCount).toBeGreaterThanOrEqual(2);

    const consensus = consensusEngine([fact]);
    expect(consensus.publicationRecommendation).toBe("publish-ready");
    expect(consensus.consensusScore).toBeGreaterThanOrEqual(80);
    expect(consensus.sourceQualityScore).toBeGreaterThanOrEqual(70);
  });

  it("keeps unsupported claims blocked for publication", () => {
    const unrelated = evidence(
      "unrelated-1",
      "https://example.com/glossary",
      "This glossary defines cookies, sessions, and browser storage for web applications.",
    );

    const fact = factFromVerification(SHARED_CLAIM, [unrelated]);
    expect(fact.verificationStatus).toBe("unverified");
    const consensus = consensusEngine([fact]);
    expect(consensus.publicationRecommendation).not.toBe("publish-ready");
  });
});
