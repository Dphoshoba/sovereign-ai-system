/**
 * Executable characterisation of article-grounded-v14.
 * Contract outcomes live in ev-reg-spec-1.0.0-future-contract.specification.ts
 * and are checked here only as recorded expectations, not as matcher results.
 */
import { describe, expect, it } from "vitest";
import { publicationGuard, researchPublicationBlockReason } from "../../lib/publishing/publication-guard";
import { computeArticleAuditFingerprint } from "../../lib/research/article-audit-fingerprint";
import type { ArticleClaim } from "../../lib/research/article-claim-extractor";
import { groundedFactVerification } from "../../lib/research/claim-evidence-matcher";
import {
  evidenceCorroborationKey,
  publishersForSource,
  qualifyingPublicationSourceIdentity,
} from "../../lib/research/claim-source-attribution";
import { consensusEngine } from "../../lib/research/consensus-engine";
import type { EvidenceRecord } from "../../lib/research/evidence-registry";
import type { VerifiedFact } from "../../lib/research/fact-verification-engine";
import { publicationGate } from "../../lib/research/publication-gate";
import { isCurrentResearchAuditEngineRevision } from "../../lib/research/research-audit-engine-revision";
import {
  FIXTURE_TEXT,
  FIXTURE_URLS,
  FUTURE_CONTRACT_CASES,
  T_NEW_SPAN_CONTRACT,
  T_RESOLVED_CONTRACT,
} from "./ev-reg-spec-1.0.0-future-contract.specification";

const FAVOURABLE = {
  consensusScore: 90,
  sourceQualityScore: 90,
  publicationRecommendation: "publish-ready" as const,
  unverifiedCount: 0,
};

function claimOf(claim: string): ArticleClaim {
  return {
    claim,
    articleExcerpt: claim,
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
    sourceType: "documented-source",
    extractedText: text,
    confidence: 90,
    requiresHumanReview: true,
  };
}

function characterise(
  claim: string,
  passages: Array<{ id: string; url: string; text: string; title?: string }>,
) {
  const verification = groundedFactVerification(
    [claimOf(claim)],
    passages.map((passage) => evidence(passage.id, passage.url, passage.text, passage.title)),
    claim,
    passages.map((passage) => ({ url: passage.url, title: passage.title ?? "Source" })),
  );
  return verification.facts[0];
}

function guardFor(fact: {
  claim: string;
  verificationStatus: string;
  verificationMethod: string;
  verificationCount: number;
  supportingSources: Array<{ sourceUrl: string }>;
}) {
  return researchPublicationBlockReason({
    ...FAVOURABLE,
    facts: [fact],
  });
}

describe("EV-REG-SPEC-1.0.0 recorded contract expectations", () => {
  it("keeps every section 14 fixture out of the executable suite", () => {
    expect(FUTURE_CONTRACT_CASES.every((entry) => entry.executable === false)).toBe(true);
    expect(FUTURE_CONTRACT_CASES.map((entry) => entry.id)).toEqual([
      "T-SAME-ORG",
      "T-NARROW",
      "T-RESOLVED",
      "T-NEW-SPAN",
      "T-JOINT",
      "T-JOINT-PLUS-SECOND-WORK",
      "T-TWO-WORKS",
    ]);
  });

  it("expects T-RESOLVED to be primary-source supported only after its own dispute is resolved", () => {
    expect(T_RESOLVED_CONTRACT.evidenceState).toBe("primary-source supported");
    expect(T_RESOLVED_CONTRACT.identityCount).toBe(1);
    expect(T_RESOLVED_CONTRACT.identities).toEqual(["publisher:microsoft"]);
    expect(T_RESOLVED_CONTRACT.verificationMethod).toBe("single-source-supported");
    expect(T_RESOLVED_CONTRACT.publication).toBe("not publish-ready");
    expect(T_RESOLVED_CONTRACT.disputeIds).toHaveLength(1);
    expect(T_RESOLVED_CONTRACT.note).toContain("No other dispute remains");
  });

  it("gives a newly discovered contradictory span its own dispute id", () => {
    expect(T_NEW_SPAN_CONTRACT.evidenceState).toBe("disputed");
    expect(T_NEW_SPAN_CONTRACT.verificationMethod).toBe("disputed");
    expect(T_NEW_SPAN_CONTRACT.verificationScore).toBe(0);
    expect(T_NEW_SPAN_CONTRACT.compatibilityStatus).toBe("unverified");
    expect(T_NEW_SPAN_CONTRACT.disputeIds[0]).toBe(T_RESOLVED_CONTRACT.disputeIds[0]);
    expect(T_NEW_SPAN_CONTRACT.disputeIds[1]).not.toBe(T_RESOLVED_CONTRACT.disputeIds[0]);
  });
});

