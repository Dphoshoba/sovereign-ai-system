import { describe, expect, it } from "vitest";
import type { ArticleClaim } from "../../lib/research/article-claim-extractor";
import type { EvidenceRecord } from "../../lib/research/evidence-registry";
import { ADOPTED_AUDIT_SPECIFICATION_VERSION } from "../../lib/research/audit-specification-compatibility";
import { versionedFactVerification } from "../../lib/research/versioned-prepare-verification";
import { researchPublicationBlockReason } from "../../lib/publishing/publication-guard";
import { VERSIONED_RESEARCH_AUDIT_ENGINE_REVISION } from "../../lib/research/research-audit-engine-revision";
import { legacyResearchPublicationEnvelope } from "../../lib/research/legacy-publication-isolation";

function claim(text: string): ArticleClaim {
  return {
    claim: text,
    articleExcerpt: text,
    section: "body",
    blockType: "paragraph",
    kind: "factual",
  };
}

function evidence(id: string, url: string, text: string, title = "Source"): EvidenceRecord {
  return {
    id,
    sourceTitle: title,
    sourceUrl: url,
    sourceType: "government",
    extractedText: text,
    confidence: 80,
    requiresHumanReview: false,
  };
}

describe("versioned Prepare for Review verification", () => {
  it("collapses same-organisation hosts and keeps a single-source claim not publish-ready", () => {
    const statement =
      "Microsoft documentation states that Copilot features vary by geography.";
    const result = versionedFactVerification(
      [claim(statement)],
      [
        evidence(
          "e1",
          "https://learn.microsoft.com/microsoft-365-copilot",
          statement,
          "Microsoft Learn",
        ),
        evidence(
          "e2",
          "https://support.microsoft.com/copilot",
          statement,
          "Microsoft Support",
        ),
      ],
      statement,
    );

    expect(result.facts).toHaveLength(1);
    expect(result.facts[0].verificationCount).toBe(1);
    expect(result.facts[0].verificationStatus).toBe("partially verified");
    expect(result.specificationVersion).toBe(ADOPTED_AUDIT_SPECIFICATION_VERSION);
    expect(result.disputes).toEqual([]);
    expect(
      researchPublicationBlockReason({
        consensusScore: 90,
        sourceQualityScore: 90,
        publicationRecommendation: "publish-ready",
        unverifiedCount: 0,
        facts: result.facts,
        specificationVersion: result.specificationVersion,
        disputes: result.disputes,
        engineRevision: VERSIONED_RESEARCH_AUDIT_ENGINE_REVISION,
        averageVerificationScore: 90,
      }),
    ).toContain("Human review is required");
  });

  it("requires two independent works for corroboration and keeps zeros in the average", () => {
    const statement =
      "Official guidance says small businesses should check before they rely on an AI feature.";
    const result = versionedFactVerification(
      [claim(statement)],
      [
        evidence(
          "e1",
          "https://www.business.gov.au/online/artificial-intelligence",
          statement,
        ),
        evidence(
          "e2",
          "https://www.nist.gov/publications/ai-risk-management-framework",
          "Unrelated NIST text about risk management frameworks.",
        ),
      ],
      statement,
    );

    expect(result.facts[0].verificationStatus).toBe("partially verified");
    expect(result.averageVerificationScore).toBeLessThan(80);

    const corroborated = versionedFactVerification(
      [claim(statement)],
      [
        evidence(
          "e1",
          "https://www.business.gov.au/online/artificial-intelligence",
          statement,
        ),
        evidence(
          "e2",
          "https://www.nist.gov/publications/ai-risk-management-framework",
          statement,
        ),
      ],
      statement,
    );
    expect(corroborated.facts[0].verificationStatus).toBe("verified");
    expect(corroborated.facts[0].verificationCount).toBe(2);
  });

  it("fails closed when versioned dispute metadata is missing and keeps legacy JSON non-authoritative", () => {
    const statement = "Two independent works support the full statement.";
    const result = versionedFactVerification(
      [claim(statement)],
      [
        evidence("e1", "https://www.business.gov.au/guide", statement),
        evidence("e2", "https://www.nist.gov/guide", statement),
      ],
      statement,
    );

    expect(
      researchPublicationBlockReason({
        consensusScore: 90,
        sourceQualityScore: 90,
        publicationRecommendation: "publish-ready",
        unverifiedCount: 0,
        facts: result.facts,
        specificationVersion: result.specificationVersion,
        engineRevision: VERSIONED_RESEARCH_AUDIT_ENGINE_REVISION,
        averageVerificationScore: 90,
      }),
    ).toBe("Versioned audit dispute metadata is missing.");

    const envelope = legacyResearchPublicationEnvelope({ approved: true });
    expect(envelope.articlePublicationAuthorised).toBe(false);
  });
});
