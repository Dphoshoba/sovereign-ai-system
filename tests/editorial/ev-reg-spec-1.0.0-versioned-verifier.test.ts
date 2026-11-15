import { describe, expect, it } from "vitest";
import { publicationGuard, researchPublicationBlockReason } from "../../lib/publishing/publication-guard";
import { ADOPTED_AUDIT_SPECIFICATION_VERSION } from "../../lib/research/audit-specification-compatibility";
import { VERSIONED_RESEARCH_AUDIT_ENGINE_REVISION } from "../../lib/research/research-audit-engine-revision";
import {
  isVersionedEditorialVerifierEnabled,
  revisionWrittenByEditorialPrepare,
  VERSIONED_EDITORIAL_VERIFIER_ENABLED,
  VERSIONED_EDITORIAL_VERIFIER_ENV,
  VERSIONED_VERIFIER_ACTIVATION_BLOCKER,
  versionedAverageVerificationScore,
} from "../../lib/research/versioned-publication";

const favourable = {
  consensusScore: 90,
  sourceQualityScore: 90,
  publicationRecommendation: "publish-ready" as const,
  unverifiedCount: 0,
  facts: [
    {
      claim: "Two independent works support the full statement.",
      verificationStatus: "verified",
      verificationMethod: "exact",
      verificationCount: 2,
      supportingSources: [
        { sourceUrl: "https://www.business.gov.au/online/artificial-intelligence" },
        { sourceUrl: "https://www.nist.gov/publications/ai-risk-management-framework" },
      ],
    },
  ],
};

const versioned = {
  ...favourable,
  specificationVersion: ADOPTED_AUDIT_SPECIFICATION_VERSION,
  disputes: [] as Array<Record<string, unknown>>,
  engineRevision: VERSIONED_RESEARCH_AUDIT_ENGINE_REVISION,
  averageVerificationScore: 90,
};

describe("versioned editorial verifier boundary", () => {
  it("keeps Prepare for Review on article-grounded-v14 while activation is disabled", () => {
    expect(VERSIONED_EDITORIAL_VERIFIER_ENABLED).toBe(false);
    expect(isVersionedEditorialVerifierEnabled({})).toBe(false);
    expect(VERSIONED_VERIFIER_ACTIVATION_BLOCKER).toContain("verified non-Production");
    expect(revisionWrittenByEditorialPrepare({})).toBe("article-grounded-v14");
  });

  it("writes article-grounded-ev-reg-1 only when the Preview env flag is true", () => {
    expect(
      isVersionedEditorialVerifierEnabled({
        [VERSIONED_EDITORIAL_VERIFIER_ENV]: "true",
      }),
    ).toBe(true);
    expect(
      revisionWrittenByEditorialPrepare({
        [VERSIONED_EDITORIAL_VERIFIER_ENV]: "true",
      }),
    ).toBe("article-grounded-ev-reg-1");
    expect(
      revisionWrittenByEditorialPrepare({
        [VERSIONED_EDITORIAL_VERIFIER_ENV]: "false",
      }),
    ).toBe("article-grounded-v14");
  });

  it("keeps a zero score inside the versioned average", () => {
    expect(versionedAverageVerificationScore([100, 0])).toBe(50);
    expect(versionedAverageVerificationScore([80])).toBe(80);
  });

  it("accepts a complete versioned audit and fails closed when its metadata is incomplete", () => {
    expect(researchPublicationBlockReason(versioned)).toBeNull();
    expect(researchPublicationBlockReason({ ...versioned, disputes: undefined })).toBe(
      "Versioned audit dispute metadata is missing.",
    );
    expect(researchPublicationBlockReason({ ...versioned, engineRevision: "article-grounded-v14" })).toBe(
      "Versioned audit engine revision is missing.",
    );
    expect(researchPublicationBlockReason({ ...versioned, averageVerificationScore: 50 })).toBe(
      "Versioned audit average verification is below the publication threshold.",
    );
    expect(researchPublicationBlockReason({
      ...versioned,
      disputes: [{ disputeId: "d1", resolution: "unresolved" }],
    })).toBe("An unresolved dispute blocks publication.");
    expect(researchPublicationBlockReason({
      ...versioned,
      disputes: [{
        disputeId: "d1",
        resolution: "not-a-contradiction",
        resolvedDisputeId: "d1",
        resolutionExpired: true,
      }],
    })).toBe("An unresolved dispute blocks publication.");
  });

  it("keeps primary-source support and human approval on separate gates", () => {
    expect(researchPublicationBlockReason({
      ...versioned,
      facts: [
        {
          claim: "Microsoft documentation states a geographic limit.",
          verificationStatus: "partially verified",
          verificationMethod: "single-source-supported",
          verificationCount: 1,
          supportingSources: [{ sourceUrl: "https://learn.microsoft.com/copilot" }],
        },
      ],
    })).toContain("Human review is required");
    expect(publicationGuard("review-required", { hasCurrentAudit: true }).allowed).toBe(false);
    expect(publicationGuard("approved", { hasCurrentAudit: true }).allowed).toBe(true);
    expect(researchPublicationBlockReason({
      ...versioned,
      disputes: [{
        disputeId: "d1",
        resolution: "not-a-contradiction",
        resolvedDisputeId: "d1",
      }],
    })).toBeNull();
  });
});