describe("baseline characterisation of the section 14 fixtures", () => {
  it("counts Learn and Support as two identities for an unattributed claim", () => {
    const fact = characterise(FIXTURE_TEXT.sameOrgClaim, [
      { id: "learn", url: FIXTURE_URLS.learn, text: FIXTURE_TEXT.sameOrgClaim },
      { id: "support", url: FIXTURE_URLS.support, text: FIXTURE_TEXT.sameOrgClaim },
    ]);
    const consensus = consensusEngine([fact]);

    expect(fact.verificationCount).toBe(2);
    expect(fact.verificationStatus).toBe("verified");
    expect(fact.verificationMethod).toBe("exact");
    expect(guardFor(fact)).toBeNull();
    expect(consensus.publicationRecommendation).toBe("publish-ready");
  });

  it("does not count the narrower Google sentence toward the full review claim", () => {
    const fact = characterise(FIXTURE_TEXT.narrowClaim, [
      { id: "learn", url: FIXTURE_URLS.learn, text: FIXTURE_TEXT.narrowClaim },
      { id: "gmail", url: FIXTURE_URLS.gmail, text: FIXTURE_TEXT.narrowGoogle },
    ]);

    expect(fact.verificationCount).toBe(1);
    expect(fact.verificationStatus).toBe("partially verified");
    expect(fact.verificationMethod).toBe("single-source-supported");
    expect(fact.supportingSources.map((source) => source.sourceUrl)).toEqual([FIXTURE_URLS.learn]);
    expect(guardFor(fact)).toContain("Human review is required");
  });

  it("treats the resolved-dispute fixture as one Microsoft source and stores no dispute", () => {
    const fact = characterise(FIXTURE_TEXT.resolvedClaim, [
      { id: "learn", url: FIXTURE_URLS.learn, text: FIXTURE_TEXT.resolvedClaim },
      { id: "support", url: FIXTURE_URLS.support, text: FIXTURE_TEXT.resolvedNarrow },
    ]);

    expect(fact.verificationCount).toBe(1);
    expect(fact.verificationStatus).toBe("partially verified");
    expect(fact.verificationMethod).toBe("single-source-supported");
    expect(fact.verificationScore).toBeGreaterThan(0);
    expect(fact).not.toHaveProperty("evidenceState");
    expect(fact).not.toHaveProperty("disputes");
    expect(guardFor(fact)).toContain("Human review is required");
  });

  it("still counts a contradictory span as support when it shares the publisher key", () => {
    const fact = characterise(FIXTURE_TEXT.resolvedClaim, [
      { id: "learn", url: FIXTURE_URLS.learn, text: FIXTURE_TEXT.resolvedClaim },
      { id: "support", url: FIXTURE_URLS.support, text: FIXTURE_TEXT.resolvedNarrow },
      { id: "span", url: FIXTURE_URLS.learn, text: FIXTURE_TEXT.newSpan },
    ]);

    expect(fact.verificationCount).toBe(1);
    expect(fact.verificationStatus).toBe("partially verified");
    expect(fact.verificationMethod).not.toBe("disputed");
    expect(fact.verificationScore).toBeGreaterThan(0);
    expect(fact.supportingSources.map((source) => source.sourceUrl)).toContain(FIXTURE_URLS.learn);
    expect(guardFor(fact)).toContain("Human review is required");
  });

  it("counts one joint PDF as one hostname", () => {
    const fact = characterise(FIXTURE_TEXT.jointClaim, [
      {
        id: "pdf",
        url: FIXTURE_URLS.jointPdf,
        title: "NSA, CISA, and ACSC joint cybersecurity information sheet",
        text: FIXTURE_TEXT.jointClaim,
      },
    ]);

    expect(fact.verificationCount).toBe(1);
    expect(fact.verificationStatus).toBe("partially verified");
    expect(fact.verificationMethod).toBe("single-source-supported");
    expect(
      evidenceCorroborationKey(
        FIXTURE_TEXT.jointClaim,
        { url: FIXTURE_URLS.jointPdf, title: "NSA, CISA, and ACSC" },
      ),
    ).toBe("www.cisa.gov");
    expect(guardFor(fact)).toContain("Human review is required");
  });

  it("counts a joint PDF plus a NIST page as two hostnames", () => {
    const fact = characterise(FIXTURE_TEXT.jointClaim, [
      { id: "pdf", url: FIXTURE_URLS.jointPdf, text: FIXTURE_TEXT.jointClaim },
      { id: "nist", url: FIXTURE_URLS.nist, text: FIXTURE_TEXT.jointClaim },
    ]);

    expect(fact.verificationCount).toBe(2);
    expect(fact.verificationStatus).toBe("verified");
    expect(fact.verificationMethod).toBe("exact");
    expect(
      evidenceCorroborationKey(FIXTURE_TEXT.jointClaim, { url: FIXTURE_URLS.nist, title: "NIST" }),
    ).toBe("www.nist.gov");
    expect(guardFor(fact)).toBeNull();
  });

  it("drops business.gov.au when the claim names NIST and keeps only that publisher", () => {
    const fact = characterise(FIXTURE_TEXT.twoWorksClaim, [
      { id: "business", url: FIXTURE_URLS.business, text: FIXTURE_TEXT.twoWorksClaim },
      { id: "nist", url: FIXTURE_URLS.nist, text: FIXTURE_TEXT.twoWorksClaim },
    ]);

    expect(fact.verificationCount).toBe(1);
    expect(fact.verificationStatus).toBe("partially verified");
    expect(fact.verificationMethod).toBe("single-source-supported");
    expect(fact.supportingSources.map((source) => source.sourceUrl)).toEqual([FIXTURE_URLS.nist]);
    expect(
      evidenceCorroborationKey(FIXTURE_TEXT.twoWorksClaim, {
        url: FIXTURE_URLS.business,
        title: "business.gov.au",
      }),
    ).toBe("www.business.gov.au");
    expect(
      evidenceCorroborationKey(FIXTURE_TEXT.twoWorksClaim, {
        url: FIXTURE_URLS.nist,
        title: "NIST AI RMF",
      }),
    ).toBe("publisher:nist");
    expect(guardFor(fact)).toContain("Human review is required");
  });
});

describe("baseline characterisation of the safety boundaries", () => {
  it("accepts a passage whose actor differs when the remaining tokens overlap", () => {
    const fact = characterise(FIXTURE_TEXT.actorClaim, [
      { id: "learn", url: FIXTURE_URLS.learn, text: FIXTURE_TEXT.actorPassage },
    ]);

    expect(fact.verificationCount).toBe(1);
    expect(fact.verificationStatus).toBe("partially verified");
    expect(fact.verificationScore).toBeGreaterThan(0);
  });

  it("does not bind a Power Platform sentence to publisher:microsoft unless the claim names Microsoft or Copilot", () => {
    const fact = characterise(FIXTURE_TEXT.powerPlatformClaim, [
      { id: "learn", url: FIXTURE_URLS.learn, text: FIXTURE_TEXT.powerPlatformClaim },
    ]);

    expect(fact.verificationCount).toBe(1);
    expect(fact.verificationStatus).toBe("partially verified");
    expect(
      evidenceCorroborationKey(FIXTURE_TEXT.powerPlatformClaim, { url: FIXTURE_URLS.learn }),
    ).toBe("learn.microsoft.com");
    expect(guardFor(fact)).toContain("Human review is required");
  });

  it("lets a Microsoft title on an unrelated host take the Microsoft publisher key", () => {
    const spoof = {
      url: "https://evil.example/library/microsoft",
      title: "Microsoft documentation",
    };
    expect(publishersForSource(spoof)).toContain("microsoft");
    expect(
      evidenceCorroborationKey("Microsoft documentation states the product requirement.", spoof),
    ).toBe("publisher:microsoft");
    expect(qualifyingPublicationSourceIdentity(
      "Teams can record a meeting summary for later review by the organiser.",
      spoof.url,
    )).toBe("evil.example");
  });

  it("keeps two unknown subdomains as two publication identities", () => {
    expect(qualifyingPublicationSourceIdentity(
      "A public report describes the same documented control.",
      "https://a.example.com/report",
    )).toBe("a.example.com");
    expect(qualifyingPublicationSourceIdentity(
      "A public report describes the same documented control.",
      "https://b.example.com/report",
    )).toBe("b.example.com");
  });

  it("scores a path containing .gov higher than the same host without that substring", () => {
    const claim = "The agency report states that organisations should validate an AI system before using it.";
    const inflated = characterise(claim, [
      { id: "path", url: "https://example.com/files/.gov/report", text: claim },
    ]);
    const plain = characterise(claim, [
      { id: "plain", url: "https://example.com/files/report", text: claim },
    ]);

    expect(inflated.verificationScore).toBe(65);
    expect(plain.verificationScore).toBe(53);
  });

  it("ignores a specification version and a missing disputes array on an otherwise complete audit", () => {
    expect(isCurrentResearchAuditEngineRevision("article-grounded-v14")).toBe(true);
    const complete = {
      ...FAVOURABLE,
      specificationVersion: "EV-REG-SPEC-1.0.0",
      facts: [
        {
          claim: FIXTURE_TEXT.twoWorksClaim,
          verificationStatus: "verified",
          verificationMethod: "exact",
          verificationCount: 2,
          supportingSources: [
            { sourceUrl: FIXTURE_URLS.business },
            { sourceUrl: FIXTURE_URLS.nist },
          ],
        },
      ],
    };

    expect(researchPublicationBlockReason(complete)).toBeNull();
    expect(complete).not.toHaveProperty("disputes");
  });

  it("does not let the legacy publication decision satisfy the article guard", () => {
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

    expect(decision.approved).toBe(true);
    expect(decision.status).toBe("publish-ready");
    expect(researchPublicationBlockReason(decision)).toBe(
      "Current research audit is not publish-ready.",
    );
  });

  it("separates approval status from the research publication block", () => {
    expect(publicationGuard("review-required", { hasCurrentAudit: true }).allowed).toBe(false);
    expect(publicationGuard("approved", { hasCurrentAudit: true }).allowed).toBe(true);
    const singleSource = characterise(FIXTURE_TEXT.resolvedClaim, [
      { id: "learn", url: FIXTURE_URLS.learn, text: FIXTURE_TEXT.resolvedClaim },
    ]);
    expect(guardFor(singleSource)).toContain("Human review is required");
  });

  it("changes the content fingerprint when article text changes and ignores a confirmation field", () => {
    const article = {
      title: "Governed AI workflows",
      excerpt: "Evidence-backed operations.",
      content: FIXTURE_TEXT.resolvedClaim,
      category: "ai-tools",
      seoTitle: "Governed AI workflows",
      seoDescription: "Build accountable AI workflows.",
      seoKeywords: "AI governance",
    };
    const urls = [FIXTURE_URLS.learn];
    const current = computeArticleAuditFingerprint(article, urls);
    const edited = computeArticleAuditFingerprint(
      { ...article, content: `${article.content} A new limitation was added.` },
      urls,
    );

    expect(edited).not.toBe(current);
    expect(researchPublicationBlockReason({
      ...FAVOURABLE,
      confirmationNote: "confirmed",
      facts: [
        {
          claim: FIXTURE_TEXT.resolvedClaim,
          verificationStatus: "partially verified",
          verificationMethod: "single-source-supported",
          verificationCount: 1,
          supportingSources: [{ sourceUrl: FIXTURE_URLS.learn }],
        },
      ],
    })).toContain("Human review is required");
  });

  it("excludes zero scores from the stored matcher average and omits the consensus average", () => {
    const supported = characterise(FIXTURE_TEXT.sameOrgClaim, [
      { id: "learn", url: FIXTURE_URLS.learn, text: FIXTURE_TEXT.sameOrgClaim },
    ]);
    const unsupportedClaim = "The archived brochure claims a precise revenue gain from the unpublished pilot.";
    const unsupported = characterise(unsupportedClaim, [
      { id: "none", url: "https://example.com/brochure", text: "No matching sentence appears here." },
    ]);
    const verification = groundedFactVerification(
      [claimOf(FIXTURE_TEXT.sameOrgClaim), claimOf(unsupportedClaim)],
      [
        evidence("learn", FIXTURE_URLS.learn, FIXTURE_TEXT.sameOrgClaim),
        evidence("none", "https://example.com/brochure", "No matching sentence appears here."),
      ],
      `${FIXTURE_TEXT.sameOrgClaim} ${unsupportedClaim}`,
    );
    const consensus = consensusEngine([supported, unsupported]);

    expect(verification.facts.map((fact) => fact.verificationScore)).toEqual([
      supported.verificationScore,
      0,
    ]);
    expect(verification.averageVerificationScore).toBe(supported.verificationScore);
    expect(consensus).not.toHaveProperty("averageVerificationScore");
    expect(consensus.publicationRecommendation).not.toBe("publish-ready");
  });

  it("does not treat a theme with two documents as per-claim corroboration", () => {
    const firstClaim = "Some collaboration software can produce a written summary of a meeting for the project team.";
    const secondClaim = "Some collaboration software can produce a written summary of a meeting for the client team.";
    const first: VerifiedFact = characterise(firstClaim, [
      { id: "learn", url: FIXTURE_URLS.learn, text: firstClaim },
    ]);
    const second: VerifiedFact = characterise(secondClaim, [
      { id: "support", url: FIXTURE_URLS.support, text: secondClaim },
    ]);
    const consensus = consensusEngine([first, second]);
    const grouped = consensus.consensusGroups.find((group) => group.facts.length === 2);

    expect(first.verificationCount).toBe(1);
    expect(second.verificationCount).toBe(1);
    expect(grouped?.sourceCount).toBe(2);
    expect(grouped?.consensusStatement).toContain("Independent sources support this statement");
    expect(consensus.publicationRecommendation).not.toBe("publish-ready");
  });
});
